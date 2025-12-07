"""Update strategy and backtest tables for visual strategy builder

Revision ID: 20251206_2000
Revises: 20251204_0930_add_seasonal_events_table
Create Date: 2025-12-06 20:00:00.000000

This migration:
1. Drops old strategies and backtests tables
2. Creates new tables with:
   - UUID user_id linking to public."User" table
   - JSONB columns for entry_logic/exit_logic (recursive tree structure)
   - Simplified metrics storage
   - Updated column names to match frontend conventions
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20251206_2000"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None

SCHEMA = "tradeflix_tools"


def upgrade() -> None:
    # ============================================
    # DROP: Old indexes and constraints
    # ============================================

    # Drop old indexes if they exist
    op.execute(f"DROP INDEX IF EXISTS {SCHEMA}.ix_backtests_id;")
    op.execute(f"DROP INDEX IF EXISTS {SCHEMA}.ix_backtests_user_id;")
    op.execute(f"DROP INDEX IF EXISTS {SCHEMA}.ix_backtests_strategy_id;")
    op.execute(f"DROP INDEX IF EXISTS {SCHEMA}.ix_strategies_id;")
    op.execute(f"DROP INDEX IF EXISTS {SCHEMA}.ix_strategies_user_id;")

    # ============================================
    # BACKUP: Rename old tables
    # ============================================

    # Check if old tables exist and rename them
    op.execute(f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables 
                       WHERE table_schema = '{SCHEMA}' AND table_name = 'backtests') THEN
                ALTER TABLE {SCHEMA}.backtests RENAME TO backtests_old;
            END IF;
        END $$;
    """)

    op.execute(f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables 
                       WHERE table_schema = '{SCHEMA}' AND table_name = 'strategies') THEN
                ALTER TABLE {SCHEMA}.strategies RENAME TO strategies_old;
            END IF;
        END $$;
    """)

    # ============================================
    # CREATE: New strategies table
    # ============================================

    op.create_table(
        "strategies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("asset", sa.String(length=20), nullable=False, server_default="GOLD"),
        sa.Column(
            "entry_logic", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column(
            "exit_logic", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column(
            "stop_loss_pct",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
            server_default="2.0",
        ),
        sa.Column(
            "take_profit_pct",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
            server_default="5.0",
        ),
        sa.Column("is_public", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("is_favorite", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["public.User.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )

    # Create indexes for strategies
    op.create_index("ix_strategies_user_id", "strategies", ["user_id"], schema=SCHEMA)
    op.create_index("ix_strategies_asset", "strategies", ["asset"], schema=SCHEMA)
    op.create_index(
        "ix_strategies_is_public",
        "strategies",
        ["is_public"],
        schema=SCHEMA,
        postgresql_where=sa.text("is_public = true"),
    )

    # ============================================
    # CREATE: New backtests table
    # ============================================

    op.create_table(
        "backtests",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("strategy_id", sa.Integer(), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("asset", sa.String(length=20), nullable=False),
        sa.Column("initial_capital", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("total_trades", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("win_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("total_return", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("max_drawdown", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("sharpe_ratio", sa.Numeric(precision=6, scale=3), nullable=True),
        sa.Column("final_equity", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("trades", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "equity_curve", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("execution_time_ms", sa.Integer(), nullable=True),
        sa.Column(
            "status", sa.String(length=20), nullable=True, server_default="completed"
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["strategy_id"], [f"{SCHEMA}.strategies.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["public.User.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )

    # Create indexes for backtests
    op.create_index("ix_backtests_user_id", "backtests", ["user_id"], schema=SCHEMA)
    op.create_index(
        "ix_backtests_strategy_id", "backtests", ["strategy_id"], schema=SCHEMA
    )
    op.create_index("ix_backtests_asset", "backtests", ["asset"], schema=SCHEMA)
    op.create_index(
        "ix_backtests_created_at",
        "backtests",
        [sa.text("created_at DESC")],
        schema=SCHEMA,
    )


def downgrade() -> None:
    # ============================================
    # DROP: New tables
    # ============================================

    # Drop indexes first
    op.drop_index("ix_backtests_created_at", table_name="backtests", schema=SCHEMA)
    op.drop_index("ix_backtests_asset", table_name="backtests", schema=SCHEMA)
    op.drop_index("ix_backtests_strategy_id", table_name="backtests", schema=SCHEMA)
    op.drop_index("ix_backtests_user_id", table_name="backtests", schema=SCHEMA)
    op.drop_table("backtests", schema=SCHEMA)

    op.drop_index("ix_strategies_is_public", table_name="strategies", schema=SCHEMA)
    op.drop_index("ix_strategies_asset", table_name="strategies", schema=SCHEMA)
    op.drop_index("ix_strategies_user_id", table_name="strategies", schema=SCHEMA)
    op.drop_table("strategies", schema=SCHEMA)

    # ============================================
    # RESTORE: Old tables from backup
    # ============================================

    op.execute(f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables 
                       WHERE table_schema = '{SCHEMA}' AND table_name = 'strategies_old') THEN
                ALTER TABLE {SCHEMA}.strategies_old RENAME TO strategies;
            END IF;
        END $$;
    """)

    op.execute(f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables 
                       WHERE table_schema = '{SCHEMA}' AND table_name = 'backtests_old') THEN
                ALTER TABLE {SCHEMA}.backtests_old RENAME TO backtests;
            END IF;
        END $$;
    """)
