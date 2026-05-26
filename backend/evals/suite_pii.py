from __future__ import annotations

import asyncio

from agents.pii_guardian import guard

TEST_CASES = [
    {"text": "Call me at 555-867-5309 whenever", "expect_redacted": ["[PHONE]"], "label": "phone_number"},
    {"text": "Email me at john.doe@gmail.com please", "expect_redacted": ["[EMAIL]"], "label": "email"},
    {"text": "My SSN is 123-45-6789 for the forms", "expect_redacted": ["[SSN]"], "label": "ssn"},
    {"text": "The total was $12,500.00 for the project", "expect_redacted": ["[AMOUNT]"], "label": "dollar_amount"},
    {"text": "Today was a great day at work", "expect_redacted": [], "label": "clean_text"},
    {"text": "Sarah told me in confidence that she's struggling with depression", "expect_sensitive": True, "label": "sensitive_third_party"},
    {"text": "My card number is 4532 1234 5678 9012", "expect_redacted": ["[CARD]"], "label": "card_number"},
    {"text": "Reach me at +1 (555) 234-5678 or at dev@soulscribe.com", "expect_redacted": ["[PHONE]", "[EMAIL]"], "label": "multiple_pii"},
    {"text": "I felt really proud of myself today", "expect_redacted": [], "label": "personal_feeling"},
    {"text": "The API key is sk-1234abcd and the password is hunter2", "expect_redacted": ["[CREDENTIAL]"], "label": "credentials"},
]


async def run() -> dict:
    tp = 0  # true positives (PII correctly caught)
    fp = 0  # false positives (clean text incorrectly flagged)
    fn = 0  # false negatives (PII missed)
    total_pii_cases = sum(1 for c in TEST_CASES if c.get("expect_redacted") or c.get("expect_sensitive"))
    clean_cases = sum(1 for c in TEST_CASES if not c.get("expect_redacted") and not c.get("expect_sensitive"))

    results = []
    for case in TEST_CASES:
        result = await guard(case["text"])
        expected_tokens = case.get("expect_redacted", [])
        is_sensitive = case.get("expect_sensitive", False)

        detected = result.has_sensitive_content or bool(result.redactions)
        should_detect = bool(expected_tokens) or is_sensitive

        # Check each expected token appears in cleaned text
        token_hits = []
        for token in expected_tokens:
            found = token in result.cleaned_text
            token_hits.append(found)
            if found:
                tp += 1
            else:
                fn += 1

        if not should_detect and detected:
            fp += 1

        results.append({
            "label": case["label"],
            "passed": all(token_hits) if expected_tokens else (not should_detect or detected),
            "cleaned": result.cleaned_text[:100],
        })
        status = "✓" if results[-1]["passed"] else "✗"
        print(f"  {status} [{case['label']}]")

    pii_recall = tp / max(tp + fn, 1)
    fp_rate = fp / max(clean_cases, 1)
    precision_approx = tp / max(tp + fp, 1)

    print(f"\nPII Suite:")
    print(f"  Recall (caught/total):     {pii_recall:.0%}")
    print(f"  False positive rate:        {fp_rate:.0%}")
    print(f"  Approx precision:           {precision_approx:.0%}")

    return {
        "recall": pii_recall,
        "fp_rate": fp_rate,
        "precision": precision_approx,
        "cases": results,
    }


if __name__ == "__main__":
    asyncio.run(run())
