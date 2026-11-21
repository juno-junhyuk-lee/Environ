# Environ Backend

Python API for Environ. See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for setup.

## Gemini API smoke test

This command makes one short API request; it does not connect to the simulation.
Use a Gemini API project on the free tier and a model with available free-tier
quota. A paid chat subscription is not required.

1. Sign into [Google AI Studio](https://aistudio.google.com/apikey) and create a
   development API key for a free-tier project. Check the project's rate limits
   and choose a model with free-tier quota. Keep billing disabled for this test.
2. From `backend/`, install dependencies and create your local configuration:

   ```bash
   uv sync
   cp -n .env.example .env
   ```

3. Edit `.env`: set `GEMINI_API_KEY` to your key and `GEMINI_MODEL` to your
   selected model's exact API ID from AI Studio. The template uses
   `gemini-3.1-flash-lite`. Keep the key in the backend only.
   `.env` is ignored by Git; never put the key in frontend variables or logs.
4. Run:

   ```bash
   uv run --env-file .env python -m app.llm_smoke
   ```

Expected response: `Environ API connected`. The command exits with status 0 on
a complete text response and 1 on missing configuration or a failed request.
Requests have a 20-second timeout, no automatic retries, and a 1,024-token output
limit (including any thinking tokens). Free-tier calls are subject to quotas;
not all models offer free access. See [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
Free-tier content may be used to improve Google products; use synthetic world
data for development.

For HTTP errors, check the key, model access, and quota in AI Studio. A 429 error
means a quota or rate limit was reached; wait for it to reset or choose another
eligible model. Connection errors and timeouts can be retried manually. Error
messages omit provider response bodies and credentials.

## Gemini First Call Test 

After running the API smoke test and receiving the response: `Environ API connected`. You can test the first_call.py file by running this command:

      ```bash 
      uv run --env-file .env python first_call.py 
      ```

Expected response: Pollution acts as a silent disruptor to ecosystems, altering the delicate balance required for life to thrive. When pollutants—whether chemical, physical, or biological—enter water and forest systems, the effects are often cascading and long-lasting.

Here is an explanation of how pollution affects these two vital environments.

---

### 1. The Impact on Bodies of Water
Water is a solvent, meaning it easily dissolves and carries pollutants, spreading their impact far beyond the point of origin.

*   **Eutrophication (Nutrient Pollution):** Runoff from farms and lawns contains high levels of nitrogen and phosphorus (from fertilizers). These chemicals act as "super-food" for algae, causing massive blooms. As these algae die and decompose, they consume almost all the dissolved oxygen in the water, creating "dead zones" where fish and other aquatic life cannot survive.
*   **Bioaccumulation and Biomagnification:** Heavy metals like mercury and industrial chemicals like PCBs do not break down easily. They are absorbed by small organisms (plankton) and move up the food chain. As larger predators (fish, birds, humans) eat smaller prey, the concentration of toxins increases, leading to reproductive failure, disease, and death in top-tier predators.
*   **Acidification:** When water bodies absorb excess carbon dioxide from the atmosphere, they become more acidic. This is particularly devastating to marine life like corals and shellfish, which struggle to build their calcium carbonate shells in acidic water, threatening the structural foundation of entire reefs.
*   **Physical Pollution (Plastic and Debris):** Floating plastics break down into microplastics, which are ingested by marine life. This leads to physical blockages in digestive tracts, internal injuries, and the leaching of toxic additives into the animals' tissues.

---

### 2. The Impact on Forests
Forests are complex, interconnected systems. Pollution disrupts the biological processes that allow trees to grow and the soil to remain fertile.

*   **Acid Rain:** When sulfur dioxide and nitrogen oxides (from burning fossil fuels) mix with atmospheric water vapor, they form acid rain. This rain leaches essential nutrients (like calcium and magnesium) from the soil, making it difficult for trees to grow. Simultaneously, it releases aluminum from the soil, which is toxic to tree roots, effectively "poisoning" the trees from the ground up.
*   **Disruption of Photosynthesis:** Air pollution, specifically ground-level ozone, is a major threat to forests. Ozone enters through the pores (stomata) of leaves, damaging the plant’s cells and interfering with photosynthesis. This stunts the tree's growth, reduces its ability to store carbon, and makes it more susceptible to diseases and pest infestations.
*   **Soil Contamination:** Forests often act as "sinks" for pollution. Heavy metals from industrial emissions settle onto the forest floor. Over time, these toxins accumulate in the soil, harming the soil microbiome (fungi and bacteria). Because trees rely on symbiotic relationships with these fungi to absorb water and nutrients, soil pollution can lead to the slow decline and eventual death of entire forest stands.
*   **The "Edge Effect" and Stress:** Pollution often weakens a forest's overall immunity. Stressed forests are less resilient to natural threats like wildfires, droughts, and invasive insect species. A forest weakened by air pollution is much more likely to be devastated by a beetle outbreak that a healthy forest might have survived.

---

### The Interconnectedness
It is important to note that these systems are not separate. They are linked by the **water cycle**.

1.  **Pollutants travel:** Rain carries air pollutants into the soil (impacting forests) and then washes those pollutants into streams and rivers (impacting water). 
2.  **Loss of Filtration:** Forests act as natural filters. When pollution kills off forest vegetation, the soil becomes unstable and erodes into bodies of water, causing sedimentation that smothers fish spawning grounds and blocks sunlight for aquatic plants.

**Summary:** Pollution turns both forests and water bodies from life-sustaining systems into hostile environments. By disrupting the chemical foundation of the soil and the oxygen levels in the water, pollution effectively "breaks" the natural machinery that these ecosystems use to regenerate themselves.

This response is due to the input given in the first_call.py file which is `Explain how pollution affects bodies of water and forests` 

