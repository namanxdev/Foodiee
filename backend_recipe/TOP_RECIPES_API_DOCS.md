# Top Recipes API Documentation

## Overview

The Top Recipes API provides endpoints to fetch and filter recipes from the `top_recipes_final.db` database. It supports flexible querying, sorting, pagination, and two detail levels.

**Base URL:** `/api/top-recipes`

---

## Endpoints

### 1. GET `/api/top-recipes/`

Fetch top recipes with flexible filtering, sorting, and pagination.

#### Query Parameters

| Parameter      | Type    | Required | Default            | Description                                                   |
| -------------- | ------- | -------- | ------------------ | ------------------------------------------------------------- |
| `region`       | string  | No       | -                  | Filter by cuisine region (e.g., "Indian", "Chinese")          |
| `difficulty`   | string  | No       | -                  | Filter by difficulty: "Easy", "Medium", "Hard"                |
| `meal_types`   | string  | No       | -                  | Comma-separated meal types (e.g., "Lunch,Dinner")             |
| `dietary_tags` | string  | No       | -                  | Comma-separated dietary tags (e.g., "Vegetarian,Gluten-Free") |
| `max_time`     | integer | No       | -                  | Maximum total time in minutes                                 |
| `min_rating`   | float   | No       | -                  | Minimum rating (0-5)                                          |
| `search`       | string  | No       | -                  | Search in name, description, ingredients, or steps            |
| `sort_by`      | string  | No       | `popularity_score` | Sort column (see valid columns below)                         |
| `sort_order`   | string  | No       | `DESC`             | Sort order: "ASC" or "DESC"                                   |
| `page`         | integer | No       | `1`                | Page number (1-indexed)                                       |
| `page_size`    | integer | No       | `30`               | Results per page (max 100)                                    |
| `detailed`     | boolean | No       | `true`             | Full details (true) or summary (false)                        |

**Valid `sort_by` columns:**

- `id`, `name`, `region`, `difficulty`
- `prep_time_minutes`, `cook_time_minutes`, `total_time_minutes`
- `servings`, `calories`, `rating`, `popularity_score`
- `created_at`, `updated_at`

#### Response

```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Butter Chicken (Murgh Makhani)",
      "description": "World-renowned North Indian curry...",
      "region": "Indian",
      "tastes": [
        { "name": "Spicy", "intensity": 4 },
        { "name": "Savory", "intensity": 5 }
      ],
      "meal_types": ["Lunch", "Dinner"],
      "dietary_tags": ["Non-Vegetarian", "Gluten-Free"],
      "difficulty": "Medium",
      "prep_time_minutes": 30,
      "cook_time_minutes": 45,
      "total_time_minutes": 75,
      "servings": 4,
      "calories": 450,
      "ingredients": [
        {
          "quantity": "750",
          "unit": "grams",
          "name": "Chicken",
          "preparation_note": "cut into pieces"
        }
      ],
      "steps": [
        "Marinate chicken with yogurt...",
        "Heat butter in a large pan..."
      ],
      "image_url": "https://...",
      "step_image_urls": ["https://...", "https://..."],
      "rating": 4.8,
      "popularity_score": 95.5,
      "source": "gemini",
      "created_at": "2025-10-28T08:01:59",
      "updated_at": "2025-10-28T08:01:59"
    }
  ],
  "total_count": 100,
  "page": 1,
  "page_size": 30,
  "total_pages": 4,
  "success": true
}
```

#### Examples

**Get top 10 Indian recipes:**

```
GET /api/top-recipes/?region=Indian&page_size=10
```

**Vegetarian breakfast under 30 minutes:**

```
GET /api/top-recipes/?meal_types=Breakfast&dietary_tags=Vegetarian&max_time=30
```

**Search for chicken recipes:**

```
GET /api/top-recipes/?search=chicken
```

**High-rated easy recipes, sorted by rating:**

```
GET /api/top-recipes/?difficulty=Easy&min_rating=4.5&sort_by=rating&sort_order=DESC
```

**Summary view (lightweight):**

```
GET /api/top-recipes/?detailed=false&page_size=50
```

**Multiple filters combined:**

```
GET /api/top-recipes/?region=Indian&meal_types=Dinner&dietary_tags=Vegetarian,Gluten-Free&max_time=60&min_rating=4.0&sort_by=rating
```

---

### 2. GET `/api/top-recipes/{recipe_id}`

Get detailed information for a specific recipe by ID.

#### Path Parameters

| Parameter   | Type    | Required | Description              |
| ----------- | ------- | -------- | ------------------------ |
| `recipe_id` | integer | Yes      | Unique recipe identifier |

#### Response

```json
{
  "id": 1,
  "name": "Butter Chicken (Murgh Makhani)",
  "description": "World-renowned North Indian curry...",
  "region": "Indian",
  "tastes": [
    {"name": "Spicy", "intensity": 4},
    {"name": "Savory", "intensity": 5}
  ],
  "meal_types": ["Lunch", "Dinner"],
  "dietary_tags": ["Non-Vegetarian", "Gluten-Free"],
  "difficulty": "Medium",
  "prep_time_minutes": 30,
  "cook_time_minutes": 45,
  "total_time_minutes": 75,
  "servings": 4,
  "calories": 450,
  "ingredients": [...],
  "steps": [...],
  "image_url": "https://...",
  "step_image_urls": [...],
  "rating": 4.8,
  "popularity_score": 95.5,
  "source": "gemini",
  "created_at": "2025-10-28T08:01:59",
  "updated_at": "2025-10-28T08:01:59"
}
```

#### Example

```
GET /api/top-recipes/1
```

#### Error Response

```json
{
  "detail": "Recipe with ID 999 not found"
}
```

Status Code: `404 Not Found`

---

### 3. GET `/api/top-recipes/filters/available`

Get all available filter options from the database.

Useful for populating filter dropdowns in the frontend.

#### Response

```json
{
  "regions": [
    "Chinese",
    "Indian",
    "Italian",
    "Japanese",
    "Korean",
    "Mediterranean",
    "Mexican",
    "Thai"
  ],
  "difficulties": ["Easy", "Hard", "Medium"],
  "meal_types": ["Breakfast", "Dessert", "Dinner", "Lunch", "Snack"],
  "dietary_tags": [
    "Gluten-Free",
    "High-Protein",
    "Non-Vegetarian",
    "Vegan",
    "Vegetarian"
  ],
  "success": true
}
```

#### Example

```
GET /api/top-recipes/filters/available
```

---

### 4. GET `/api/top-recipes/stats/summary`

Get database statistics summary.

#### Response

```json
{
  "success": true,
  "total_recipes": 80,
  "recipes_by_region": {
    "Indian": 31,
    "Chinese": 31,
    "Italian": 18
  },
  "average_rating": 4.65,
  "average_time_minutes": 67.5,
  "top_rated_recipes": [
    { "name": "Butter Chicken (Murgh Makhani)", "rating": 4.8 },
    { "name": "Masala Dosa", "rating": 4.7 },
    { "name": "Chole Bhature", "rating": 4.7 }
  ]
}
```

#### Example

```
GET /api/top-recipes/stats/summary
```

---

## Data Models

### TopRecipeModel (Detailed)

Complete recipe with all fields.

```typescript
interface TopRecipeModel {
  id: number
  name: string
  description?: string
  region?: string
  tastes: TasteDetail[]
  meal_types: string[]
  dietary_tags: string[]
  difficulty?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  total_time_minutes?: number
  servings?: number
  calories?: number
  ingredients: IngredientDetail[]
  steps: string[]
  image_url?: string
  step_image_urls: string[]
  rating: number
  popularity_score: number
  source: string
  created_at?: string
  updated_at?: string
}

interface TasteDetail {
  name: string
  intensity: number // 1-5
}

interface IngredientDetail {
  quantity: string
  unit: string
  name: string
  preparation_note: string
}
```

### TopRecipeSummaryModel (Lightweight)

Summary view for list displays.

```typescript
interface TopRecipeSummaryModel {
  id: number
  name: string
  description?: string
  region?: string
  difficulty?: string
  total_time_minutes?: number
  servings?: number
  calories?: number
  image_url?: string
  rating: number
  popularity_score: number
  meal_types: string[]
  dietary_tags: string[]
}
```

---

## Usage Examples

### Frontend (React/TypeScript)

```typescript
// Get top 10 Indian vegetarian recipes
const fetchIndianVegetarianRecipes = async () => {
  const response = await fetch(
    '/api/top-recipes/?region=Indian&dietary_tags=Vegetarian&page_size=10'
  )
  const data = await response.json()
  return data.recipes
}

// Search recipes with pagination
const searchRecipes = async (query: string, page: number = 1) => {
  const response = await fetch(
    `/api/top-recipes/?search=${encodeURIComponent(
      query
    )}&page=${page}&page_size=20`
  )
  return await response.json()
}

// Get recipe details
const getRecipeDetails = async (recipeId: number) => {
  const response = await fetch(`/api/top-recipes/${recipeId}`)
  return await response.json()
}

// Get available filters for dropdowns
const getFilterOptions = async () => {
  const response = await fetch('/api/top-recipes/filters/available')
  const data = await response.json()

  // Use for select dropdowns
  console.log(data.regions) // ["Indian", "Chinese", ...]
  console.log(data.difficulties) // ["Easy", "Medium", "Hard"]
}

// Advanced filtering
const getFilteredRecipes = async (filters: {
  region?: string
  difficulty?: string
  mealTypes?: string[]
  dietaryTags?: string[]
  maxTime?: number
  minRating?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  page?: number
}) => {
  const params = new URLSearchParams()

  if (filters.region) params.append('region', filters.region)
  if (filters.difficulty) params.append('difficulty', filters.difficulty)
  if (filters.mealTypes)
    params.append('meal_types', filters.mealTypes.join(','))
  if (filters.dietaryTags)
    params.append('dietary_tags', filters.dietaryTags.join(','))
  if (filters.maxTime) params.append('max_time', filters.maxTime.toString())
  if (filters.minRating)
    params.append('min_rating', filters.minRating.toString())
  if (filters.sortBy) params.append('sort_by', filters.sortBy)
  if (filters.sortOrder) params.append('sort_order', filters.sortOrder)
  if (filters.page) params.append('page', filters.page.toString())

  const response = await fetch(`/api/top-recipes/?${params.toString()}`)
  return await response.json()
}
```

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/api/top-recipes"

# Get top recipes
response = requests.get(f"{BASE_URL}/", params={
    "region": "Indian",
    "page_size": 10
})
data = response.json()
print(f"Total recipes: {data['total_count']}")

# Search recipes
response = requests.get(f"{BASE_URL}/", params={
    "search": "chicken",
    "min_rating": 4.5
})

# Get recipe by ID
recipe = requests.get(f"{BASE_URL}/1").json()
print(f"Recipe: {recipe['name']}")

# Get filters
filters = requests.get(f"{BASE_URL}/filters/available").json()
print(f"Available regions: {filters['regions']}")
```

---

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

### Common Error Codes

| Status Code | Description              |
| ----------- | ------------------------ |
| `404`       | Recipe not found         |
| `422`       | Invalid query parameters |
| `500`       | Server error             |

---

## Performance Tips

1. **Use summary view for lists:**

   ```
   GET /api/top-recipes/?detailed=false&page_size=50
   ```

   This is ~5x faster than detailed view.

2. **Pagination:**
   Always use `page` and `page_size` to limit results.

3. **Specific filters:**
   More specific filters = faster queries.

4. **Indexed columns:**
   Sorting by `rating`, `popularity_score`, `region`, or `difficulty` is optimized.

---

## Architecture

```
Frontend Request
      ↓
FastAPI Router (api/top_recipes.py)
      ↓
Service Layer (core/top_recipes_service.py)
      ↓
SQLite Database (data/top_recipes_final.db)
      ↓
Response (Pydantic Models)
```

**Files:**

- `api/top_recipes.py` - API routes
- `core/top_recipes_service.py` - Database operations
- `models/schemas.py` - Pydantic models
- `data/top_recipes_final.db` - SQLite database

---

## Testing

### Manual Testing

```bash
# Start server
cd backend_recipe
python main.py

# Test endpoints
curl "http://localhost:8000/api/top-recipes/"
curl "http://localhost:8000/api/top-recipes/1"
curl "http://localhost:8000/api/top-recipes/filters/available"
curl "http://localhost:8000/api/top-recipes/stats/summary"
```

### Interactive Documentation

Visit: `http://localhost:8000/docs`

FastAPI automatically generates interactive API documentation.

---

## Version

**API Version:** 1.0  
**Created:** October 28, 2025  
**Last Updated:** October 28, 2025
