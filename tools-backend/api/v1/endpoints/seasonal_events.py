"""
Seasonal Events CRUD API endpoints.
Provides endpoints for managing seasonal events (festivals, holidays, elections, etc.)
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date, timedelta
from typing import List, Optional
import logging
import math

from database import get_db
from models.seasonal import SeasonalEvent, EventType
from schemas.seasonal import (
    SeasonalEventCreate,
    SeasonalEventUpdate,
    SeasonalEventResponse,
    SeasonalEventListResponse,
    EventTypeEnum,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=SeasonalEventListResponse)
async def list_events(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    event_type: Optional[EventTypeEnum] = Query(
        default=None, description="Filter by event type"
    ),
    country: Optional[str] = Query(default=None, description="Filter by country"),
    is_active: Optional[bool] = Query(
        default=None, description="Filter by active status"
    ),
    start_date_from: Optional[date] = Query(
        default=None, description="Filter events starting from this date"
    ),
    start_date_to: Optional[date] = Query(
        default=None, description="Filter events starting until this date"
    ),
    search: Optional[str] = Query(
        default=None, description="Search in name and description"
    ),
    db: Session = Depends(get_db),
):
    """
    List all seasonal events with pagination and filtering.
    """
    query = db.query(SeasonalEvent)

    # Apply filters
    if event_type:
        query = query.filter(SeasonalEvent.event_type == event_type.value)
    if country:
        query = query.filter(SeasonalEvent.country.ilike(f"%{country}%"))
    if is_active is not None:
        query = query.filter(SeasonalEvent.is_active == is_active)
    if start_date_from:
        query = query.filter(SeasonalEvent.start_date >= start_date_from)
    if start_date_to:
        query = query.filter(SeasonalEvent.start_date <= start_date_to)
    if search:
        query = query.filter(
            or_(
                SeasonalEvent.name.ilike(f"%{search}%"),
                SeasonalEvent.description.ilike(f"%{search}%"),
            )
        )

    # Get total count
    total = query.count()

    # Calculate pagination
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    # Get paginated results
    events = (
        query.order_by(SeasonalEvent.start_date.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return SeasonalEventListResponse(
        events=[SeasonalEventResponse.model_validate(e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/upcoming", response_model=List[SeasonalEventResponse])
async def get_upcoming_events(
    days: int = Query(
        default=30, ge=1, le=365, description="Number of days to look ahead"
    ),
    event_type: Optional[EventTypeEnum] = Query(
        default=None, description="Filter by event type"
    ),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of events"),
    db: Session = Depends(get_db),
):
    """
    Get upcoming seasonal events within the specified number of days.
    """
    today = date.today()
    end_date = today + timedelta(days=days)

    query = db.query(SeasonalEvent).filter(
        and_(
            SeasonalEvent.start_date >= today,
            SeasonalEvent.start_date <= end_date,
            SeasonalEvent.is_active.is_(True),
        )
    )

    if event_type:
        query = query.filter(SeasonalEvent.event_type == event_type.value)

    events = query.order_by(SeasonalEvent.start_date.asc()).limit(limit).all()

    return [SeasonalEventResponse.model_validate(e) for e in events]


@router.get("/types", response_model=List[dict])
async def get_event_types():
    """
    Get all available event types with descriptions.
    """
    return [
        {
            "value": EventType.FESTIVAL_INDIA.value,
            "label": "Indian Festival",
            "description": "Diwali, Dhanteras, Akshaya Tritiya, Navratri, etc.",
            "examples": [
                "Diwali",
                "Dhanteras",
                "Akshaya Tritiya",
                "Navratri",
                "Dussehra",
            ],
        },
        {
            "value": EventType.HOLIDAY_TRADING_INDIA.value,
            "label": "Indian Trading Holiday",
            "description": "MCX/NSE/BSE trading holidays",
            "examples": ["Republic Day", "Independence Day", "Holi", "Good Friday"],
        },
        {
            "value": EventType.HOLIDAY_TRADING_US.value,
            "label": "US Trading Holiday",
            "description": "COMEX/NYSE trading holidays",
            "examples": [
                "Independence Day (US)",
                "Thanksgiving",
                "Christmas",
                "New Year",
            ],
        },
        {
            "value": EventType.HOLIDAY_TRADING_GLOBAL.value,
            "label": "Global Trading Holiday",
            "description": "Major global market holidays",
            "examples": ["Chinese New Year", "Easter", "Christmas"],
        },
        {
            "value": EventType.ELECTION_INDIA.value,
            "label": "Indian Election",
            "description": "Lok Sabha, state elections, by-elections",
            "examples": ["Lok Sabha Election", "State Assembly Election"],
        },
        {
            "value": EventType.ELECTION_GLOBAL.value,
            "label": "Global Election",
            "description": "Major global elections affecting markets",
            "examples": ["US Presidential Election", "UK General Election"],
        },
        {
            "value": EventType.BUDGET_INDIA.value,
            "label": "Indian Budget",
            "description": "Union Budget, interim budget",
            "examples": ["Union Budget", "Interim Budget"],
        },
        {
            "value": EventType.POLICY_EVENT.value,
            "label": "Policy Event",
            "description": "Import duty changes, RBI policy, major announcements",
            "examples": ["Import Duty Change", "RBI Policy", "GST Rate Change"],
        },
        {
            "value": EventType.FOMC_MEETING.value,
            "label": "FOMC Meeting",
            "description": "Federal Reserve monetary policy meetings",
            "examples": ["FOMC Rate Decision", "Fed Chair Press Conference"],
        },
        {
            "value": EventType.MACRO_RELEASE.value,
            "label": "Macro Release",
            "description": "Economic data releases (CPI, NFP, GDP, etc.)",
            "examples": [
                "US CPI",
                "Non-Farm Payrolls",
                "GDP Release",
                "Jobless Claims",
            ],
        },
        {
            "value": EventType.CUSTOM.value,
            "label": "Custom Event",
            "description": "User-defined custom events",
            "examples": [],
        },
    ]


@router.get("/{event_id}", response_model=SeasonalEventResponse)
async def get_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific seasonal event by ID.
    """
    event = db.query(SeasonalEvent).filter(SeasonalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return SeasonalEventResponse.model_validate(event)


@router.post("/", response_model=SeasonalEventResponse, status_code=201)
async def create_event(
    event_data: SeasonalEventCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new seasonal event.
    """
    # Convert Pydantic model to dict with JSON mode to get string values for enums
    event_dict = event_data.model_dump(mode="json")

    # Create the event
    event = SeasonalEvent(**event_dict)

    db.add(event)
    db.commit()
    db.refresh(event)

    logger.info(f"Created seasonal event: {event.name} (ID: {event.id})")

    return SeasonalEventResponse.model_validate(event)


@router.put("/{event_id}", response_model=SeasonalEventResponse)
async def update_event(
    event_id: int,
    event_data: SeasonalEventUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing seasonal event.
    """
    event = db.query(SeasonalEvent).filter(SeasonalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Update only provided fields - use JSON mode for enum string values
    update_data = event_data.model_dump(exclude_unset=True, mode="json")

    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    logger.info(f"Updated seasonal event: {event.name} (ID: {event.id})")

    return SeasonalEventResponse.model_validate(event)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a seasonal event.
    """
    event = db.query(SeasonalEvent).filter(SeasonalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_name = event.name
    db.delete(event)
    db.commit()

    logger.info(f"Deleted seasonal event: {event_name} (ID: {event_id})")

    return None


@router.post("/{event_id}/toggle-active", response_model=SeasonalEventResponse)
async def toggle_event_active(
    event_id: int,
    db: Session = Depends(get_db),
):
    """
    Toggle the active status of an event.
    """
    event = db.query(SeasonalEvent).filter(SeasonalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_active = not event.is_active
    db.commit()
    db.refresh(event)

    logger.info(f"Toggled event active status: {event.name} -> {event.is_active}")

    return SeasonalEventResponse.model_validate(event)


@router.post("/{event_id}/verify", response_model=SeasonalEventResponse)
async def verify_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    """
    Mark an event as verified (admin action).
    """
    event = db.query(SeasonalEvent).filter(SeasonalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_verified = True
    db.commit()
    db.refresh(event)

    logger.info(f"Verified event: {event.name} (ID: {event_id})")

    return SeasonalEventResponse.model_validate(event)
