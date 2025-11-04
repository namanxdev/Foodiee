/**
 * Image Generation System Types
 * ==============================
 * TypeScript types for the image generation admin dashboard
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'stopped' | 'failed';
export type ImageType = 'main' | 'steps' | 'all';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';

export interface ImageGenerationJob {
  id: number;
  status: JobStatus;
  image_type: ImageType;
  started_at: string | null;
  completed_at: string | null;
  total_recipes: number;
  completed_count: number;
  failed_count: number;
  skipped_count: number;
  current_recipe_id: number | null;
  current_recipe_name: string | null;
  last_processed_recipe_id: number | null;
  start_from_recipe_id: number | null;
  should_stop: boolean;
  error_message: string | null;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImageGenerationLog {
  id: number;
  job_id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  recipe_id: number | null;
  recipe_name: string | null;
  error_details?: any;
  metadata?: any;
}

export interface JobStatusResponse {
  success: boolean;
  message?: string;
  job: ImageGenerationJob | null;
  progress_percentage?: number;
  estimated_remaining?: number;
}

export interface JobLogsResponse {
  success: boolean;
  job_id: number;
  logs: ImageGenerationLog[];
  count: number;
}

export interface JobStatistics {
  success: boolean;
  total_jobs: number;
  completed_jobs: number;
  running_jobs: number;
  failed_jobs: number;
  stopped_jobs: number;
  total_images_generated: number;
  total_images_failed: number;
  recipes_without_images: number;
  recent_jobs: any[];
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  active_job: ImageGenerationJob | null;
  recipes_without_images: number;
  s3_configured: boolean;
  gemini_configured: boolean;
}

export interface StartJobRequest {
  image_type: ImageType;
  start_from_recipe_id?: number;
}

export interface StartJobResponse {
  success: boolean;
  message: string;
  job_id?: number;
  completed?: number;
  failed?: number;
  skipped?: number;
}

export interface StopJobRequest {
  job_id: number;
}

export interface StopJobResponse {
  success: boolean;
  message: string;
  job_id: number;
}

export interface RecipesWithoutImagesResponse {
  success: boolean;
  count: number;
  next_recipe: {
    id: number;
    name: string;
  } | null;
}
