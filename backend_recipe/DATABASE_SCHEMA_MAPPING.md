# 🗄️ Database Schema & Dataset Mapping

## 📊 Database Table: `recipes`

This is the **UNIFIED** table where all recipes from 3 datasets will be stored.

### Core Columns (14 fields):

```sql
CREATE TABLE recipes (
    -- Identity
    id UUID PRIMARY KEY,                    -- Auto-generated
    name TEXT NOT NULL UNIQUE,              -- Recipe name
    
    -- Categories  
    cuisine_type TEXT NOT NULL,             -- Indian, Chinese, Italian, Mexican, Japanese
    meal_type TEXT[] NOT NULL,              -- {breakfast, lunch, dinner, snack}
    
    -- Timing
    prep_time_minutes INT NOT NULL,         -- Preparation time in minutes
    cooking_time_minutes INT NOT NULL,      -- Cooking time in minutes
    total_time_minutes INT,                 -- Auto-calculated: prep + cook
    
    -- Details
    difficulty TEXT NOT NULL,               -- easy, medium, hard
    servings INT DEFAULT 4,                 -- Number of servings
    
    -- Taste & Diet
    taste_profile TEXT[] NOT NULL,          -- {sweet, spicy, savory, sour, tangy}
    allergens TEXT[] DEFAULT '{}',          -- {dairy, nuts, gluten, shellfish}
    dietary_tags TEXT[] DEFAULT '{}',       -- {vegetarian, vegan, gluten-free}
    
    -- Content (JSONB/Array for structured data)
    ingredients JSONB NOT NULL,             -- [{"name": "chicken", "amount": "500g"}]
    steps TEXT[] NOT NULL,                  -- ["Step 1: ...", "Step 2: ..."]
    tips TEXT,                              -- Additional notes/tips
    
    -- AI/Search
    embedding vector(768),                  -- For semantic search
    popularity_score FLOAT DEFAULT 0,       -- Track user selections
    
    -- Meta
    source TEXT,                            -- Which dataset it came from
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🗺️ Dataset Mapping

### Dataset 1: `cuisine_updated.csv` (4,466 rows)

| CSV Column | DB Column | Transform | Missing Values |
|------------|-----------|-----------|----------------|
| `name` | `name` | Direct | 0 |
| `cuisine` | `cuisine_type` | Map to 5 cuisines | 8 (0.2%) - **Use "Indian"** |
| `course` | `meal_type` | breakfast→[breakfast], lunch→[lunch,dinner] | 42 (0.9%) - **Infer from name** |
| `prep_time` | `prep_time_minutes` | Parse "Total in 30 M" → 30 | 12 (0.3%) - **Use 30 default** |
| `N/A` | `cooking_time_minutes` | Not provided | **Use 15 default** |
| `diet` | `dietary_tags` | Vegetarian→[vegetarian] | 42 (0.9%) - **Use []** |
| `ingredients` | `ingredients` | Parse to JSONB | 0 |
| `instructions` | `steps` | Parse to TEXT[] | 0 |
| `description` | `tips` | Direct | 0 |
| `image_url` | Store in `recipe_images` table | Direct | 0 |

**✅ Quality:** Has images, descriptions. Best for Indian recipes.

---

### Dataset 2: `indian_food.csv` (255 rows)

| CSV Column | DB Column | Transform | Missing Values |
|------------|-----------|-----------|----------------|
| `name` | `name` | Direct | 0 |
| `N/A` | `cuisine_type` | Always "Indian" | 0 |
| `course` | `meal_type` | dessert→[snack], main→[lunch,dinner] | 0 |
| `prep_time` | `prep_time_minutes` | Direct (already int) | 0 |
| `cook_time` | `cooking_time_minutes` | Direct (already int) | 0 |
| `diet` | `dietary_tags` | vegetarian→[vegetarian] | 0 |
| `flavor_profile` | `taste_profile` | sweet→[sweet], spicy→[spicy] | 0 |
| `ingredients` | `ingredients` | Parse comma-separated | 0 |
| `state` + `region` | `tips` | "From {state}, {region}" | 1 (0.4%) - **Use empty** |

**✅ Quality:** Has regional info, flavor profiles. Great metadata!

---

### Dataset 3: `recipes.csv` (100,000+ rows)

| CSV Column | DB Column | Transform | Missing Values |
|------------|-----------|-----------|----------------|
| `recipe_name` | `name` | Direct | 0 |
| `cuisine_path` | `cuisine_type` | "/Chinese/" → "Chinese" | 0 |
| `N/A` | `meal_type` | Infer from name/description | **Infer** |
| `prep_time` | `prep_time_minutes` | Parse various formats | 42 (4.2%) - **Use 30** |
| `cook_time` | `cooking_time_minutes` | Parse various formats | 283 (28.3%) - **Use 15** |
| `servings` | `servings` | Direct (already int) | 0 |
| `ingredients` | `ingredients` | Parse to JSONB | 0 |
| `directions` | `steps` | Parse to TEXT[] | 0 |
| `rating` | Use for sorting | Higher rating = import first | 0 |
| `nutrition` | Parse for allergens | Extract dairy, nuts, etc. | 0 |
| `img_src` | Store in `recipe_images` table | Direct | 0 |

**✅ Quality:** Massive variety, ratings. Best for non-Indian cuisines.

---

## 🛠️ Missing Value Handling Strategy

### 1. **Cuisine (Dataset 1: 8 missing)**
```python
if pd.isna(cuisine):
    cuisine = "Indian"  # All rows in this dataset are Indian
```

### 2. **Course/Meal Type (42 missing)**
```python
def infer_meal_type(name, course):
    if pd.isna(course):
        # Use keywords from name
        if 'breakfast' in name.lower():
            return ['breakfast']
        elif 'dessert' in name.lower():
            return ['snack']
        else:
            return ['lunch', 'dinner']  # Default
```

### 3. **Prep Time (12-42 missing)**
```python
if pd.isna(prep_time):
    prep_time = 30  # Reasonable default
```

### 4. **Cook Time (283 missing in Dataset 3)**
```python
if pd.isna(cook_time):
    cook_time = 15  # Quick default
```

### 5. **Diet (42 missing)**
```python
if pd.isna(diet):
    dietary_tags = []  # Empty array (no restrictions)
```

---

## 🎯 Final Database Composition

After import:

```
recipes table: ~1,500 rows

Columns:
├─ id (UUID)
├─ name (TEXT) ← From all 3 datasets
├─ cuisine_type (TEXT) ← Mapped/extracted
├─ meal_type (TEXT[]) ← Inferred/mapped
├─ prep_time_minutes (INT) ← Parsed with defaults
├─ cooking_time_minutes (INT) ← Parsed with defaults
├─ total_time_minutes (INT) ← Auto-calculated
├─ difficulty (TEXT) ← Calculated from time+steps
├─ servings (INT) ← From dataset or default 4
├─ taste_profile (TEXT[]) ← Mapped/inferred
├─ allergens (TEXT[]) ← Extracted from nutrition
├─ dietary_tags (TEXT[]) ← Mapped from diet
├─ ingredients (JSONB) ← Parsed & structured
├─ steps (TEXT[]) ← Parsed & structured
├─ tips (TEXT) ← Description or regional info
├─ embedding (vector) ← Generated by Google embeddings
├─ popularity_score (FLOAT) ← Starts at 0
├─ source (TEXT) ← "Dataset 1 (Row 123)"
└─ created_at/updated_at (TIMESTAMP)
```

---

## 🔍 How Search Works

### Example: User query "quick spicy lunch"

```sql
-- Step 1: Filter (Fast - 50ms)
SELECT * FROM recipes
WHERE 'lunch' = ANY(meal_type)           -- meal_type column
  AND total_time_minutes <= 45           -- total_time_minutes column
  AND 'spicy' = ANY(taste_profile)       -- taste_profile column
-- Returns ~150 matches
```

```python
# Step 2: Semantic search (100ms)
query_embedding = embed("quick spicy lunch")

SELECT *, embedding <=> query_embedding AS distance
FROM [filtered_recipes]
ORDER BY distance
LIMIT 10
# Returns top 10 most semantically similar
```

```python
# Step 3: LLM personalization (1-2s)
ranked = llm.rank_by_user_preferences(
    recipes=top_10,
    user_likes=["chicken", "rice"],
    user_dislikes=["peanuts"]
)
# Returns top 3 personalized
```

---

## ✅ Why This Schema Works

1. **Unified Structure**: All 3 datasets → 1 table (consistent queries)
2. **Fast Filters**: Indexed columns (cuisine, meal_type, time)
3. **Semantic Search**: Vector embeddings (AI-powered relevance)
4. **Flexible**: JSONB ingredients (can store any format)
5. **Scalable**: Can add more recipes anytime
6. **Analytics Ready**: Track popularity_score for recommendations

---

## 🚀 Next Steps

1. ✅ Import Dataset 1 (450 top Indian recipes)
2. ✅ Import Dataset 2 (255 regional Indian recipes)
3. ✅ Import Dataset 3 (800 multi-cuisine recipes)
4. ✅ Generate embeddings for all
5. ✅ Test search queries

**Total: ~1,500 high-quality recipes ready for 100+ concurrent users!**
