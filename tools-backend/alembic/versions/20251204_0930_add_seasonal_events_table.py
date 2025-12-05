"""Add seasonal events table with comprehensive event types

Revision ID: a1b2c3d4e5f6
Revises: 4fd300483c22
Create Date: 2025-12-04 09:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "4fd300483c22"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create event_type enum
    event_type_enum = sa.Enum(
        "festival_india",
        "holiday_trading_india",
        "holiday_trading_us",
        "holiday_trading_global",
        "election_india",
        "election_global",
        "budget_india",
        "policy_event",
        "fomc_meeting",
        "macro_release",
        "custom",
        name="event_type_enum",
    )

    # Create recurrence_type enum
    recurrence_type_enum = sa.Enum(
        "none",
        "annual",
        "lunar",
        "quarterly",
        "monthly",
        "weekly",
        name="recurrence_type_enum",
    )

    # Create seasonal_events table in tradeflix_tools schema
    op.create_table(
        "seasonal_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("event_type", event_type_enum, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "country", sa.String(length=50), nullable=True, server_default="India"
        ),
        sa.Column("region", sa.String(length=100), nullable=True),
        # Date information
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        # Recurrence settings
        sa.Column(
            "recurrence", recurrence_type_enum, nullable=True, server_default="none"
        ),
        sa.Column("recurrence_month", sa.Integer(), nullable=True),
        sa.Column("recurrence_day", sa.Integer(), nullable=True),
        sa.Column(
            "is_lunar_based", sa.Boolean(), nullable=True, server_default="false"
        ),
        # Time information
        sa.Column("event_time", sa.String(length=10), nullable=True),
        sa.Column(
            "timezone",
            sa.String(length=50),
            nullable=True,
            server_default="Asia/Kolkata",
        ),
        sa.Column("duration_days", sa.Integer(), nullable=True, server_default="1"),
        # Impact analysis
        sa.Column("avg_price_change_percent", sa.Float(), nullable=True),
        sa.Column("win_rate", sa.Float(), nullable=True),
        sa.Column("volatility_multiplier", sa.Float(), nullable=True),
        sa.Column("volume_change_percent", sa.Float(), nullable=True),
        # Analysis window
        sa.Column(
            "analysis_window_before", sa.Integer(), nullable=True, server_default="7"
        ),
        sa.Column(
            "analysis_window_after", sa.Integer(), nullable=True, server_default="7"
        ),
        # Commodities affected
        sa.Column("affects_gold", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("affects_silver", sa.Boolean(), nullable=True, server_default="true"),
        # Metadata
        sa.Column("event_metadata", sa.JSON(), nullable=True),
        sa.Column("data_source", sa.String(length=100), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        # Status
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=True, server_default="false"),
        # Audit fields
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index(
        op.f("ix_seasonal_events_id"), "seasonal_events", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_seasonal_events_name"), "seasonal_events", ["name"], unique=False
    )
    op.create_index(
        op.f("ix_seasonal_events_event_type"),
        "seasonal_events",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_seasonal_events_country"), "seasonal_events", ["country"], unique=False
    )
    op.create_index(
        op.f("ix_seasonal_events_start_date"),
        "seasonal_events",
        ["start_date"],
        unique=False,
    )
    op.create_index(
        "idx_event_type_date",
        "seasonal_events",
        ["event_type", "start_date"],
        unique=False,
    )

    # Create seasonal_analysis table
    op.create_table(
        "seasonal_analysis",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        # Price data
        sa.Column("price_before_7d", sa.Float(), nullable=True),
        sa.Column("price_before_3d", sa.Float(), nullable=True),
        sa.Column("price_on_event", sa.Float(), nullable=True),
        sa.Column("price_after_3d", sa.Float(), nullable=True),
        sa.Column("price_after_7d", sa.Float(), nullable=True),
        # Performance metrics
        sa.Column("change_before_7d", sa.Float(), nullable=True),
        sa.Column("change_after_7d", sa.Float(), nullable=True),
        sa.Column("max_gain", sa.Float(), nullable=True),
        sa.Column("max_loss", sa.Float(), nullable=True),
        # Volume data
        sa.Column("avg_volume_before", sa.Float(), nullable=True),
        sa.Column("avg_volume_during", sa.Float(), nullable=True),
        sa.Column("volume_change_percent", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["event_id"], ["seasonal_events.id"], ondelete="CASCADE"
        ),
    )

    # Create indexes for seasonal_analysis
    op.create_index(
        op.f("ix_seasonal_analysis_id"), "seasonal_analysis", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_seasonal_analysis_event_id"),
        "seasonal_analysis",
        ["event_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_seasonal_analysis_symbol"),
        "seasonal_analysis",
        ["symbol"],
        unique=False,
    )
    op.create_index(
        op.f("ix_seasonal_analysis_year"), "seasonal_analysis", ["year"], unique=False
    )
    op.create_index(
        "idx_analysis_event_symbol_year",
        "seasonal_analysis",
        ["event_id", "symbol", "year"],
        unique=True,
    )


def downgrade() -> None:
    # Drop seasonal_analysis table
    op.drop_index("idx_analysis_event_symbol_year", table_name="seasonal_analysis")
    op.drop_index(op.f("ix_seasonal_analysis_year"), table_name="seasonal_analysis")
    op.drop_index(op.f("ix_seasonal_analysis_symbol"), table_name="seasonal_analysis")
    op.drop_index(op.f("ix_seasonal_analysis_event_id"), table_name="seasonal_analysis")
    op.drop_index(op.f("ix_seasonal_analysis_id"), table_name="seasonal_analysis")
    op.drop_table("seasonal_analysis")

    # Drop seasonal_events table
    op.drop_index("idx_event_type_date", table_name="seasonal_events")
    op.drop_index(op.f("ix_seasonal_events_start_date"), table_name="seasonal_events")
    op.drop_index(op.f("ix_seasonal_events_country"), table_name="seasonal_events")
    op.drop_index(op.f("ix_seasonal_events_event_type"), table_name="seasonal_events")
    op.drop_index(op.f("ix_seasonal_events_name"), table_name="seasonal_events")
    op.drop_index(op.f("ix_seasonal_events_id"), table_name="seasonal_events")
    op.drop_table("seasonal_events")

    # Drop enums
    sa.Enum(name="recurrence_type_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="event_type_enum").drop(op.get_bind(), checkfirst=True)
