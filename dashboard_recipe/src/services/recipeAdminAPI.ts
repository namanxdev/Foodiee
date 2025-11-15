/**
 * Recipe Admin API Client
 * Handles all API calls for recipe administration
 */

import type {
  Recipe,
  RegenerationJob,
  RegenerationLog,
  RecipeStatistics,
  RecipeUpdateRequest,
  MassGenerationRequest,
  SpecificGenerationRequest,
  ValidationRequest,
  ListRecipesResponse,
  SingleRecipeResponse,
  SearchRecipesResponse,
  JobResponse,
  JobStatusResponse,
  JobLogsResponse,
  JobsListResponse,
  StatisticsResponse,
} from '../types/recipeAdmin';

import { API_CONFIG } from '@/constants';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api/admin`;

/**
 * Admin email management (stored in localStorage)
 */
export const getAdminEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminEmail');
};

export const setAdminEmail = (email: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('adminEmail', email);
};

export const clearAdminEmail = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminEmail');
};

/**
 * Get headers with admin email
 */
const getHeaders = (): HeadersInit => {
  const adminEmail = getAdminEmail();
  return {
    'Content-Type': 'application/json',
    ...(adminEmail && { 'X-Admin-Email': adminEmail }),
  };
};

/**
 * Handle API errors
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// ============================================================================
// Recipe Data Management
// ============================================================================

export const listRecipes = async (params: {
  skip?: number;
  limit?: number;
  cuisine?: string;
  validation_status?: string;
}): Promise<ListRecipesResponse> => {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.set('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params.cuisine) queryParams.set('cuisine', params.cuisine);
  if (params.validation_status) queryParams.set('validation_status', params.validation_status);

  const response = await fetch(`${API_BASE_URL}/recipes?${queryParams}`, {
    headers: getHeaders(),
  });
  return handleResponse<ListRecipesResponse>(response);
};

export const getRecipe = async (recipeId: number): Promise<SingleRecipeResponse> => {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
    headers: getHeaders(),
  });
  return handleResponse<SingleRecipeResponse>(response);
};

export const updateRecipe = async (
  recipeId: number,
  updates: RecipeUpdateRequest
): Promise<SingleRecipeResponse> => {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  return handleResponse<SingleRecipeResponse>(response);
};

export const searchRecipes = async (query: string): Promise<SearchRecipesResponse> => {
  const response = await fetch(`${API_BASE_URL}/recipes/search/${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  return handleResponse<SearchRecipesResponse>(response);
};

export const deleteRecipe = async (recipeId: number): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<{ success: boolean; message: string }>(response);
};

// ============================================================================
// Generation Endpoints
// ============================================================================

export const startMassGeneration = async (
  request: MassGenerationRequest
): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate/mass`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<JobResponse>(response);
};

export const startSpecificGeneration = async (
  request: SpecificGenerationRequest
): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate/specific`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<JobResponse>(response);
};

export const startValidation = async (request: ValidationRequest): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<JobResponse>(response);
};

// ============================================================================
// Progress Tracking
// ============================================================================

export const listJobs = async (limit: number = 20): Promise<JobsListResponse> => {
  const response = await fetch(`${API_BASE_URL}/jobs?limit=${limit}`, {
    headers: getHeaders(),
  });
  return handleResponse<JobsListResponse>(response);
};

export const getJobStatus = async (jobId: number): Promise<JobStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    headers: getHeaders(),
  });
  return handleResponse<JobStatusResponse>(response);
};

export const getJobLogs = async (jobId: number, limit: number = 100): Promise<JobLogsResponse> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/logs?limit=${limit}`, {
    headers: getHeaders(),
  });
  return handleResponse<JobLogsResponse>(response);
};

// ============================================================================
// Export & Statistics
// ============================================================================

export const exportRecipes = async (format: 'json' | 'csv'): Promise<Blob | unknown> => {
  const response = await fetch(`${API_BASE_URL}/export/recipes?format=${format}`, {
    headers: getHeaders(),
  });

  if (format === 'csv') {
    // For CSV, return blob for download
    return response.blob();
  }

  return handleResponse<unknown>(response);
};

export const getStatistics = async (): Promise<StatisticsResponse> => {
  const response = await fetch(`${API_BASE_URL}/statistics`, {
    headers: getHeaders(),
  });
  return handleResponse<StatisticsResponse>(response);
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Poll job status until completion
 */
export const pollJobStatus = async (
  jobId: number,
  onUpdate: (job: RegenerationJob) => void,
  interval: number = 2000 // 2 seconds
): Promise<RegenerationJob> => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getJobStatus(jobId);
        const job = response.job;
        onUpdate(job);

        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          resolve(job);
        } else {
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

/**
 * Download file from blob
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Get list of all jobs (with optional status filter)
 */
export const getJobs = async (
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
  limit: number = 100
): Promise<JobsListResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/jobs?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Cancel/stop a running job
 */
export const cancelJob = async (jobId: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel job: ${response.statusText}`);
  }

  return response.json();
};

// ============================================================================
// Config Management
// ============================================================================

export interface ConfigItem {
  id: number;
  config_key: string;
  config_value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface ConfigResponse {
  success: boolean;
  config?: ConfigItem;
  configs?: ConfigItem[];
  count?: number;
}

export const getConfig = async (configKey?: string): Promise<ConfigResponse> => {
  const url = configKey 
    ? `${API_BASE_URL}/config?config_key=${encodeURIComponent(configKey)}`
    : `${API_BASE_URL}/config`;
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  return handleResponse<ConfigResponse>(response);
};

export const updateConfig = async (
  configKey: string,
  configValue: unknown,
  description?: string
): Promise<ConfigResponse> => {
  const response = await fetch(`${API_BASE_URL}/config/${encodeURIComponent(configKey)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      config_value: configValue,
      description,
    }),
  });
  return handleResponse<ConfigResponse>(response);
};

export const updateUserSpecificLimit = async (
  configKey: string,
  userEmail: string,
  limit: number
): Promise<ConfigResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/config/${encodeURIComponent(configKey)}/per-user/${encodeURIComponent(userEmail)}?limit=${limit}`,
    {
      method: 'PUT',
      headers: getHeaders(),
    }
  );
  return handleResponse<ConfigResponse>(response);
};
