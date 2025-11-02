/**
 * Formatting Utilities
 * ====================
 * Functions for formatting data for display
 */

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number with commas (e.g., 1000 -> "1,000")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format rating with star display
 */
export function formatRating(rating: number): string {
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  return `${stars} (${rating.toFixed(1)})`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================================================
// String Formatting
// ============================================================================

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert to title case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitleCase(str: string): string {
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Create slug from string (for URLs)
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// Array Formatting
// ============================================================================

/**
 * Join array with commas and "and" before last item
 */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(', ')}, and ${lastItem}`;
}

/**
 * Format list with bullet points
 */
export function formatBulletList(items: string[]): string {
  return items.map(item => `• ${item}`).join('\n');
}

/**
 * Format numbered list
 */
export function formatNumberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

// ============================================================================
// Ingredient Formatting
// ============================================================================

/**
 * Parse ingredient string to structured format
 */
export interface ParsedIngredient {
  quantity?: string;
  unit?: string;
  name: string;
  preparation?: string;
}

export function parseIngredient(ingredient: string): ParsedIngredient {
  // Basic parsing - can be enhanced
  const parts = ingredient.trim().split(',');
  const main = parts[0].trim();
  const preparation = parts.length > 1 ? parts.slice(1).join(',').trim() : undefined;
  
  return {
    name: main,
    preparation,
  };
}

/**
 * Format ingredient for display
 */
export function formatIngredient(ingredient: ParsedIngredient): string {
  let result = '';
  
  if (ingredient.quantity) {
    result += ingredient.quantity;
  }
  
  if (ingredient.unit) {
    result += ` ${ingredient.unit}`;
  }
  
  result += ` ${ingredient.name}`;
  
  if (ingredient.preparation) {
    result += `, ${ingredient.preparation}`;
  }
  
  return result.trim();
}

// ============================================================================
// Recipe Formatting
// ============================================================================

/**
 * Format cooking steps with proper numbering
 */
export function formatCookingSteps(steps: string[]): string[] {
  return steps.map((step, index) => {
    const stepText = step.trim();
    // Remove existing numbering if present
    const cleanStep = stepText.replace(/^\d+\.\s*/, '');
    return `Step ${index + 1}: ${cleanStep}`;
  });
}

/**
 * Format recipe metadata (time, difficulty, servings)
 */
export function formatRecipeMetadata(metadata: {
  time?: string | number;
  difficulty?: string;
  servings?: number;
}): string[] {
  const parts: string[] = [];
  
  if (metadata.time) {
    const timeStr = typeof metadata.time === 'number' 
      ? `${metadata.time} minutes` 
      : metadata.time;
    parts.push(`⏱️ ${timeStr}`);
  }
  
  if (metadata.difficulty) {
    parts.push(`📊 ${metadata.difficulty}`);
  }
  
  if (metadata.servings) {
    parts.push(`🍽️ ${metadata.servings} servings`);
  }
  
  return parts;
}

// ============================================================================
// Markdown Formatting
// ============================================================================

/**
 * Convert plain text to markdown
 */
export function textToMarkdown(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
}

/**
 * Strip markdown formatting
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/[#*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .trim();
}

// ============================================================================
// Badge Formatting
// ============================================================================

/**
 * Get badge color based on difficulty
 */
export function getDifficultyColor(difficulty: string): string {
  const difficultyLower = difficulty.toLowerCase();
  
  if (difficultyLower.includes('easy') || difficultyLower.includes('beginner')) {
    return 'green';
  }
  if (difficultyLower.includes('medium') || difficultyLower.includes('intermediate')) {
    return 'yellow';
  }
  if (difficultyLower.includes('hard') || difficultyLower.includes('advanced')) {
    return 'red';
  }
  
  return 'gray';
}

/**
 * Get badge color based on spice level
 */
export function getSpiceColor(spiceLevel: string): string {
  const spiceLower = spiceLevel.toLowerCase();
  
  if (spiceLower.includes('mild')) return 'green';
  if (spiceLower.includes('medium')) return 'yellow';
  if (spiceLower.includes('hot')) return 'orange';
  if (spiceLower.includes('extra')) return 'red';
  
  return 'gray';
}

// ============================================================================
// Date/Time Formatting
// ============================================================================

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateObj);
}
