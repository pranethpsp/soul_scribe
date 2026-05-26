from __future__ import annotations

import asyncio
from typing import Any

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import IsInstance

from agents.journal_intelligence import extract
from models.schemas import ExtractedEntry

CASES = [
    Case(
        name="basic_memory",
        inputs={"text": "Had coffee with Sarah today. She mentioned she got a promotion at Google."},
        expected_output={"entry_type": "memory", "emotion_present": True, "people": ["Sarah"]},
        metadata={"description": "Basic memory with person mentioned"},
    ),
    Case(
        name="life_lesson",
        inputs={"text": "Today I realised that I always procrastinate on the things that scare me most."},
        expected_output={"entry_type": "lesson", "key_insight_present": True},
        metadata={"description": "Life lesson entry"},
    ),
    Case(
        name="business_idea",
        inputs={"text": "New idea: an app that helps people track their emotional triggers throughout the day."},
        expected_output={"entry_type": "idea", "life_relevance": "high"},
        metadata={"description": "Business idea extraction"},
    ),
    Case(
        name="milestone",
        inputs={"text": "Today I ran my first 10km. It took me 58 minutes but I did it. I actually did it."},
        expected_output={"entry_type": "milestone", "emotional_weight": "high"},
        metadata={"description": "Personal milestone with high emotional weight"},
    ),
    Case(
        name="complex_emotion",
        inputs={"text": "I don't know why but everything feels heavy today. Work is fine, life is objectively good, but something feels off."},
        expected_output={"entry_type": "emotion_log", "emotion": "melancholic_or_similar"},
        metadata={"description": "Complex emotional state"},
    ),
]


class ExtractionEvaluator:
    def evaluate(self, output: ExtractedEntry, expected: dict) -> dict[str, float]:
        scores = {}

        if "entry_type" in expected:
            scores["entry_type_correct"] = 1.0 if output.entry_type == expected["entry_type"] else 0.0

        if expected.get("emotion_present"):
            scores["emotion_extracted"] = 1.0 if output.emotion else 0.0

        if expected.get("key_insight_present"):
            scores["insight_extracted"] = 1.0 if output.key_insight else 0.0

        if "people" in expected:
            expected_people = [p.lower() for p in expected["people"]]
            actual_people = [p.lower() for p in output.people_mentioned]
            matched = sum(1 for p in expected_people if any(p in a for a in actual_people))
            scores["people_recall"] = matched / len(expected_people)

        if expected.get("emotional_weight") == "high":
            scores["emotional_weight_high"] = 1.0 if output.emotional_weight >= 0.7 else 0.0

        if expected.get("life_relevance") == "high":
            scores["relevance_high"] = 1.0 if output.life_relevance_score >= 0.6 else 0.0

        return scores


async def run() -> dict:
    evaluator = ExtractionEvaluator()
    results = []
    for case in CASES:
        extracted = await extract(case.inputs["text"])
        scores = evaluator.evaluate(extracted, case.expected_output)
        avg_score = sum(scores.values()) / len(scores) if scores else 0.0
        results.append({
            "case": case.name,
            "scores": scores,
            "avg_score": avg_score,
            "entry_type": extracted.entry_type,
            "emotion": extracted.emotion,
        })
        print(f"  [{case.name}] avg={avg_score:.2f} | type={extracted.entry_type}")

    overall = sum(r["avg_score"] for r in results) / len(results)
    print(f"\nExtraction Suite Overall: {overall:.2f}")
    return {"overall": overall, "cases": results}


if __name__ == "__main__":
    asyncio.run(run())
