# World simulation (years passing)

Each simulation step is one year. Every year, every tile updates from its own
condition and its six axial neighbours (radius 1 only). Updates are **two-phase**:
the next condition for every tile is computed from the board at the start of the
year, then a new board is built. Order of processing does not matter, and the
input board is never mutated.

Condition values stay in **0–100** with **one decimal place**, so small yearly
changes (for example +0.9) accumulate instead of rounding away to zero.

Wall-clock pacing is **1 year = 10 seconds** (`DEFAULT_TIME_STEP_INTERVAL_MS =
10000`). Changing that interval only changes how often a step runs; it does not
change any simulation math.

## Why v1 was replaced

The first rules used flat point rates (forest +3, −8 per neighbouring settlement,
and similar hard numbers for water and settlements). That ignored neighbour
_quality_, created a hard “healthy at 50” cliff for settlements, and could not
express soft growth that slows near capacity. The v2 model below is logistic:
growth depends on current condition, resource quality, and settlement load, with
explicit caps so one bad year cannot erase a tile instantly. Climate factors
scale growth or recharge only; pressure, use, Allee, caps, and conversions stay
as written.

## Default mixed world

The starter board mixes the three elements so every settlement already touches
at least one forest neighbour and at least one water neighbour. Counts are
**5 settlements**, **6 forests**, and **8 water** (19 tiles), all starting at
condition 50. Left alone, towns can grow under these rules: settlements survive
for decades, carbon stays near 50, and temperature holds near 15 °C. A player who
strips forests away from towns will still see those towns shrink and eventually
flip to forest.

## SSDS mapping

| Requirement   | How this module meets it                                                            |
| ------------- | ----------------------------------------------------------------------------------- |
| **2.5–2.6**   | Two-phase yearly update via `applyToBoard`                                          |
| **2.10–2.12** | Forest↔settlement conversion at 0; water never converts                             |
| **2.15**      | Rates live in adjustable `SIMULATION_RATES`                                         |
| Timing note   | SSDS mentioned a provisional 2-second step; this build uses **10 seconds** per year |

## Worldly metrics

Besides each tile’s health, the simulation tracks a climate picture of the
island. A player eventually sees four ideas:

- **Air quality** — how breathable it feels around a tile this year (cleaner
  near forests, dirtier near towns). Recalculated every year; not saved.
- **Carbon** — a 0–100 score of how settlement-heavy the island is versus
  forest. Starts at **50**. Saved.
- **Temperature (°C)** — how warm the island is. Starts at **15**. Saved.
- **Weather** — this year’s sky: sunny, rainy, cloudy, drought, or storm.
  Starts **sunny**. Saved.

Each year, in order: weather is drawn from the current temperature; carbon
updates from the board’s settlement and forest totals; temperature eases toward
a carbon-driven target; then every tile updates using that temperature and
weather (plus local air quality). Climate is held on the `World` value
(`worldly`) and written into saves.

At the edges: a town with no forest nearby shrinks and can flip to forest; a
forest that hits zero flips to a small town; water never flips. One bad year
cannot wipe a tile because yearly change is capped. Old saves that never stored
climate load with the defaults above.

### 1. How a tile changes in one year

Notation used below:

| Symbol         | Meaning                                                          |
| -------------- | ---------------------------------------------------------------- |
| **C**          | This tile’s condition (0–100).                                   |
| **F**          | Mean condition of adjacent forests (0 if none).                  |
| **W**          | Mean condition of adjacent water tiles (0 if none).              |
| **S**          | Settlement load: sum of adjacent settlement conditions ÷ 100.    |
| **K**          | Settlement carrying capacity: `10 + 90 × √((F/100) × (W/100))`.  |
| **Ft, Fw, Fa** | Forest temperature, weather, and air factors (see §2).           |
| **Wt, Ww**     | Water temperature and weather factors (water has no air factor). |
| **St, Sw, Sa** | Settlement temperature, weather, and air factors.                |

`clamp` is `clampCondition` (0–100, one decimal). `cap(Δ, min, max)` bounds the
yearly change. Neighbours are the six axial cells from `getNeighbors` only.

**Forest**

```
next = clamp(C + cap(
  0.1 × C × (1 − C/100) × (0.8 + 0.4 × W/100) × Ft × Fw × Fa
  − 0.15 × C × S,
  −8, 6))
```

**Water** (here **C** is this water tile’s own condition; no air factor)

```
next = clamp(C + cap(
  0.1 × (100 − C) × (0.6 + 0.6 × F/100) × Wt × Ww
  − 0.12 × C × S,
  −8, 6))
```

**Settlement**

```
next = clamp(C + cap(
  0.08 × C × (1 − C/K) × St × Sw × Sa
  − (1.5 if C < 18 else 0),
  −5, 4))
```

**Conversions** (after clamping to 0–100): forest at 0 becomes a settlement at
30; settlement at 0 becomes a forest at 30; water never converts. Restart 30 is
a design choice applied only in `convertTile` (newly placed tiles still use
element `defaultCondition` 50).

Passing no climate context into `applyToBoard` / `evaluate*` keeps the plain v2
rules (all climate factors treated as absent). The time loop always supplies a
context.

### 2. Factor glossary

Climate scales **growth** (forest / settlement) or **recharge** (water) only.
Pressure, use, Allee, Δ caps, and conversions are never scaled. All values come
from `WORLDLY_RATES`. At sunny / 15 °C every climate multiplier is 1.0
(`NEUTRAL_CONTEXT`).

The **air factor** is derived per tile each year via `airQualityOf` and is
**never stored**.

| Factor           | Forest                                                        | Water                                        | Settlement                                   |
| ---------------- | ------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Temperature      | T &lt; 10 → 0.85; T ≤ 20 → 1.0; else max(0.5, 1 − 0.1×(T−20)) | T ≤ 15 → 1.0; else max(0.6, 1 − 0.04×(T−15)) | T ≤ 22 → 1.0; else max(0.8, 1 − 0.07×(T−22)) |
| Weather: sunny   | 1                                                             | 1                                            | 1                                            |
| Weather: rainy   | 1.2                                                           | 1.5                                          | 1                                            |
| Weather: cloudy  | 0.9                                                           | 1                                            | 1                                            |
| Weather: drought | 0.5                                                           | 0.3                                          | 0.9                                          |
| Weather: storm   | 0.7                                                           | 1.3                                          | 0.9                                          |
| Air              | 0.7 + 0.3 × AQI/100                                           | — (none)                                     | 0.8 + 0.2 × AQI/100                          |

`ruleModifiersFor(T, weather)` multiplies the temperature row by the matching
weather row per element; the air row is applied separately from the tile’s AQI.

### 3. The four climate numbers

**Air quality** is the fourth metric and the only derived one. It is **per
tile**, not one world number. It is recomputed fresh every year from the board:
towns nearby make it worse and forests nearby make it better. It is never
stored and never saved. The saved JSON carries only temperature, carbon, and
weather; on load, air quality is recomputed from the loaded board, so nothing is
lost.

```
AQI = clamp(
  100
  − 0.5 × (mean adjacent settlement)
  − 0.3 × (own settlement condition, else 0)
  + 0.3 × (mean adjacent forest)
)
```

Range 0–100. Not saved.

**Carbon** (global, saved; default 50)

```
carbon' = clamp(carbon + 0.01 × (Σ settlement conditions − Σ forest conditions))
```

**Temperature** (global °C, saved; default 15)

```
target = 15 + (carbon − 50) × 0.2
temperature' = round1(temperature + 0.1 × (target − temperature))
```

**Weather** (global, saved; default sunny)

Kinds: sunny, rainy, cloudy, drought, storm. Base weights: sunny 35, rainy 25,
cloudy 20, drought 10, storm 10. Drought gains `2 × max(0, temperature − 20)`
taken from sunny, with sunny floored at 0 so the total stays 100. Drawn with a
seeded RNG (`rng() × 100` against cumulative weights in that order). Missing RNG
falls back to `createSeededRng(Date.now())`.

Yearly orchestration in `advanceStep`: draw weather → update carbon → update
temperature → `applyToBoard(board, ctx)` → year += 1 → `onStep`.

### 4. Defaults, saves, and edge cases

| Field        | Default   | Saved? |
| ------------ | --------- | ------ |
| temperatureC | 15        | Yes    |
| carbon       | 50        | Yes    |
| weather      | sunny     | Yes    |
| air quality  | (derived) | No     |

Saves stay format `environ-world` version **1**. The optional `worldly` object
holds exactly `temperatureC`, `carbon`, and `weather`. A saved JSON file now
carries the current climate from app state, and loading restores it onto
`World.worldly`. Air quality is not in the file; it is recomputed from the
loaded board. Old saves without `worldly` load with the defaults. Invalid
climate in a save is rejected and the board is left alone.

NaN temperature or carbon in runtime state falls back to 15 / 50; unknown
weather falls back to sunny. Yearly Δ caps and conversions behave as in §1.

### 5. Files

- `rules.ts` — `SIMULATION_RATES`, evaluate\*, convertTile, applyToBoard
- `worldly.ts` — air quality, carbon, temperature, weather, modifiers, sanitize
- `world.ts` — `World` (board + year + worldly), mixed `createDefaultWorld`
- `tile.ts` — condition helpers and 1-decimal clamp
- `time.ts` — year clock / pause / resume / worldly step order
- `save.ts` — serialize / validate / export / localStorage helpers with worldly
- `index.ts` — public exports
