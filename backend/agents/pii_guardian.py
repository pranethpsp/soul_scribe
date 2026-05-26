from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext


class PIIAnalysis(BaseModel):
    cleaned_text: str
    redactions: list[dict[str, Any]]
    has_sensitive_content: bool
    confidence_flags: list[str]


@dataclass
class PIIDeps:
    pass


_PATTERNS = [
    (r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b", "[PHONE]"),
    (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b", "[EMAIL]"),
    (r"\b\d{3}-\d{2}-\d{4}\b", "[SSN]"),
    (r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "[CARD]"),
    (r"\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b", "[AMOUNT]"),
]

_SENSITIVE_KEYWORDS = [
    "password", "secret", "token", "api key", "private key",
    "confidential", "told me in confidence", "don't tell anyone",
]

_pii_agent = Agent(
    "anthropic:claude-haiku-4-5-20251001",
    result_type=PIIAnalysis,
    system_prompt="""You are a privacy guardrail. Analyse text and:
1. Replace phone numbers → [PHONE], emails → [EMAIL], SSNs → [SSN], card numbers → [CARD].
2. Replace specific dollar amounts → [AMOUNT] unless the user explicitly tagged them as "log this".
3. Mark medical diagnoses about third parties as [MEDICAL_INFO].
4. If someone else's private confession appears, note it as shared_in_confidence in confidence_flags.
5. NEVER store passwords or credentials — replace with [CREDENTIAL].
6. Return the cleaned text and a list of redactions made.
Keep the cleaned_text faithful to the original meaning while protecting privacy.""",
)


async def guard(text: str) -> PIIAnalysis:
    # Fast regex pass first
    redactions: list[dict] = []
    cleaned = text
    for pattern, replacement in _PATTERNS:
        matches = re.findall(pattern, text)
        for m in matches:
            redactions.append({"original": m, "replacement": replacement})
        cleaned = re.sub(pattern, replacement, cleaned)

    flags = []
    lower = cleaned.lower()
    for kw in _SENSITIVE_KEYWORDS:
        if kw in lower:
            flags.append(f"sensitive_keyword:{kw}")

    has_sensitive = bool(flags) or bool(redactions)

    # LLM pass for context-sensitive PII (only if text looks complex)
    if len(cleaned) > 50 and (has_sensitive or len(cleaned.split()) > 30):
        result = await _pii_agent.run(cleaned)
        return result.data

    return PIIAnalysis(
        cleaned_text=cleaned,
        redactions=redactions,
        has_sensitive_content=has_sensitive,
        confidence_flags=flags,
    )
