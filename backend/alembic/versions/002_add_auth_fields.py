"""add email and hashed_password to users

Revision ID: 002
Revises: 001
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email column — nullable first so existing rows don't violate the constraint,
    # then populate a placeholder and switch to nullable=False.
    op.add_column(
        "users",
        sa.Column("email", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("hashed_password", sa.String(255), nullable=True),
    )

    # Back-fill existing rows with a placeholder so we can add NOT NULL + unique
    op.execute(
        "UPDATE users SET email = 'legacy_' || id || '@placeholder.invalid', "
        "hashed_password = 'UNSET' WHERE email IS NULL"
    )

    op.alter_column("users", "email", nullable=False)
    op.alter_column("users", "hashed_password", nullable=False)
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_column("users", "hashed_password")
    op.drop_column("users", "email")
