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
