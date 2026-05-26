"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("timezone", sa.String(50), default="UTC"),
        sa.Column("display_name", sa.String(100)),
    )
    op.create_table(
        "entries",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column("raw_content", sa.Text(), nullable=False),
        sa.Column("entry_type", sa.String(30), default="thought"),
        sa.Column("emotion", sa.String(50)),
        sa.Column("emotional_weight", sa.Float(), default=0.5),
        sa.Column("themes", JSON, default=list),
        sa.Column("people_mentioned", JSON, default=list),
        sa.Column("life_relevance_score", sa.Float(), default=0.5),
        sa.Column("key_insight", sa.Text()),
        sa.Column("pii_cleared", sa.Boolean(), default=False),
        sa.Column("milvus_id", sa.String(100)),
        sa.Column("is_archived", sa.Boolean(), default=False),
    )
    op.create_table(
        "psychology_profiles",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("core_values", JSON, default=list),
        sa.Column("fear_patterns", JSON, default=list),
        sa.Column("decision_style", sa.String(50)),
        sa.Column("emotional_baseline", sa.String(50)),
        sa.Column("recurring_themes", JSON, default=list),
        sa.Column("dominant_theories", JSON, default=list),
        sa.Column("last_updated", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "people",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("relationship_type", sa.String(50), default="friend"),
        sa.Column("birthday", sa.Date()),
        sa.Column("notes", sa.Text()),
        sa.Column("last_interaction", sa.Date()),
        sa.Column("milvus_profile_id", sa.String(100)),
    )
    op.create_table(
        "life_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("recurs_yearly", sa.Boolean(), default=False),
        sa.Column("person_id", sa.String(), sa.ForeignKey("people.id"), nullable=True),
        sa.Column("reminder_days_before", sa.Integer(), default=7),
    )
    op.create_table(
        "ideas",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("first_mentioned", sa.Date(), server_default=sa.func.current_date()),
        sa.Column("mention_count", sa.Integer(), default=1),
        sa.Column("status", sa.String(30), default="raw"),
        sa.Column("related_entry_ids", JSON, default=list),
    )
    op.create_table(
        "patterns",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("pattern_type", sa.String(50)),
        sa.Column("description", sa.Text()),
        sa.Column("evidence_entries", JSON, default=list),
        sa.Column("confidence", sa.Float(), default=0.7),
    )
    op.create_table(
        "knowledge_sources",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("author", sa.String(200)),
        sa.Column("domain", sa.String(50)),
        sa.Column("theory_type", sa.String(100)),
        sa.Column("summary", sa.Text()),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("chunk_count", sa.Integer(), default=0),
        sa.Column("retrieval_count", sa.Integer(), default=0),
        sa.Column("is_active", sa.Boolean(), default=True),
    )
    op.create_table(
        "response_metrics",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("conversation_id", sa.String()),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("query", sa.Text()),
        sa.Column("personal_evidence_score", sa.Float()),
        sa.Column("theory_alignment_score", sa.Float()),
        sa.Column("cross_consistency_score", sa.Float()),
        sa.Column("temporal_relevance_score", sa.Float()),
        sa.Column("source_citation_rate", sa.Float()),
        sa.Column("overall_confidence", sa.Float()),
        sa.Column("threshold_met", sa.Boolean()),
        sa.Column("entries_used", sa.Integer(), default=0),
        sa.Column("theories_used", sa.Integer(), default=0),
        sa.Column("entries_ids", JSON, default=list),
        sa.Column("theory_ids", JSON, default=list),
        sa.Column("response_latency_ms", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("messages", JSON, default=list),
        sa.Column("topic", sa.String(200)),
    )
    op.create_table(
        "preferences",
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.Text()),
        sa.Column("confidence", sa.Float(), default=0.8),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    for table in [
        "preferences", "conversations", "response_metrics",
        "knowledge_sources", "patterns", "ideas", "life_events",
        "people", "psychology_profiles", "entries", "users",
    ]:
        op.drop_table(table)
