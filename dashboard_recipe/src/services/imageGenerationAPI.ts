/**
 * Image Generation API Client
 * ============================
 * API client for interacting with image generation admin endpoints
 */

import {
  HealthCheckResponse,
  JobStatusResponse,
  JobLogsResponse,
  JobStatistics,
  StartJobRequest,
  StartJobResponse,
  StopJobRequest,
  StopJobResponse,
  RecipesWithoutImagesResponse,
} from '@/types/imageGeneration';
import { API_CONFIG } from '@/constants';

const API_BASE = API_CONFIG.BASE_URL;

/**
 * Get admin email from environment or localStorage
 */
function getAdminEmail(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminEmail') || '';
  }
  return '';
}

/**
 * Fetch with authentication headers
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const adminEmail = getAdminEmail();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Email': adminEmail,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Image Generation API
 */
export const imageGenerationAPI = {
  /**
   * Health check - verify system status
   */
  health: (): Promise<HealthCheckResponse> => 
    fetchWithAuth('/api/admin/image-generation/health'),

  /**
   * Start a new image generation job
   */
  startJob: (data: StartJobRequest): Promise<StartJobResponse> =>
    fetchWithAuth('/api/admin/image-generation/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Stop a running job gracefully
   */
  stopJob: (data: StopJobRequest): Promise<StopJobResponse> =>
    fetchWithAuth('/api/admin/image-generation/stop', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get job status (current or specific job)
   */
  getStatus: (jobId?: number): Promise<JobStatusResponse> => {
    const url = jobId
      ? `/api/admin/image-generation/status?job_id=${jobId}`
      : '/api/admin/image-generation/status';
    return fetchWithAuth(url);
  },

  /**
   * Get logs for a job
   */
  getLogs: (params: {
    job_id?: number;
    limit?: number;
    level?: string;
  } = {}): Promise<JobLogsResponse> => {
    const searchParams = new URLSearchParams();
    if (params.job_id !== undefined) searchParams.set('job_id', params.job_id.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.level) searchParams.set('level', params.level);
    
    const queryString = searchParams.toString();
    const url = queryString 
      ? `/api/admin/image-generation/logs?${queryString}`
      : '/api/admin/image-generation/logs';
    
    return fetchWithAuth(url);
  },

  /**
   * Get overall statistics
   */
  getStatistics: (): Promise<JobStatistics> =>
    fetchWithAuth('/api/admin/image-generation/statistics'),

  /**
   * Get count of recipes without images
   */
  getRecipesWithoutImages: (): Promise<RecipesWithoutImagesResponse> =>
    fetchWithAuth('/api/admin/image-generation/recipes-without-images'),
};

/**
 * Set admin email for API authentication
 */
export function setAdminEmail(email: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminEmail', email);
  }
}

/**
 * Clear admin email
 */
export function clearAdminEmail() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminEmail');
  }
}

/**
 * Check if admin email is set
 */
export function hasAdminEmail(): boolean {
  return !!getAdminEmail();
}
