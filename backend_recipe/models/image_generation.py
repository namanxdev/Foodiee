"""
Image Generation Pydantic Models
=================================
Models for image generation jobs, status, and logs
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================================================
# Request Models
# ============================================================================

class StartImageGenerationRequest(BaseModel):
    """Request to start batch image generation"""
    image_type: str = Field(
        default="main",
        description="Type of images to generate: 'main', 'steps', or 'all'"
    )
    start_from_recipe_id: Optional[int] = Field(
        None,
        description="Start from specific recipe ID (optional, auto-detects if not provided)"
    )


class StopImageGenerationRequest(BaseModel):
    """Request to stop a running job"""
    job_id: int = Field(..., description="Job ID to stop")


# ============================================================================
# Response Models
# ============================================================================

class ImageGenerationJobModel(BaseModel):
    """Image generation job information"""
    id: int
    status: str
    image_type: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    total_recipes: int
    completed_count: int
    failed_count: int
    skipped_count: int
    current_recipe_id: Optional[int]
    current_recipe_name: Optional[str]
    last_processed_recipe_id: Optional[int]
    start_from_recipe_id: Optional[int]
    should_stop: bool
    error_message: Optional[str]
    error_count: int
    created_at: datetime
    updated_at: datetime


class ImageGenerationLogModel(BaseModel):
    """Image generation log entry"""
    id: int
    job_id: int
    timestamp: datetime
    level: str
    message: str
    recipe_id: Optional[int]
    recipe_name: Optional[str]
    error_details: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]


class StartJobResponse(BaseModel):
    """Response when starting a job"""
    success: bool
    message: str
    job_id: Optional[int] = None
    completed: Optional[int] = None
    failed: Optional[int] = None
    skipped: Optional[int] = None


class StopJobResponse(BaseModel):
    """Response when stopping a job"""
    success: bool
    message: str
    job_id: int


class JobStatusResponse(BaseModel):
    """Response with job status"""
    success: bool
    message: Optional[str] = None
    job: Optional[ImageGenerationJobModel] = None
    progress_percentage: Optional[float] = None
    estimated_remaining: Optional[int] = None


class JobLogsResponse(BaseModel):
    """Response with job logs"""
    success: bool
    job_id: int
    logs: List[ImageGenerationLogModel]
    count: int


class JobStatisticsResponse(BaseModel):
    """Response with overall job statistics"""
    success: bool = True
    total_jobs: int
    completed_jobs: int
    running_jobs: int
    failed_jobs: int
    stopped_jobs: int
    total_images_generated: int
    total_images_failed: int
    recipes_without_images: int
    recent_jobs: List[Dict[str, Any]]


class HealthCheckResponse(BaseModel):
    """Health check response"""
    success: bool = True
    message: str
    active_job: Optional[ImageGenerationJobModel] = None
    recipes_without_images: int
    s3_configured: bool
    gemini_configured: bool
