"""initial users and applications tables

Revision ID: 0001
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()

    if "users" not in existing:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
        op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    if "applications" not in existing:
        op.create_table(
            "applications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("company", sa.String(), nullable=False),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("date_applied", sa.String(), nullable=False),
            sa.Column("job_url", sa.String(), nullable=True),
            sa.Column("salary_min", sa.Integer(), nullable=True),
            sa.Column("salary_max", sa.Integer(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_applications_id"), "applications", ["id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_applications_id"), table_name="applications")
    op.drop_table("applications")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
