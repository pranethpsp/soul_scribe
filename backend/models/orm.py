from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    timezone = Column(String(50), default="UTC")
    display_name = Column(String(100))

    entries = relationship("Entry", back_populates="user", cascade="all, delete-orphan")
    people = relationship("Person", back_populates="user", cascade="all, delete-orphan")
    events = relationship("LifeEvent", back_populates="user", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="user", cascade="all, delete-orphan")
    patterns = relationship("Pattern", back_populates="user", cascade="all, delete-orphan")
    psychology_profile = relationship("PsychologyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class Entry(Base):
    __tablename__ = "entries"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    raw_content = Column(Text, nullable=False)
    entry_type = Column(String(30), default="thought")
    emotion = Column(String(50))
    emotional_weight = Column(Float, default=0.5)
    themes = Column(JSON, default=list)
    people_mentioned = Column(JSON, default=list)
    life_relevance_score = Column(Float, default=0.5)
    key_insight = Column(Text)
    pii_cleared = Column(Boolean, default=False)
    milvus_id = Column(String(100))
    is_archived = Column(Boolean, default=False)

    user = relationship("User", back_populates="entries")


class Person(Base):
    __tablename__ = "people"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    relationship_type = Column(String(50), default="friend")
    birthday = Column(Date)
    notes = Column(Text)
    last_interaction = Column(Date)
    milvus_profile_id = Column(String(100))

    user = relationship("User", back_populates="people")
    events = relationship("LifeEvent", back_populates="person")


class LifeEvent(Base):
    __tablename__ = "life_events"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    event_date = Column(Date, nullable=False)
    recurs_yearly = Column(Boolean, default=False)
    person_id = Column(String, ForeignKey("people.id"), nullable=True)
    reminder_days_before = Column(Integer, default=7)

    user = relationship("User", back_populates="events")
    person = relationship("Person", back_populates="events")


class Idea(Base):
    __tablename__ = "ideas"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    first_mentioned = Column(Date, server_default=func.current_date())
    mention_count = Column(Integer, default=1)
    status = Column(String(30), default="raw")
    related_entry_ids = Column(JSON, default=list)

    user = relationship("User", back_populates="ideas")


class Pattern(Base):
    __tablename__ = "patterns"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    pattern_type = Column(String(50))
    description = Column(Text)
    evidence_entries = Column(JSON, default=list)
    confidence = Column(Float, default=0.7)

    user = relationship("User", back_populates="patterns")


class PsychologyProfile(Base):
    __tablename__ = "psychology_profiles"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    core_values = Column(JSON, default=list)
    fear_patterns = Column(JSON, default=list)
    decision_style = Column(String(50))
    emotional_baseline = Column(String(50))
    recurring_themes = Column(JSON, default=list)
    dominant_theories = Column(JSON, default=list)
    last_updated = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="psychology_profile")


class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String(300), nullable=False)
    author = Column(String(200))
    domain = Column(String(50))
    theory_type = Column(String(100))
    summary = Column(Text)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    chunk_count = Column(Integer, default=0)
    retrieval_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class ResponseMetric(Base):
    __tablename__ = "response_metrics"

    id = Column(String, primary_key=True, default=_uuid)
    conversation_id = Column(String)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    query = Column(Text)
    personal_evidence_score = Column(Float)
    theory_alignment_score = Column(Float)
    cross_consistency_score = Column(Float)
    temporal_relevance_score = Column(Float)
    source_citation_rate = Column(Float)
    overall_confidence = Column(Float)
    threshold_met = Column(Boolean)
    entries_used = Column(Integer, default=0)
    theories_used = Column(Integer, default=0)
    entries_ids = Column(JSON, default=list)
    theory_ids = Column(JSON, default=list)
    response_latency_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    messages = Column(JSON, default=list)
    topic = Column(String(200))

    user = relationship("User", back_populates="conversations")


class Preference(Base):
    __tablename__ = "preferences"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    key = Column(String(100), primary_key=True)
    value = Column(Text)
    confidence = Column(Float, default=0.8)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
