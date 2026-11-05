"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-05 10:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('api_key_hash', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_api_key_hash'), 'users', ['api_key_hash'], unique=False)

    op.create_table(
        'experiments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('dataset_hash', sa.String(length=64), nullable=True),
        sa.Column('row_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('meta_info', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_experiments')),
    )
    op.create_index(op.f('ix_experiments_name'), 'experiments', ['name'], unique=False)
    op.create_index(op.f('ix_experiments_status'), 'experiments', ['status'], unique=False)

    op.create_table(
        'pipeline_runs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('experiment_id', sa.String(length=36), nullable=False),
        sa.Column('run_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='completed'),
        sa.Column('params_json', sa.JSON(), nullable=True),
        sa.Column('results_json', sa.JSON(), nullable=True),
        sa.Column('duration_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['experiment_id'], ['experiments.id'], name=op.f('fk_pipeline_runs_experiment_id_experiments'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_pipeline_runs')),
    )
    op.create_index(op.f('ix_pipeline_runs_experiment_id'), 'pipeline_runs', ['experiment_id'], unique=False)
    op.create_index(op.f('ix_pipeline_runs_run_type'), 'pipeline_runs', ['run_type'], unique=False)
    op.create_index(op.f('ix_pipeline_runs_status'), 'pipeline_runs', ['status'], unique=False)
    op.create_index(op.f('ix_pipeline_runs_created_at'), 'pipeline_runs', ['created_at'], unique=False)

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('ip_address', sa.String(length=45), nullable=False, server_default='127.0.0.1'),
        sa.Column('status_code', sa.Integer(), nullable=False, server_default='200'),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('extra_json', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs')),
    )
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)

    op.create_table(
        'drift_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('run_id', sa.String(length=36), nullable=True),
        sa.Column('feature', sa.String(length=100), nullable=False),
        sa.Column('psi_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('ks_stat', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_drift', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_drift_events')),
    )
    op.create_index(op.f('ix_drift_events_run_id'), 'drift_events', ['run_id'], unique=False)
    op.create_index(op.f('ix_drift_events_feature'), 'drift_events', ['feature'], unique=False)
    op.create_index(op.f('ix_drift_events_timestamp'), 'drift_events', ['timestamp'], unique=False)

def downgrade() -> None:
    op.drop_table('drift_events')
    op.drop_table('audit_logs')
    op.drop_table('pipeline_runs')
    op.drop_table('experiments')
    op.drop_table('users')

