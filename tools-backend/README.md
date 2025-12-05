# Bullion Brain - Backend API

Gold & Silver Trading Tools Platform - FastAPI Backend

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ with TimescaleDB extension
- Redis 7+

### Installation

1. Create virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup environment variables:
```bash
copy .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
alembic upgrade head
```

### Running the Server

Development mode:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Project Structure

```
tools-backend/
├── api/
│   └── v1/
│       ├── endpoints/      # API route handlers
│       └── router.py       # Main API router
├── models/                 # SQLAlchemy models
├── schemas/                # Pydantic schemas
├── services/               # Business logic
├── utils/                  # Helper functions
├── config.py               # Configuration
├── database.py             # Database connection
└── main.py                 # FastAPI application
```

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
```

### Linting
```bash
ruff check .
```
