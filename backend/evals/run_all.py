from __future__ import annotations

import asyncio

from evals.suite_extraction import run as run_extraction
from evals.suite_pii import run as run_pii


async def main():
    print("=" * 60)
    print("SOULSCRIBE EVALUATION SUITES")
    print("=" * 60)

    print("\n[1/2] Journal Extraction Accuracy")
    print("-" * 40)
    extraction = await run_extraction()

    print("\n[2/2] PII Guardian Reliability")
    print("-" * 40)
    pii = await run_pii()

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Extraction F1:      {extraction['overall']:.0%}")
    print(f"  PII Recall:         {pii['recall']:.0%}  (target: 100%)")
    print(f"  PII FP Rate:        {pii['fp_rate']:.0%}  (target: <5%)")
    print("=" * 60)

    passed = extraction["overall"] >= 0.80 and pii["recall"] >= 0.95
    print(f"\nOverall: {'PASS ✓' if passed else 'NEEDS IMPROVEMENT ✗'}")


if __name__ == "__main__":
    asyncio.run(main())
