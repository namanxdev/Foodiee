"""
Recipe Admin API
================
Admin endpoints for recipe management including:
- List/view/edit recipes
- Mass generation
- Specific recipe generation
- Validation and fixing
- Export functionality
- Progress tracking
"""

import threading
import traceback
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel

from core.top_recipes_service import get_top_recipes, get_recipe_by_id, update_recipe
from workers.recipe_regeneration_worker import (
    start_recipe_regeneration,
    get_job_status,
    get_job_logs
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Admin email whitelist
ADMIN_EMAILS = [
    "ranjithkalingeri@oldowaninnovations.com",
    # Add more admin emails here
]


def verify_admin(x_admin_email: Optional[str] = Header(None)):
    """Verify admin access"""
    if not x_admin_email:
        raise HTTPException(
            status_code=401,
            detail="Admin email header required (X-Admin-Email)"
        )
    
    if x_admin_email not in ADMIN_EMAILS:
        raise HTTPException(
            status_code=403,
            detail=f"Email {x_admin_email} is not authorized for admin access"
        )
    
    return x_admin_email


# ============================================================================
# Request/Response Models
# ============================================================================

class RecipeUpdateRequest(BaseModel):
    """Request model for updating recipe"""
    name: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    steps: Optional[str] = None
    image: Optional[str] = None
    ingredients_image: Optional[str] = None
    steps_images: Optional[List[str]] = None
    steps_beginner: Optional[List[str]] = None
    steps_advanced: Optional[List[str]] = None
    cuisine: Optional[str] = None


class MassGenerationRequest(BaseModel):
    """Request model for mass generation"""
    cuisine_filter: Optional[str] = None
    recipe_count: Optional[int] = None
    fix_main_image: bool = False
    fix_ingredients_image: bool = False
    fix_steps_images: bool = False
    fix_steps_text: bool = False
    fix_ingredients_text: bool = False


class SpecificGenerationRequest(BaseModel):
    """Request model for specific recipe generation"""
    recipe_name: str
    fix_main_image: bool = False
    fix_ingredients_image: bool = False
    fix_steps_images: bool = False
    fix_steps_text: bool = False
    fix_ingredients_text: bool = False


class ValidationRequest(BaseModel):
    """Request model for recipe validation"""
    recipe_ids: Optional[List[int]] = None
    fix_main_image: bool = False
    fix_ingredients_image: bool = False
    fix_steps_images: bool = False
    fix_steps_text: bool = False
    fix_ingredients_text: bool = False


class CreateNewRecipeRequest(BaseModel):
    """Request model for creating a new recipe from scratch"""
    dish_name: str
    region: str
    # Image generation options (all default to True)
    generate_main_image: bool = True
    generate_ingredients_image: bool = True
    generate_step_images: bool = True


# ============================================================================
# Recipe Data Management Endpoints
# ============================================================================

@router.get("/recipes")
def list_recipes(
    skip: int = 0,
    limit: int = 50,
    cuisine: Optional[str] = None,
    validation_status: Optional[str] = None,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    List recipes with pagination and filters
    
    Query params:
    - skip: Number of recipes to skip (default: 0)
    - limit: Number of recipes to return (default: 50, max: 200)
    - cuisine: Filter by cuisine
    - validation_status: Filter by validation status ('pending', 'validated', 'needs_fixing')
    """
    verify_admin(admin_email)
    
    try:
        from dataclasses import asdict, is_dataclass
        
        # Get all recipes (returns tuple: (recipes, total_count))
        all_recipes, _ = get_top_recipes(limit=10000, detailed=True)
        
        # Convert dataclasses to dicts for easier filtering
        recipes_dicts = []
        for recipe in all_recipes:
            if is_dataclass(recipe):
                recipes_dicts.append(asdict(recipe))
            elif isinstance(recipe, dict):
                recipes_dicts.append(recipe)
            else:
                recipes_dicts.append(recipe.__dict__)
        
        # Apply filters
        filtered_recipes = recipes_dicts
        
        if cuisine:
            filtered_recipes = [r for r in filtered_recipes if r.get('region', '').lower() == cuisine.lower()]
        
        if validation_status:
            filtered_recipes = [r for r in filtered_recipes if r.get('validation_status') == validation_status]
        
        # Calculate statistics
        total = len(filtered_recipes)
        
        # Apply pagination
        paginated_recipes = filtered_recipes[skip:skip+min(limit, 200)]
        
        # Calculate missing data stats
        missing_main_images = sum(1 for r in filtered_recipes if not r.get('image_url'))
        missing_ingredients_images = sum(1 for r in filtered_recipes if not r.get('ingredients_image'))
        missing_steps_images = sum(1 for r in filtered_recipes if not r.get('step_image_urls') or len(r.get('step_image_urls', [])) == 0)
        missing_steps_text = sum(1 for r in filtered_recipes if not r.get('steps_beginner') and not r.get('steps_advanced'))
        
        return {
            "success": True,
            "total": total,
            "skip": skip,
            "limit": limit,
            "count": len(paginated_recipes),
            "recipes": paginated_recipes,
            "statistics": {
                "total": total,
                "missing_main_images": missing_main_images,
                "missing_ingredients_images": missing_ingredients_images,
                "missing_steps_images": missing_steps_images,
                "missing_steps_text": missing_steps_text
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recipes/{recipe_id}")
def get_recipe(
    recipe_id: int,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Get single recipe by ID"""
    verify_admin(admin_email)
    
    try:
        from dataclasses import asdict, is_dataclass
        
        recipe = get_recipe_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Convert dataclass to dict
        if is_dataclass(recipe):
            recipe_dict = asdict(recipe)
        elif isinstance(recipe, dict):
            recipe_dict = recipe
        else:
            recipe_dict = recipe.__dict__
        
        return {
            "success": True,
            "recipe": recipe_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recipes")
def create_recipe_endpoint(
    recipe_data: dict,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Create a new recipe in the database"""
    verify_admin(admin_email)
    
    try:
        import psycopg
        from dotenv import load_dotenv
        import os
        import json
        from datetime import datetime
        
        load_dotenv()
        
        # Get Supabase connection
        supabase_url = os.environ.get('SUPABASE_OG_URL')
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Database configuration error")
        
        conn = psycopg.connect(supabase_url)
        
        # Extract fields from recipe_data
        name = recipe_data.get('name')
        if not name:
            raise HTTPException(status_code=400, detail="Recipe name is required")
        
        description = recipe_data.get('description')
        region = recipe_data.get('region')
        difficulty = recipe_data.get('difficulty', 'medium')
        ingredients = recipe_data.get('ingredients', [])
        ingredients_image = recipe_data.get('ingredients_image')
        steps_beginner = recipe_data.get('steps_beginner', [])
        steps_advanced = recipe_data.get('steps_advanced', [])
        steps_beginner_images = recipe_data.get('steps_beginner_images', [])
        steps_advanced_images = recipe_data.get('steps_advanced_images', [])
        image_url = recipe_data.get('image_url')
        validation_status = recipe_data.get('validation_status', 'pending')
        
        # Insert into database
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO top_recipes (
                    name, description, region, difficulty,
                    ingredients, ingredients_image,
                    steps_beginner, steps_advanced,
                    steps_beginner_images, steps_advanced_images,
                    image_url, validation_status,
                    source, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
            """, (
                name, description, region, difficulty,
                json.dumps(ingredients), ingredients_image,
                json.dumps(steps_beginner), json.dumps(steps_advanced),
                json.dumps(steps_beginner_images), json.dumps(steps_advanced_images),
                image_url, validation_status,
                'admin_generated', datetime.now().isoformat()
            ))
            
            result = cur.fetchone()
            recipe_id = result[0] if result else None
            conn.commit()
        
        conn.close()
        
        return {
            "success": True,
            "message": f"Recipe created successfully with ID: {recipe_id}",
            "recipe_id": recipe_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/recipes/{recipe_id}")
def update_recipe_endpoint(
    recipe_id: int,
    request: RecipeUpdateRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Update recipe"""
    verify_admin(admin_email)
    
    try:
        from dataclasses import asdict, is_dataclass
        
        # Get current recipe
        recipe = get_recipe_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Build updates dict (only include provided fields)
        updates = {}
        for field, value in request.dict(exclude_unset=True).items():
            if value is not None:
                updates[field] = value
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update recipe - pass as keyword arguments
        success = update_recipe(recipe_id, **updates)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update recipe")
        
        # Get updated recipe
        updated_recipe = get_recipe_by_id(recipe_id)
        
        # Convert to dict if needed
        if is_dataclass(updated_recipe):
            recipe_dict = asdict(updated_recipe)
        elif isinstance(updated_recipe, dict):
            recipe_dict = updated_recipe
        else:
            recipe_dict = updated_recipe.__dict__
        
        return {
            "success": True,
            "message": "Recipe updated successfully",
            "recipe": recipe_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/recipes/{recipe_id}")
def delete_recipe_endpoint(
    recipe_id: int,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Delete recipe"""
    verify_admin(admin_email)
    
    try:
        import psycopg
        from dotenv import load_dotenv
        import os
        
        load_dotenv()
        
        # Get Supabase connection
        supabase_url = os.environ.get('SUPABASE_OG_URL')
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Database configuration error")
        
        # Check if recipe exists
        recipe = get_recipe_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Delete from database
        conn = psycopg.connect(supabase_url)
        with conn.cursor() as cur:
            cur.execute("DELETE FROM top_recipes WHERE id = %s", (recipe_id,))
            conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Recipe {recipe_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recipes/search/{query}")
def search_recipes(
    query: str,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Search recipes by name"""
    verify_admin(admin_email)
    
    try:
        all_recipes, _ = get_top_recipes(limit=10000, detailed=True)
        query_lower = query.lower()
        
        # Helper function to safely get attributes
        def get_attr(r, key, default=''):
            if isinstance(r, dict):
                return r.get(key, default)
            return getattr(r, key, default)
        
        # Search in name and description
        results = [
            r for r in all_recipes
            if query_lower in get_attr(r, 'name', '').lower() or
               query_lower in get_attr(r, 'description', '').lower()
        ]
        
        return {
            "success": True,
            "count": len(results),
            "recipes": results[:20]  # Limit to 20 results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Generation Endpoints
# ============================================================================

@router.post("/generate/mass")
def mass_generate(
    request: MassGenerationRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Start mass recipe generation job
    
    Generates/fixes recipes in bulk with selective fixing options
    """
    admin = verify_admin(admin_email)
    
    # Validate at least one fix option is selected
    if not any([
        request.fix_main_image,
        request.fix_ingredients_image,
        request.fix_steps_images,
        request.fix_steps_text,
        request.fix_ingredients_text
    ]):
        raise HTTPException(
            status_code=400,
            detail="At least one fix option must be selected"
        )
    
    try:
        # Start job in background thread
        def run_job():
            start_recipe_regeneration(
                job_type='mass_generation',
                started_by=admin,
                fix_main_image=request.fix_main_image,
                fix_ingredients_image=request.fix_ingredients_image,
                fix_steps_images=request.fix_steps_images,
                fix_steps_text=request.fix_steps_text,
                fix_ingredients_text=request.fix_ingredients_text,
                cuisine_filter=request.cuisine_filter,
                recipe_count=request.recipe_count
            )
        
        thread = threading.Thread(target=run_job, daemon=True)
        thread.start()
        
        return {
            "success": True,
            "message": "Mass generation job started in background",
            "note": "Use /status endpoint to track progress"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/specific")
def specific_generate(
    request: SpecificGenerationRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Generate/fix specific recipe by name
    
    Finds recipe by name and applies selected fixes
    """
    admin = verify_admin(admin_email)
    
    # Validate at least one fix option is selected
    if not any([
        request.fix_main_image,
        request.fix_ingredients_image,
        request.fix_steps_images,
        request.fix_steps_text,
        request.fix_ingredients_text
    ]):
        raise HTTPException(
            status_code=400,
            detail="At least one fix option must be selected"
        )
    
    try:
        # Start job in background thread
        def run_job():
            start_recipe_regeneration(
                job_type='specific_generation',
                started_by=admin,
                fix_main_image=request.fix_main_image,
                fix_ingredients_image=request.fix_ingredients_image,
                fix_steps_images=request.fix_steps_images,
                fix_steps_text=request.fix_steps_text,
                fix_ingredients_text=request.fix_ingredients_text,
                recipe_name=request.recipe_name
            )
        
        thread = threading.Thread(target=run_job, daemon=True)
        thread.start()
        
        return {
            "success": True,
            "message": f"Generation started for recipe: {request.recipe_name}",
            "note": "Use /status endpoint to track progress"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
def validate_recipes(
    request: ValidationRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Validate and fix recipe issues
    
    Checks recipe data quality and applies fixes
    """
    admin = verify_admin(admin_email)
    
    # Validate at least one fix option is selected
    if not any([
        request.fix_main_image,
        request.fix_ingredients_image,
        request.fix_steps_images,
        request.fix_steps_text,
        request.fix_ingredients_text
    ]):
        raise HTTPException(
            status_code=400,
            detail="At least one fix option must be selected"
        )
    
    try:
        # Start job in background thread
        def run_job():
            start_recipe_regeneration(
                job_type='validation',
                started_by=admin,
                fix_main_image=request.fix_main_image,
                fix_ingredients_image=request.fix_ingredients_image,
                fix_steps_images=request.fix_steps_images,
                fix_steps_text=request.fix_steps_text,
                fix_ingredients_text=request.fix_ingredients_text,
                recipe_ids=request.recipe_ids
            )
        
        thread = threading.Thread(target=run_job, daemon=True)
        thread.start()
        
        return {
            "success": True,
            "message": "Validation job started in background",
            "note": "Use /status endpoint to track progress"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Progress Tracking Endpoints
# ============================================================================

@router.get("/jobs")
def list_jobs(
    status: str = None,
    limit: int = 100,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """List recent regeneration jobs with optional status filter"""
    verify_admin(admin_email)
    
    try:
        import psycopg
        from psycopg.rows import dict_row
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        supabase_url = os.environ.get("SUPABASE_OG_URL")
        conn = psycopg.connect(supabase_url, row_factory=dict_row)
        
        with conn.cursor() as cur:
            if status:
                cur.execute("""
                    SELECT * FROM recipe_regeneration_jobs
                    WHERE status = %s
                    ORDER BY started_at DESC
                    LIMIT %s
                """, (status, limit))
            else:
                cur.execute("""
                    SELECT * FROM recipe_regeneration_jobs
                    ORDER BY started_at DESC
                    LIMIT %s
                """, (limit,))
            jobs = cur.fetchall()
        
        conn.close()
        
        return {
            "success": True,
            "count": len(jobs),
            "jobs": jobs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}")
def get_job_status_endpoint(
    job_id: int,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Get specific job status"""
    verify_admin(admin_email)
    
    try:
        job = get_job_status(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "success": True,
            "job": job
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/cancel")
def cancel_job_endpoint(
    job_id: int,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Cancel a running job"""
    verify_admin(admin_email)
    
    conn = None
    try:
        import psycopg
        from psycopg.rows import dict_row
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        supabase_url = os.environ.get("SUPABASE_OG_URL")
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Database configuration error")
        
        conn = psycopg.connect(supabase_url, row_factory=dict_row)
        
        with conn.cursor() as cur:
            # Check if job exists and is running
            cur.execute("""
                SELECT id, status FROM recipe_regeneration_jobs
                WHERE id = %s
            """, (job_id,))
            job = cur.fetchone()
            
            if not job:
                raise HTTPException(status_code=404, detail="Job not found")
            
            if job['status'] not in ['pending', 'running']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot cancel job with status '{job['status']}'. Only 'pending' or 'running' jobs can be cancelled."
                )
            
            # Update status to cancelled
            cur.execute("""
                UPDATE recipe_regeneration_jobs
                SET status = 'cancelled',
                    completed_at = NOW(),
                    error_message = 'Cancelled by admin'
                WHERE id = %s
            """, (job_id,))
            conn.commit()
            
            # Log the cancellation
            cur.execute("""
                INSERT INTO recipe_regeneration_logs
                (job_id, recipe_id, recipe_name, log_level, message, operation, details)
                VALUES (%s, NULL, NULL, %s, %s, %s, NULL)
            """, (
                job_id,
                'WARNING',
                f"Job {job_id} cancelled by admin: {admin_email}",
                'job_cancel'
            ))
            conn.commit()
        
        return {
            "success": True,
            "message": f"Job {job_id} has been cancelled successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error cancelling job {job_id}: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and not conn.closed:
            conn.close()


@router.get("/jobs/{job_id}/logs")
def get_job_logs_endpoint(
    job_id: int,
    limit: int = 100,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Get job logs"""
    verify_admin(admin_email)
    
    try:
        logs = get_job_logs(job_id, limit)
        
        return {
            "success": True,
            "count": len(logs),
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Export Endpoints
# ============================================================================

@router.get("/export/recipes")
def export_recipes(
    format: str = "json",
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Export recipes data
    
    Query params:
    - format: Export format ('json', 'csv') - SQL export handled separately
    """
    verify_admin(admin_email)
    
    try:
        recipes, _ = get_top_recipes(limit=10000, detailed=True)
        
        # Convert dataclass objects to dicts
        from dataclasses import asdict, is_dataclass
        recipes_dicts = []
        for recipe in recipes:
            if is_dataclass(recipe):
                recipes_dicts.append(asdict(recipe))
            elif isinstance(recipe, dict):
                recipes_dicts.append(recipe)
            else:
                # Fallback: convert to dict using __dict__
                recipes_dicts.append(recipe.__dict__)
        
        if format == "json":
            return {
                "success": True,
                "format": "json",
                "count": len(recipes_dicts),
                "data": recipes_dicts
            }
        
        elif format == "csv":
            import csv
            import io
            from fastapi.responses import StreamingResponse
            
            # Create CSV in memory
            output = io.StringIO()
            if recipes_dicts:
                # Flatten nested structures for CSV
                flattened_recipes = []
                for recipe in recipes_dicts:
                    flat_recipe = {}
                    for key, value in recipe.items():
                        # Convert lists/dicts to JSON strings for CSV
                        if isinstance(value, (list, dict)):
                            import json
                            flat_recipe[key] = json.dumps(value)
                        else:
                            flat_recipe[key] = value
                    flattened_recipes.append(flat_recipe)
                
                # Get all unique keys across all recipes
                all_keys = set()
                for recipe in flattened_recipes:
                    all_keys.update(recipe.keys())
                
                writer = csv.DictWriter(output, fieldnames=sorted(all_keys))
                writer.writeheader()
                writer.writerows(flattened_recipes)
            
            # Return as downloadable file
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=recipes.csv"}
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
def get_statistics(
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """Get overall recipe statistics"""
    verify_admin(admin_email)
    
    try:
        all_recipes, _ = get_top_recipes(limit=10000, detailed=True)
        
        # Calculate comprehensive stats (handle both dict and object types)
        def get_attr(r, key, default=None):
            if isinstance(r, dict):
                return r.get(key, default)
            return getattr(r, key, default)
        
        total = len(all_recipes)
        missing_main_images = sum(1 for r in all_recipes if not get_attr(r, 'image_url'))
        missing_ingredients_images = sum(1 for r in all_recipes if not get_attr(r, 'ingredients_image'))
        missing_steps_images = sum(1 for r in all_recipes if not get_attr(r, 'step_image_urls') or len(get_attr(r, 'step_image_urls', []) or []) == 0)
        missing_steps_beginner = sum(1 for r in all_recipes if not get_attr(r, 'steps_beginner'))
        missing_steps_advanced = sum(1 for r in all_recipes if not get_attr(r, 'steps_advanced'))
        
        # Get unique cuisines (using 'region' field, not 'cuisine')
        cuisines = list(set(get_attr(r, 'region', 'Unknown') for r in all_recipes))
        
        # Get validation statuses
        validation_statuses = {}
        for recipe in all_recipes:
            status = get_attr(recipe, 'validation_status', 'pending')
            validation_statuses[status] = validation_statuses.get(status, 0) + 1
        
        return {
            "success": True,
            "statistics": {
                "total_recipes": total,
                "missing_data": {
                    "main_images": missing_main_images,
                    "ingredients_images": missing_ingredients_images,
                    "steps_images": missing_steps_images,
                    "steps_beginner": missing_steps_beginner,
                    "steps_advanced": missing_steps_advanced
                },
                "cuisines": {
                    "total": len(cuisines),
                    "list": sorted(cuisines)
                },
                "validation_statuses": validation_statuses,
                "completeness": {
                    "fully_complete": sum(
                        1 for r in all_recipes
                        if get_attr(r, 'image_url') and
                           get_attr(r, 'ingredients_image') and
                           get_attr(r, 'step_image_urls') and
                           len(get_attr(r, 'step_image_urls', []) or []) > 0 and
                           (get_attr(r, 'steps_beginner') or get_attr(r, 'steps_advanced'))
                    ),
                    "needs_attention": sum(
                        1 for r in all_recipes
                        if not get_attr(r, 'image_url') or
                           not get_attr(r, 'ingredients_image') or
                           not get_attr(r, 'step_image_urls') or
                           len(get_attr(r, 'step_image_urls', []) or []) == 0 or
                           (not get_attr(r, 'steps_beginner') and not get_attr(r, 'steps_advanced'))
                    )
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# New Recipe Creation Endpoint
# ============================================================================

@router.post("/generate/create-new")
def create_new_recipe(
    request: CreateNewRecipeRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Create a completely new recipe from scratch
    Generates: name, description, ingredients, images, beginner/advanced steps
    Returns job_id - use /jobs/{job_id} to track progress
    """
    admin = verify_admin(admin_email)
    
    try:
        from workers.recipe_regeneration_worker import RecipeRegenerationTracker
        from workers.recipe_creation_worker import run_recipe_creation
        
        # Create tracker and job
        tracker = RecipeRegenerationTracker()
        job_id = tracker.create_job(
            job_type='new_recipe_creation',
            started_by=admin,
            total_recipes=1
        )
        tracker.close()
        
        # Start background thread with the worker function
        thread = threading.Thread(
            target=run_recipe_creation,
            args=(
                job_id,
                request.dish_name,
                request.region,
                request.generate_main_image,
                request.generate_ingredients_image,
                request.generate_step_images
            ),
            daemon=True
        )
        thread.start()
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Recipe creation started in background",
            "note": "Use GET /api/admin/jobs/{job_id} to track progress"
        }
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Config Management Endpoints
# ============================================================================

class ConfigUpdateRequest(BaseModel):
    """Request model for updating config"""
    config_value: dict
    description: Optional[str] = None


@router.get("/config")
def get_config(
    config_key: Optional[str] = None,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Get admin configuration
    
    Query params:
    - config_key: Specific config key (optional, returns all if not provided)
    """
    verify_admin(admin_email)
    
    try:
        import psycopg
        from psycopg.rows import dict_row
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        supabase_url = os.environ.get("SUPABASE_OG_URL")
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Database configuration error")
        
        conn = psycopg.connect(supabase_url, row_factory=dict_row)
        
        with conn.cursor() as cur:
            if config_key:
                cur.execute("""
                    SELECT * FROM admin_config
                    WHERE config_key = %s
                """, (config_key,))
                config = cur.fetchone()
                
                if not config:
                    raise HTTPException(status_code=404, detail=f"Config key '{config_key}' not found")
                
                return {
                    "success": True,
                    "config": dict(config)
                }
            else:
                cur.execute("""
                    SELECT * FROM admin_config
                    ORDER BY config_key
                """)
                configs = cur.fetchall()
                
                return {
                    "success": True,
                    "count": len(configs),
                    "configs": [dict(c) for c in configs]
                }
        
        conn.close()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config/{config_key}")
def update_config(
    config_key: str,
    request: ConfigUpdateRequest,
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Update admin configuration
    
    Currently supports:
    - max_allowed_image_generation: {"default": number, "per_user": {"email": number}}
    """
    verify_admin(admin_email)
    
    try:
        import psycopg
        from psycopg.rows import dict_row
        import os
        import json
        from dotenv import load_dotenv
        
        load_dotenv()
        supabase_url = os.environ.get("SUPABASE_OG_URL")
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Database configuration error")
        
        conn = psycopg.connect(supabase_url, row_factory=dict_row)
        
        with conn.cursor() as cur:
            # Check if config exists
            cur.execute("""
                SELECT id FROM admin_config
                WHERE config_key = %s
            """, (config_key,))
            existing = cur.fetchone()
            
            config_value_json = json.dumps(request.config_value)
            
            if existing:
                # Update existing config
                cur.execute("""
                    UPDATE admin_config
                    SET config_value = %s::jsonb,
                        description = COALESCE(%s, description),
                        updated_by = %s,
                        updated_at = TIMEZONE('utc', NOW())
                    WHERE config_key = %s
                    RETURNING *
                """, (config_value_json, request.description, admin_email, config_key))
            else:
                # Create new config
                cur.execute("""
                    INSERT INTO admin_config (config_key, config_value, description, updated_by)
                    VALUES (%s, %s::jsonb, %s, %s)
                    RETURNING *
                """, (config_key, config_value_json, request.description, admin_email))
            
            updated_config = cur.fetchone()
            conn.commit()
        
        conn.close()
        
        return {
            "success": True,
            "message": f"Config '{config_key}' updated successfully",
            "config": dict(updated_config)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config/{config_key}/per-user/{user_email}")
def update_user_specific_limit(
    config_key: str,
    user_email: str,
    limit: int = Query(..., description="New limit value"),
    admin_email: str = Header(None, alias="X-Admin-Email")
):
    """
    Update per-user limit for image generation
    
    Example: PUT /api/admin/config/max_allowed_image_generation/per-user/user@example.com?limit=20
    """
    verify_admin(admin_email)
    
    if config_key != "max_allowed_image_generation":
        raise HTTPException(
            status_code=400,
            detail="This endpoint only supports 'max_allowed_image_generation' config key"
        )
    
    try:
        import psycopg
        from psycopg.rows import dict_row
        import os
        import json
        from dotenv import load_dotenv
        
        load_dotenv()
        supabase_url = os.environ.get("SUPABASE_OG_URL")
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Database configuration error")
        
        conn = psycopg.connect(supabase_url, row_factory=dict_row)
        
        with conn.cursor() as cur:
            # Get current config
            cur.execute("""
                SELECT config_value FROM admin_config
                WHERE config_key = %s
            """, (config_key,))
            
            config_row = cur.fetchone()
            if not config_row:
                raise HTTPException(status_code=404, detail=f"Config key '{config_key}' not found")
            
            # Parse current config
            current_config = config_row['config_value']
            if isinstance(current_config, str):
                current_config = json.loads(current_config)
            
            # Update per_user section
            if 'per_user' not in current_config:
                current_config['per_user'] = {}
            
            current_config['per_user'][user_email] = limit
            
            # Update database
            cur.execute("""
                UPDATE admin_config
                SET config_value = %s::jsonb,
                    updated_by = %s,
                    updated_at = TIMEZONE('utc', NOW())
                WHERE config_key = %s
                RETURNING *
            """, (json.dumps(current_config), admin_email, config_key))
            
            updated_config = cur.fetchone()
            conn.commit()
        
        conn.close()
        
        return {
            "success": True,
            "message": f"User-specific limit for {user_email} updated to {limit}",
            "config": dict(updated_config)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
