from __future__ import annotations

import os
from contextlib import contextmanager
from functools import wraps
from typing import Any, Callable, Optional

from langfuse import Langfuse
from langfuse.decorators import langfuse_context, observe

_langfuse: Optional[Langfuse] = None


def get_langfuse() -> Langfuse:
    global _langfuse
    if _langfuse is None:
        _langfuse = Langfuse(
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY", ""),
            secret_key=os.getenv("LANGFUSE_SECRET_KEY", ""),
            host=os.getenv("LANGFUSE_HOST", "http://localhost:3001"),
        )
    return _langfuse


def trace_llm_call(
    name: str,
    model: str,
    prompt: str,
    response: str,
    tokens_input: int = 0,
    tokens_output: int = 0,
    metadata: Optional[dict] = None,
    user_id: Optional[str] = None,
    score: Optional[float] = None,
) -> str:
    lf = get_langfuse()
    trace = lf.trace(name=name, user_id=user_id, metadata=metadata or {})
    generation = trace.generation(
        name=name,
        model=model,
        input=prompt,
        output=response,
        usage={
            "input": tokens_input,
            "output": tokens_output,
            "total": tokens_input + tokens_output,
        },
    )
    if score is not None:
        trace.score(name="confidence", value=score)
    lf.flush()
    return trace.id


def score_response(trace_id: str, name: str, value: float, comment: str = "") -> None:
    lf = get_langfuse()
    lf.score(trace_id=trace_id, name=name, value=value, comment=comment)
    lf.flush()
