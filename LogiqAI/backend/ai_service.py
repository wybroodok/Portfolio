"""AI integration layer — Google Gemini.

The service runs on real AI only. There is no mock fallback: if the API key is
missing, or the provider call fails (bad token, quota, model error), we raise
`AIUnavailableError`, and the API surfaces a clean "temporarily unavailable"
response to the client.

Get a free key at https://aistudio.google.com  →  "Get API key".
"""

from __future__ import annotations

import logging
import os

from models import AuditResult

logger = logging.getLogger("logiqai.ai")

MODEL = os.getenv("LOGIQAI_MODEL", "gemini-2.5-flash")

_SYSTEM_PROMPT = """You are LogiqAI, a senior analyst that audits one of three \
artifact types: source code, financial spend data, or a résumé. Infer which type \
the uploaded document is, then produce a rigorous, specific, and actionable audit.

Rules:
- Ground every metric, trend point, category, and recommendation in the actual \
content provided. Do not invent facts that contradict the document.
- Scores are 0-100. Be honest, not generous.
- Recommendations must be concrete and immediately actionable, each tagged \
critical / important / tip by real severity. Order them most severe first.
- The trend series should show a meaningful progression or comparison relevant to \
the artifact (defect density by module, spend over time, section strength, etc.).
- Keep prose tight: summaries 2-3 sentences, recommendation descriptions 1-3 \
sentences.
- 'audit_type' must be exactly one of: code, finance, resume.
- 'priority' on each recommendation must be exactly one of: critical, important, tip."""


class AIUnavailableError(Exception):
    """The AI provider could not fulfil the request (missing/invalid key, quota,
    model error, network). Callers should surface a 'temporarily unavailable'
    message — never a fabricated result."""


def _api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def has_api_key() -> bool:
    return bool(_api_key())


async def analyze(filename: str, content: str) -> AuditResult:
    """Run a real AI audit. Raises AIUnavailableError if the provider can't."""
    if not has_api_key():
        logger.warning("No GEMINI_API_KEY configured — AI unavailable")
        raise AIUnavailableError("AI service is not configured")

    try:
        return await _analyze_with_gemini(filename, content)
    except Exception as exc:  # bad token, quota, model error, network, parse
        logger.exception("AI analysis failed for %s", filename)
        raise AIUnavailableError("AI provider request failed") from exc


async def _analyze_with_gemini(filename: str, content: str) -> AuditResult:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_api_key())

    # Bound the payload so a huge upload can't blow the context or the quota.
    snippet = content[:60_000]
    user_msg = (
        f"Audit the following artifact. Filename: {filename}\n\n"
        f"--- BEGIN CONTENT ---\n{snippet}\n--- END CONTENT ---"
    )

    # Structured output: response_schema binds the JSON response to AuditResult and
    # the SDK parses it back into a validated Pydantic instance on `.parsed`.
    response = await client.aio.models.generate_content(
        model=MODEL,
        contents=user_msg,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=AuditResult,
            temperature=0.4,
            max_output_tokens=8192,
            # Disable "thinking" on 2.5-flash so the full structured JSON fits in
            # the output budget instead of being starved by reasoning tokens.
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )

    parsed = response.parsed
    if parsed is None:
        raise ValueError("Model returned no parseable structured output")
    return parsed
