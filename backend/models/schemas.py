from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


EntryType = Literal[
    "thought", "memory", "lesson", "idea", "event", "person_note", "milestone", "emotion_log"
]
RelationshipType = Literal["friend", "family", "colleague", "mentor", "romantic", "acquaintance"]
IdeaStatus = Literal["raw", "developing", "pursuing", "abandoned"]
DecisionDomain = Literal["career", "relationship", "money", "health", "location", "creative", "general"]


# ── Entry ────────────────────────────────────────────────────────────────────

class EntryCreate(BaseModel):
    raw_content: str
    created_at: Optional[datetime] = None


class ExtractedEntry(BaseModel):
    entry_type: EntryType
    emotion: str
    emotional_weight: float = Field(ge=0.0, le=1.0)
    themes: list[str]
    people_mentioned: list[str]
    life_relevance_score: float = Field(ge=0.0, le=1.0)
    key_insight: Optional[str] = None


class EntryOut(BaseModel):
    id: str
    raw_content: str
    entry_type: EntryType
    emotion: str
    emotional_weight: float
    themes: list[str]
    people_mentioned: list[str]
    life_relevance_score: float
    key_insight: Optional[str]
    created_at: datetime
    pii_cleared: bool

    class Config:
        from_attributes = True


# ── Person ───────────────────────────────────────────────────────────────────

class PersonCreate(BaseModel):
    name: str
    relationship_type: RelationshipType
    birthday: Optional[date] = None
    notes: Optional[str] = None


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    relationship_type: Optional[RelationshipType] = None
    birthday: Optional[date] = None
    notes: Optional[str] = None


class PersonOut(BaseModel):
    id: str
    name: str
    relationship_type: RelationshipType
    birthday: Optional[date]
    notes: Optional[str]
    last_interaction: Optional[date]

    class Config:
        from_attributes = True


# ── Life Event ───────────────────────────────────────────────────────────────

class LifeEventOut(BaseModel):
    id: str
    title: str
    event_date: date
    recurs_yearly: bool
    person_id: Optional[str]
    reminder_days_before: int

    class Config:
        from_attributes = True


# ── Idea ─────────────────────────────────────────────────────────────────────

class IdeaCreate(BaseModel):
    title: str
    description: Optional[str] = None


class IdeaOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    first_mentioned: date
    mention_count: int
    status: IdeaStatus

    class Config:
        from_attributes = True


# ── Pattern ──────────────────────────────────────────────────────────────────

class PatternOut(BaseModel):
    id: str
    pattern_type: str
    description: str
    evidence_entries: list[str]
    confidence: float
    detected_at: datetime

    class Config:
        from_attributes = True


# ── Psychology Profile ───────────────────────────────────────────────────────

class PsychologyProfileOut(BaseModel):
    core_values: list[str]
    fear_patterns: list[str]
    decision_style: Optional[str]
    emotional_baseline: Optional[str]
    recurring_themes: list[str]
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True


# ── Knowledge Source (admin) ─────────────────────────────────────────────────

class KnowledgeSourceCreate(BaseModel):
    title: str
    author: Optional[str] = None
    domain: Literal["psychology", "philosophy", "science", "business", "spirituality", "other"]
    theory_type: Optional[str] = None
    summary: Optional[str] = None


class KnowledgeSourceOut(BaseModel):
    id: str
    title: str
    author: Optional[str]
    domain: str
    theory_type: Optional[str]
    summary: Optional[str]
    chunk_count: int
    retrieval_count: int
    is_active: bool
    added_at: datetime

    class Config:
        from_attributes = True


# ── Confidence Report ────────────────────────────────────────────────────────

class ConfidenceReport(BaseModel):
    personal_evidence_score: float = Field(ge=0.0, le=1.0)
    theory_alignment_score: float = Field(ge=0.0, le=1.0)
    cross_consistency_score: float = Field(ge=0.0, le=1.0)
    temporal_relevance_score: float = Field(ge=0.0, le=1.0)
    source_citation_rate: float = Field(ge=0.0, le=1.0)
    overall_confidence: float = Field(ge=0.0, le=1.0)
    threshold_met: bool
    entries_used: int
    theories_used: int
    entries_ids: list[str] = Field(default_factory=list)
    theory_ids: list[str] = Field(default_factory=list)


# ── Oracle ───────────────────────────────────────────────────────────────────

class OracleRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None


class SourceCitation(BaseModel):
    source_type: Literal["entry", "theory"]
    source_id: str
    title: str
    excerpt: str
    date: Optional[str] = None


class OracleResponse(BaseModel):
    answer: str
    confidence: ConfidenceReport
    citations: list[SourceCitation]
    is_honest_disclaimer: bool = False


# ── Retrieved chunks for RAG ─────────────────────────────────────────────────

class RetrievedEntry(BaseModel):
    entry_id: str
    content: str
    entry_type: str
    emotion: str
    emotional_weight: float
    created_at: datetime
    similarity_score: float


class RetrievedTheory(BaseModel):
    chunk_id: str
    source_id: str
    title: str
    author: Optional[str]
    domain: str
    chunk_text: str
    similarity_score: float


# ── PII ──────────────────────────────────────────────────────────────────────

class PIIResult(BaseModel):
    cleaned_text: str
    redactions: list[dict[str, Any]]
    has_sensitive_content: bool
    confidence_in_confidence: bool = True


# ── Conversation ─────────────────────────────────────────────────────────────

class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence: Optional[ConfidenceReport] = None


# ── Insight ──────────────────────────────────────────────────────────────────

class InsightItem(BaseModel):
    type: Literal["upcoming_event", "pattern", "memory_anniversary", "dormant_connection", "recurring_idea"]
    title: str
    description: str
    action_hint: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
