# Top Recipes Final Database

**Single-Table Denormalized Design for Foodiee Recipe Management**

---

## 📁 Files Overview

| File                              | Description                         |
| --------------------------------- | ----------------------------------- |
| `top_recipes_final.db`            | SQLite database file (single table) |
| `top_recipes_final_schema.sql`    | Schema definition with comments     |
| `final_db_helpers.py`             | Python helper functions             |
| `FINAL_DATABASE_DOCUMENTATION.md` | **Complete documentation**          |

---

## 🎯 Quick Start

### 1. Database Location

```
/Users/chetanr/internship/Foodiee/backend_recipe/data/top_recipes_final.db
```

### 2. Table Structure

Single table: `top_recipes` with 20 columns

**Key Features:**

- ✅ All data in one table (no joins needed)
- ✅ Special `<STEP_DELIMITER>` handles commas in step text
- ✅ Steps and step_image_urls must have equal length
- ✅ Empty images supported initially

---

## 🔑 Critical Fields

### Steps Field

```sql
-- Format: step1<STEP_DELIMITER>step2<STEP_DELIMITER>step3
steps = 'Mix flour, sugar, and salt<STEP_DELIMITER>Add eggs, milk<STEP_DELIMITER>Bake for 30 minutes'
```

**Why special delimiter?**

- Regular comma delimiter breaks: `"Mix flour, sugar, salt"` → splits incorrectly
- `<STEP_DELIMITER>` preserves commas in text

### Step Image URLs Field

```sql
-- Must match steps count!
-- Format: url1<STEP_DELIMITER>url2<STEP_DELIMITER>url3
step_image_urls = 'https://cdn.com/step1.jpg<STEP_DELIMITER><STEP_DELIMITER>https://cdn.com/step3.jpg'
```

**Rules:**

1. Length must equal steps length
2. Empty strings allowed (steps without images)
3. Can be empty initially: `steps = ''` AND `step_image_urls = ''`

---

## 📊 Data Formats

### Tastes

```
Format: taste_name:intensity|taste_name:intensity
Example: "Spicy:4|Savory:5|Rich:3"
Intensity: 1-5
```

### Meal Types

```
Format: type|type|type
Example: "Lunch|Dinner"
```

### Dietary Tags

```
Format: tag|tag|tag
Example: "Vegetarian|Gluten-Free|High-Protein"
```

### Ingredients

```
Format: Multi-line with pipes
quantity|unit|ingredient_name|preparation_note

Example:
750|grams|Chicken|cut into pieces
2|tablespoons|Garam Masala|
4|medium|Tomatoes|pureed
```

---

## 💻 Usage Examples

### Python (Using Helpers)

```python
from final_db_helpers import Recipe, insert_recipe, get_recipe_by_id, print_recipe

# Create recipe
recipe = Recipe(
    id=None,
    name="Butter Chicken",
    description="World-renowned North Indian curry...",
    region="Indian",
    tastes=[('Spicy', 4), ('Savory', 5)],
    meal_types=['Lunch', 'Dinner'],
    dietary_tags=['Non-Vegetarian', 'Gluten-Free'],
    difficulty='Medium',
    prep_time_minutes=30,
    cook_time_minutes=45,
    total_time_minutes=75,
    servings=4,
    calories=450,
    ingredients=[
        {'quantity': '750', 'unit': 'grams', 'name': 'Chicken', 'preparation_note': 'cut into pieces'},
        {'quantity': '2', 'unit': 'tablespoons', 'name': 'Garam Masala', 'preparation_note': ''}
    ],
    steps=[
        'Marinate chicken for 30 minutes',
        'Heat butter, sauté onions',
        'Add tomato puree, cook until oil separates'
    ],
    image_url='',
    step_image_urls=['', '', ''],  # Empty initially
    rating=4.8,
    popularity_score=95.5,
    source='gemini'
)

# Insert
recipe_id = insert_recipe(recipe)
print(f"Recipe ID: {recipe_id}")

# Retrieve
retrieved = get_recipe_by_id(recipe_id)
print_recipe(retrieved)
```

### SQL (Direct)

```sql
-- Insert recipe
INSERT INTO top_recipes (
    name, region, difficulty, steps, image_url, step_image_urls
) VALUES (
    'Paneer Tikka',
    'Indian',
    'Easy',
    'Cut paneer<STEP_DELIMITER>Marinate 2 hours<STEP_DELIMITER>Grill until golden',
    '',
    ''
);

-- Query by region
SELECT id, name, rating, difficulty
FROM top_recipes
WHERE region = 'Indian'
ORDER BY rating DESC
LIMIT 10;

-- Search vegetarian recipes
SELECT name, dietary_tags, rating
FROM top_recipes
WHERE dietary_tags LIKE '%Vegetarian%'
  AND total_time_minutes <= 45
ORDER BY rating DESC;
```

---

## ✅ Validation Rules

### Before Insert/Update

```python
# 1. Steps and images length must match
assert len(steps) == len(step_image_urls)

# 2. Difficulty must be valid
assert difficulty in ['Easy', 'Medium', 'Hard']

# 3. Rating must be in range
assert 0 <= rating <= 5

# 4. Taste intensity must be 1-5
for taste, intensity in tastes:
    assert 1 <= intensity <= 5
```

---

## 📈 Database Statistics

Current state:

```sql
sqlite> SELECT COUNT(*) FROM top_recipes;
2

sqlite> SELECT region, COUNT(*) as count FROM top_recipes GROUP BY region;
Indian|2
```

---

## 🔍 Indexes

All queries are optimized with 8 indexes:

- `idx_top_recipes_name` - Fast name search
- `idx_top_recipes_region` - Filter by cuisine
- `idx_top_recipes_difficulty` - Filter by difficulty
- `idx_top_recipes_prep_time` - Sort by prep time
- `idx_top_recipes_total_time` - Sort by total time
- `idx_top_recipes_popularity` - Sort by popularity (DESC)
- `idx_top_recipes_rating` - Sort by rating (DESC)
- `idx_top_recipes_source` - Filter by data source

---

## 🆚 Comparison with Normalized DB

| Feature     | Normalized (top_recipes.db) | Denormalized (top_recipes_final.db) |
| ----------- | --------------------------- | ----------------------------------- |
| Tables      | 14 tables                   | **1 table**                         |
| Joins       | 5-8 joins                   | **0 joins**                         |
| Query Speed | Slower                      | **⚡ Faster**                       |
| Complexity  | Higher                      | **Lower**                           |
| Data Export | Complex                     | **Simple**                          |
| Validation  | FK enforced                 | **Manual**                          |

---

## 📚 Documentation

**Read the complete documentation:**

```
FINAL_DATABASE_DOCUMENTATION.md
```

Covers:

- Complete field specifications
- Data format details
- Serialization/deserialization
- Best practices
- Migration guide from normalized DB
- 50+ usage examples

---

## 🎨 Design Highlights

### Why Denormalized?

**Problem with Normalized:**

```sql
-- Requires 6 JOINs to get complete recipe
SELECT r.*, i.name, mt.name, dt.name
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN ingredients i ON ri.ingredient_id = i.id
JOIN recipe_meal_types rmt ON r.id = rmt.recipe_id
JOIN meal_types mt ON rmt.meal_type_id = mt.id
JOIN recipe_dietary_tags rdt ON r.id = rdt.recipe_id
JOIN dietary_tags dt ON rdt.dietary_tag_id = dt.id
WHERE r.id = 1;
```

**Solution with Denormalized:**

```sql
-- Single query, no joins
SELECT * FROM top_recipes WHERE id = 1;
```

### When to Use This Design

✅ **Perfect for:**

- API backends (fast responses)
- Mobile apps (local storage)
- Data exports (CSV/JSON)
- Read-heavy workloads
- AI-generated content

❌ **Not ideal for:**

- Complex relational queries
- Heavy write workloads
- Multi-user transactions

---

## 🚀 Next Steps

1. **Generate Recipes**: Use AI to populate database
2. **Generate Images**: Create step-by-step images with Gemini
3. **Upload to Cloudinary**: Store images in CDN
4. **Update URLs**: Fill `image_url` and `step_image_urls` fields
5. **Build API**: Create FastAPI endpoints
6. **Frontend Integration**: Display recipes in dashboard

---

## 🛠️ Helper Functions Available

```python
# Validation
validate_step_images_length(steps, step_image_urls)
validate_difficulty(difficulty)
validate_rating(rating)
validate_taste_intensity(intensity)

# Serialization (Python → Database)
serialize_tastes(tastes_list)
serialize_list(items)
serialize_ingredients(ingredients_list)
serialize_steps(steps_list)
serialize_step_images(image_urls)

# Deserialization (Database → Python)
deserialize_tastes(tastes_str)
deserialize_list(list_str)
deserialize_ingredients(ingredients_str)
deserialize_steps(steps_str)
deserialize_step_images(step_image_urls_str)

# Database Operations
insert_recipe(recipe)
get_recipe_by_id(recipe_id)
update_step_images(recipe_id, step_image_urls)
print_recipe(recipe)
```

---

## 📝 Example Output

```
================================================================================
📖 Paneer Tikka
================================================================================

Paneer Tikka is a popular Indian appetizer made with marinated paneer cubes
grilled to perfection.

📍 Region: Indian
⭐ Rating: 4.5/5.0
🔥 Difficulty: Easy
⏱️  Time: 135 minutes (Prep: 120, Cook: 15)
🍽️  Servings: 4
📊 Calories: 280 per serving

👅 Tastes:
   • Spicy: ⭐⭐⭐ (3/5)
   • Savory: ⭐⭐⭐⭐ (4/5)

🍴 Meal Types: Snack, Dinner
🏷️  Dietary: Vegetarian, Gluten-Free

🛒 Ingredients (7):
   • 400 grams Paneer (cut into cubes)
   • 1 cup Yogurt (thick)
   ...

📋 Cooking Steps (6):
   Step 1: Cut paneer into 1-inch cubes
   📷 https://cdn.example.com/step1.jpg

   Step 2: Marinate with yogurt and spices
   📷 https://cdn.example.com/step2.jpg
   ...
```

---

**Version:** 1.0  
**Created:** October 28, 2025  
**Author:** AI Assistant
