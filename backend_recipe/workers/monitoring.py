"""
Monitoring Utilities
====================
Helper functions for monitoring image generation jobs
"""

import os
from typing import Optional, Dict, List
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Get Supabase database connection"""
    supabase_url = os.environ.get("SUPABASE_OG_URL")
    if not supabase_url:
        raise ValueError("SUPABASE_OG_URL not found in environment variables")
    return psycopg.connect(supabase_url, row_factory=dict_row)


def get_active_job() -> Optional[Dict]:
    """
    Get currently running job
    
    Returns:
        Job dictionary or None if no active job
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM image_generation_jobs
                WHERE status = 'running'
                ORDER BY started_at DESC
                LIMIT 1
            """)
            return cur.fetchone()
    finally:
        conn.close()


def get_job_by_id(job_id: int) -> Optional[Dict]:
    """
    Get job by ID
    
    Args:
        job_id: Job ID
        
    Returns:
        Job dictionary or None if not found
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM image_generation_jobs WHERE id = %s
            """, (job_id,))
            return cur.fetchone()
    finally:
        conn.close()


def get_job_statistics() -> Dict:
    """
    Get overall statistics for all jobs
    
    Returns:
        Dictionary with job statistics
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Overall stats
            cur.execute("""
                SELECT 
                    COUNT(*) as total_jobs,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
                    SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_jobs,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_jobs,
                    SUM(CASE WHEN status = 'stopped' THEN 1 ELSE 0 END) as stopped_jobs,
                    SUM(completed_count) as total_images_generated,
                    SUM(failed_count) as total_images_failed
                FROM image_generation_jobs
            """)
            stats = cur.fetchone()
            
            # Recent jobs
            cur.execute("""
                SELECT id, status, started_at, completed_at, 
                       completed_count, failed_count, total_recipes
                FROM image_generation_jobs
                ORDER BY started_at DESC
                LIMIT 10
            """)
            recent_jobs = cur.fetchall()
            
            return {
                **stats,
                'recent_jobs': recent_jobs
            }
    finally:
        conn.close()


def get_latest_job() -> Optional[Dict]:
    """
    Get the most recent job (any status)
    
    Returns:
        Job dictionary or None
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM image_generation_jobs
                ORDER BY created_at DESC
                LIMIT 1
            """)
            return cur.fetchone()
    finally:
        conn.close()


def stop_job(job_id: int) -> bool:
    """
    Request graceful stop for a job
    
    Args:
        job_id: Job ID to stop
        
    Returns:
        True if stop signal sent successfully
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE image_generation_jobs
                SET should_stop = TRUE
                WHERE id = %s AND status = 'running'
            """, (job_id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()


def get_job_logs(job_id: int, limit: int = 100, level: Optional[str] = None) -> List[Dict]:
    """
    Get logs for a specific job
    
    Args:
        job_id: Job ID
        limit: Maximum number of logs to return
        level: Filter by log level (optional)
        
    Returns:
        List of log entries
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if level:
                cur.execute("""
                    SELECT * FROM image_generation_logs
                    WHERE job_id = %s AND level = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (job_id, level, limit))
            else:
                cur.execute("""
                    SELECT * FROM image_generation_logs
                    WHERE job_id = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (job_id, limit))
            
            return cur.fetchall()
    finally:
        conn.close()


def count_recipes_without_images() -> int:
    """
    Count recipes that don't have main images
    
    Returns:
        Number of recipes without images
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) as count
                FROM top_recipes
                WHERE image_url IS NULL OR image_url = ''
            """)
            return cur.fetchone()['count']
    finally:
        conn.close()


def get_next_recipe_without_image(start_from_id: Optional[int] = None) -> Optional[Dict]:
    """
    Get the next recipe that needs an image
    
    Args:
        start_from_id: Start searching from this recipe ID
        
    Returns:
        Recipe dict or None if all recipes have images
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if start_from_id:
                cur.execute("""
                    SELECT id, name FROM top_recipes
                    WHERE (image_url IS NULL OR image_url = '')
                    AND id >= %s
                    ORDER BY id ASC
                    LIMIT 1
                """, (start_from_id,))
            else:
                cur.execute("""
                    SELECT id, name FROM top_recipes
                    WHERE image_url IS NULL OR image_url = ''
                    ORDER BY id ASC
                    LIMIT 1
                """)
            
            return cur.fetchone()
    finally:
        conn.close()
