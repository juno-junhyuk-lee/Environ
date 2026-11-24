import copy 
import json 
import os
from typing import Literal 
from google import genai 
from google.genai import types 
from pydantic import BaseModel, Field 


client = genai.Client()
model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

class TileState(BaseModel):
    id: str = Field(description="Tile identifier, e.g., hex_0_1")
    type: Literal["settlement", "forest", "water"]
    condition: float = Field(ge=0.0, le=100.0, description="Tile condition between 0.0 and 100.0 rounded to 1 decimal place")
    aqi: float = Field(description="Per-tile AQI for this year (unsvaed)")

class HazardEvent(BaseModel):
    event: str = Field(description="Name of the generated event")
    description: str = Field(description="3-5 short sentences explaining effects on the tile and adjacent neighbors under two-phase yearly rules")
    new_board: list[TileState] = Field(description="Updated board JSON after applying the yearly rules and event")




world_rules = """
    You explain the yearly island simulation steps using Worldly metrics and returned structured results. 
    Rules:
    1. Each step is 1 year (default time step interval is 10000 milliseconds; 10000 ms = 10s;  pacing never changes simulation of the math). 
    2. Updates are two-phase and order independent: all tiles read from the start of the year board (6 axial neighbors, radius 1 only), producing a new board without mutating the input board.
    3. Tile conditions stay in 0-100 with 1 decimal place so small changes (ex., +0.9) accumulate across years. 
    4. Yearly order: draw weather from temperature -> update carbon from settlement vs forest totals -> ease temperature toward carbon-driven target ->  update tiles using temperature, weather, and per-tile AQI. 
    5. Climate factors scale growth (forest/settlement) or recharge (water) only. Pressure, use, Allee effects, yearly delta caps, and conversions are never used.
    6. Water never converts; forest at 0 converts to settlement at condition 30.0; settlement at 0 converts to a forest at condition 30.0. 
    7. AQI is per-tile and unsaved; saved worldly state contains only temperatureC, carbon, weather (defaults: 15, 50, sunny). 
    8. Starter board has 19 tiles (5 settlements, 6 forests, 8 water, all starting at 50.0) where every settlement touches >= 1 forest and >= 1 water tile. Left alone, settlements can grow for decades with carbon being a value of 50 and temperature being 15 degrees celisus, while removing adjacent forests makes towns shrink and potentially flip to forest. 
    9. Stay strictly grounded in the provided numbers and state. 
"""
def normalize_board(previous_board: list[dict], candidate_tiles: list[TileState]) -> list[dict]:
    prev_map = {t["id"]: t for t in previous_board}
    next_map = {t.id: t for t in candidate_tiles}

    result = []
    for tile_id, prev_tile in prev_map.items():
        updated = next_map.get(tile_id)
        if updated is None:
            result.append(copy.deepcopy(prev_tile))
            continue 

        clamped_condition = round(max(0.0, min(100.0, updated.condition)), 1)
        tile_type = prev_tile["type"] if prev_tile["type"] == "water" else updated.type 

        result.append({
            "id": tile_id, 
            "type": tile_type,
            "condition": clamped_condition, 
            "aqi": round(max(0.0, updated.aqi), 1)
        })

    return result 

def run_year_step(year: int, current_board: list[dict]) -> dict:
    user_prompt = """
    Year transition: year {year} -> year {year + 1} (step interval = 10000 ms)
    Worldy state: temperatureC = 15.0, carbon= 50.0, weather=sunny 
    Board summary: 19 tiles (5 settlements, 6 forests, 8 water), starting from balanced starter layout 
    Sample Tile: id=hex_0_1, type=settlement, C=50.0 -> next_C=50.9, F=50.0, W=50.0, S=0.5, K=55.0, AQI=75.0
    Current board:
    {json.dumps(current_board, indent=2)}

    Generate an event that could take place in the worldly state and explain in 3-5 short sentences how it could affect this tile and its adjacent neighbors in one year under the two-phase and yearly rules. Return JSON with event, description, and new_board.
    """

    response = client.models.generate_content(
        model=model_name,
        contents= user_prompt, 
        config=types.GenerateContentConfig(
            system_instruction=world_rules.strip(), 
            temperature=0.2, 
            response_mime_type="application/json", 
            response_schema=HazardEvent,
        ), 
    )

    if not response.parsed:
        raise RuntimeError(f"Expected structured JSON response, got: {response.text}")
    
    cleaned_board = normalize_board(current_board, response.parsed.new_board)
    return {
        "event": response.parsed.event, 
        "description": response.parsed.description, 
        "new_board": cleaned_board 
    }

def run_pipeline(years: int = 3) -> list[dict]:
    board = [
        {"id": "hex_0_0", "type": "water", "condition": 50.0, "aqi": 20.0},
        {"id": "hex_0_1", "type": "settlement", "condition": 50.0, "aqi": 75.0},
        {"id": "hex_0_2", "type": "forest", "condition": 50.0, "aqi": 15.0},
        {"id": "hex_1_0", "type": "forest", "condition": 50.0, "aqi": 15.0},
        {"id": "hex_1_1", "type": "settlement", "condition": 50.0, "aqi": 75.0},
        {"id": "hex_1_2", "type": "water", "condition": 50.0, "aqi": 20.0},
    ]

    pipeline_outputs = []
    for year in range(1, years + 1):
        step_output = run_year_step(year=year, current_board=board)
        pipeline_outputs.append(step_output)
        board = step_output["new_board"]

    return pipeline_outputs 

if __name__ == "__main__":
    results = run_pipeline(years=2)
    print(json.dumps(results[-1], indent=2))


