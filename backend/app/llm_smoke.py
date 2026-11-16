"""Check Gemini API access with one short request."""

import os
import sys

import httpx2
from google import genai
from google.genai import errors, types


def main() -> int:
    """Send a smoke-test request and return the process exit code."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "").strip()
    if not api_key or not model:
        sys.stderr.write("Set GEMINI_API_KEY and GEMINI_MODEL before running.\n")
        return 1

    try:
        with genai.Client(
            api_key=api_key,
            vertexai=False,
            http_options=types.HttpOptions(
                timeout=20_000,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        ) as client:
            message = client.models.generate_content(
                model=model,
                contents="Reply with: Environ API connected",
                config=types.GenerateContentConfig(max_output_tokens=1024),
            )
    except httpx2.TimeoutException:
        sys.stderr.write("Gemini request timed out. Try again later.\n")
        return 1
    except httpx2.TransportError:
        sys.stderr.write("Could not connect to Gemini. Check your network.\n")
        return 1
    except errors.APIError as error:
        sys.stderr.write(
            f"Gemini returned HTTP {error.code}. "
            "Check your API key, model access, and free-tier quota in AI Studio.\n",
        )
        return 1

    response = (message.text or "").strip()
    if (
        not response
        or not message.candidates
        or message.candidates[0].finish_reason != types.FinishReason.STOP
    ):
        sys.stderr.write("Gemini did not return a complete text response.\n")
        return 1

    sys.stdout.write(f"{response}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
