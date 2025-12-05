from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from config import settings
from database import engine, Base
from api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.app_name} API")
    logger.info(f"Environment: {settings.app_env}")
    
    # Create database tables
    # Base.metadata.create_all(bind=engine)  # Uncomment when models are ready
    
    yield
    
    # Shutdown
    logger.info("Shutting down API")


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Gold & Silver Trading Tools Platform - Professional MCX Trading Analytics",
    version="1.0.0",
    docs_url=f"/api/{settings.api_version}/docs",
    redoc_url=f"/api/{settings.api_version}/redoc",
    openapi_url=f"/api/{settings.api_version}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Middleware for response compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.debug else "An unexpected error occurred"
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env
    }


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": "1.0.0",
        "docs": f"/api/{settings.api_version}/docs"
    }


# Include API router
app.include_router(api_router, prefix=f"/api/{settings.api_version}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info"
    )
