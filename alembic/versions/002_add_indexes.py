from alembic import op
import sqlalchemy as sa

revision = "002_add_indexes"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_pipeline_runs_experiment_created",
        "pipeline_runs",
        ["experiment_id", "created_at"],
    )
    op.create_index(
        "ix_experiments_created_at",
        "experiments",
        ["created_at"],
    )
    op.create_index(
        "ix_experiments_status_created",
        "experiments",
        ["status", "created_at"],
    )
    op.create_index(
        "ix_pipeline_runs_status",
        "pipeline_runs",
        ["status"],
    )
    op.create_index(
        "ix_audit_logs_entity",
        "audit_logs",
        ["entity_type", "entity_id", "created_at"],
    )
    op.create_index(
        "ix_audit_logs_user",
        "audit_logs",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_drift_events_run_detected",
        "drift_events",
        ["run_id", "detected_at"],
    )
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_drift_events_run_detected", table_name="drift_events")
    op.drop_index("ix_audit_logs_user", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity", table_name="audit_logs")
    op.drop_index("ix_pipeline_runs_status", table_name="pipeline_runs")
    op.drop_index("ix_experiments_status_created", table_name="experiments")
    op.drop_index("ix_experiments_created_at", table_name="experiments")
    op.drop_index("ix_pipeline_runs_experiment_created", table_name="pipeline_runs")

