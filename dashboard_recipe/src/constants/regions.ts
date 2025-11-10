/**
 * Centralized Constants - Regions
 * ================================
 * Available cuisine regions/types for recipes
 * Shared across the application
 */

export const REGIONS = [
  "Indian",
  "Chinese",
  "Italian",
  "Mexican",
  "Japanese",
  "Mediterranean",
  "Thai",
  "Korean"
] as const;

export type Region = typeof REGIONS[number];

