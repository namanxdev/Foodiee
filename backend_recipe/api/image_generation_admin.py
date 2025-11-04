"""
Image Generation Admin API Routes
==================================
Admin endpoints for managing batch image generation jobs
Protected by email whitelist authentication
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Header, BackgroundTasks
from dotenv import load_dotenv

from models import (
    StartImageGenerationRequest,
    StopImageGenerationRequest,
    ImageGenerationJobModel,
    ImageGenerationLogModel,
    StartJobResponse,
    StopJobResponse,
    JobStatusResponse,
    JobLogsResponse,
    JobStatisticsResponse,
    HealthCheckResponse
)
from workers import (
    start_batch_image_generation,
    stop_batch_image_generation,
    get_job_status as get_status,
    get_job_logs as fetch_logs,
    get_active_job,
    get_job_statistics
)
from workers.monitoring import count_recipes_without_images

load_dotenv()

router = APIRouter(prefix="/api/admin/image-generation", tags=["admin-image-generation"])


# ============================================================================
# Authentication Helper
# ============================================================================

def verify_admin_access(x_admin_email: Optional[str] = Header(None)):
    """
    Verify admin access via email whitelist
    
    Args:
        x_admin_email: Email from request header
        
    Raises:
        HTTPException: If email not in whitelist
    """
    if not x_admin_email:
        raise HTTPException(
            status_code=401,
            detail="Admin email header required (X-Admin-Email)"
        )
    
    # Get whitelist from environment
    admin_emails_str = os.getenv("ADMIN_EMAILS", "")
    admin_emails = [email.strip() for email in admin_emails_str.split(",") if email.strip()]
    
    if not admin_emails:
        raise HTTPException(
            status_code=500,
            detail="Admin email whitelist not configured"
        )
    
    if x_admin_email.lower() not in [email.lower() for email in admin_emails]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Email not in admin whitelist."
        )
    
    return x_admin_email


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health", response_model=HealthCheckResponse)
async def health_check(admin_email: str = Header(None, alias="X-Admin-Email")):
    """
    Health check and system status
    Shows configuration status and current state
    """
    verify_admin_access(admin_email)
    
    try:
        # Check active job
        active_job = get_active_job()
        
        # Count recipes without images
        recipes_without_images = count_recipes_without_images()
        
        # Check S3 configuration
        s3_configured = bool(
            os.getenv("AWS_ACCESS_KEY_ID") and
            os.getenv("AWS_SECRET_ACCESS_KEY") and
            os.getenv("AWS_S3_BUCKET_NAME")
        )
        
        # Check Gemini configuration
        gemini_configured = bool(os.getenv("GOOGLE_API_KEY"))
        
        return HealthCheckResponse(
            success=True,
            message="System healthy",
            active_job=ImageGenerationJobModel(**active_job) if active_job else None,
            recipes_without_images=recipes_without_images,
            s3_configured=s3_configured,
            gemini_configured=gemini_configured
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# ============================================================================
# Job Control Endpoints
# ============================================================================

@router.post("/start", response_model=StartJobResponse)
async def start_generation(
    request: StartImageGenerationRequest,
    background_tasks: BackgroundTasks,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Start batch image generation job
    
    Runs in background and returns immediately with job ID
    Use /status endpoint to monitor progress
    """
    verify_admin_access(admin_email)
    
    try:
        # Start job in background
        def run_job():
            start_batch_image_generation(
                image_type=request.image_type,
                start_from_recipe_id=request.start_from_recipe_id
            )
        
        background_tasks.add_task(run_job)
        
        # Return immediately with pending status
        return StartJobResponse(
            success=True,
            message="Image generation job started in background",
            job_id=None  # Will be available in status endpoint
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start job: {str(e)}")


@router.post("/stop", response_model=StopJobResponse)
async def stop_generation(
    request: StopImageGenerationRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Request graceful stop for a running job
    Job will finish current recipe and then stop
    """
    verify_admin_access(admin_email)
    
    try:
        result = stop_batch_image_generation(request.job_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        
        return StopJobResponse(
            success=True,
            message=result["message"],
            job_id=request.job_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop job: {str(e)}")


# ============================================================================
# Monitoring Endpoints
# ============================================================================

@router.get("/status", response_model=JobStatusResponse)
async def get_status_endpoint(
    job_id: Optional[int] = Query(None, description="Specific job ID (optional, defaults to active job)"),
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Get status of a job
    If no job_id provided, returns active job status
    """
    verify_admin_access(admin_email)
    
    try:
        # If no job_id, get active job
        if job_id is None:
            active_job = get_active_job()
            if not active_job:
                # No active job, get latest job
                from workers.monitoring import get_latest_job
                active_job = get_latest_job()
                
                if not active_job:
                    return JobStatusResponse(
                        success=True,
                        message="No jobs found",
                        job=None
                    )
            
            job_data = active_job
        else:
            result = get_status(job_id)
            if not result["success"]:
                raise HTTPException(status_code=404, detail=result["message"])
            job_data = result["job"]
        
        # Calculate progress percentage
        total = job_data['total_recipes']
        completed = job_data['completed_count']
        progress_percentage = (completed / total * 100) if total > 0 else 0
        
        return JobStatusResponse(
            success=True,
            job=ImageGenerationJobModel(**job_data),
            progress_percentage=round(progress_percentage, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/logs", response_model=JobLogsResponse)
async def get_logs_endpoint(
    job_id: Optional[int] = Query(None, description="Specific job ID (optional, defaults to active job)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    level: Optional[str] = Query(None, description="Filter by log level (INFO, WARNING, ERROR, SUCCESS)"),
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Get logs for a job
    If no job_id provided, returns logs for active job
    """
    verify_admin_access(admin_email)
    
    try:
        # If no job_id, get active job ID
        if job_id is None:
            active_job = get_active_job()
            if not active_job:
                # No active job, get latest job
                from workers.monitoring import get_latest_job
                active_job = get_latest_job()
                
                if not active_job:
                    return JobLogsResponse(
                        success=True,
                        job_id=0,
                        logs=[],
                        count=0
                    )
            
            job_id = active_job['id']
        
        result = fetch_logs(job_id, limit, level)
        
        return JobLogsResponse(
            success=True,
            job_id=job_id,
            logs=[ImageGenerationLogModel(**log) for log in result["logs"]],
            count=result["count"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")


@router.get("/statistics", response_model=JobStatisticsResponse)
async def get_statistics_endpoint(
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Get overall statistics for all jobs
    """
    verify_admin_access(admin_email)
    
    try:
        stats = get_job_statistics()
        recipes_without_images = count_recipes_without_images()
        
        return JobStatisticsResponse(
            success=True,
            total_jobs=stats['total_jobs'] or 0,
            completed_jobs=stats['completed_jobs'] or 0,
            running_jobs=stats['running_jobs'] or 0,
            failed_jobs=stats['failed_jobs'] or 0,
            stopped_jobs=stats['stopped_jobs'] or 0,
            total_images_generated=stats['total_images_generated'] or 0,
            total_images_failed=stats['total_images_failed'] or 0,
            recipes_without_images=recipes_without_images,
            recent_jobs=stats['recent_jobs']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


# ============================================================================
# Utility Endpoints
# ============================================================================

@router.get("/recipes-without-images")
async def get_recipes_without_images(
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Get count and list of recipes without images
    """
    verify_admin_access(admin_email)
    
    try:
        count = count_recipes_without_images()
        
        from workers.monitoring import get_next_recipe_without_image
        next_recipe = get_next_recipe_without_image()
        
        return {
            "success": True,
            "count": count,
            "next_recipe": next_recipe
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recipes: {str(e)}")
