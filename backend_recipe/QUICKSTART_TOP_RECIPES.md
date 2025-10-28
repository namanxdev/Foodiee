# Quick Start: Top Recipes API

## 🚀 Get Started in 3 Minutes

### 1. Start the Server

```bash
cd /Users/chetanr/internship/Foodiee/backend_recipe
python main.py
```

You should see:
```
✅ API is ready!
```

---

### 2. Test Endpoints

#### Option A: Interactive Docs (Recommended)

Open in browser: **http://localhost:8000/docs**

Try the endpoints directly in Swagger UI!

#### Option B: Command Line

```bash
# Get all recipes
curl "http://localhost:8000/api/top-recipes/"

# Get Indian recipes
curl "http://localhost:8000/api/top-recipes/?region=Indian"

# Search for chicken
curl "http://localhost:8000/api/top-recipes/?search=chicken"

# Get recipe by ID
curl "http://localhost:8000/api/top-recipes/1"

# Get available filters
curl "http://localhost:8000/api/top-recipes/filters/available"

# Get stats
curl "http://localhost:8000/api/top-recipes/stats/summary"
```

#### Option C: Run Test Suite

```bash
cd /Users/chetanr/internship/Foodiee/backend_recipe
python test_top_recipes_api.py
```

---

### 3. Use in Frontend

```typescript
// React example
const TopRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  
  useEffect(() => {
    fetch('/api/top-recipes/?region=Indian&page_size=10')
      .then(r => r.json())
      .then(data => setRecipes(data.recipes));
  }, []);
  
  return (
    <div>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};
```

---

## 📚 Documentation

- **Full API Docs:** `TOP_RECIPES_API_DOCS.md`
- **Implementation Details:** `TOP_RECIPES_IMPLEMENTATION.md`
- **Database Docs:** `FINAL_DATABASE_DOCUMENTATION.md`

---

## 🎯 Common Queries

```bash
# Top 10 Indian recipes
/api/top-recipes/?region=Indian&page_size=10

# Vegetarian breakfast under 30 min
/api/top-recipes/?meal_types=Breakfast&dietary_tags=Vegetarian&max_time=30

# High-rated easy recipes
/api/top-recipes/?difficulty=Easy&min_rating=4.5&sort_by=rating

# Search recipes
/api/top-recipes/?search=paneer

# Get filters for dropdowns
/api/top-recipes/filters/available

# Summary view (faster)
/api/top-recipes/?detailed=false&page_size=50
```

---

## ✅ Checklist

- [ ] Server running (`python main.py`)
- [ ] Test endpoint works (`curl http://localhost:8000/api/top-recipes/`)
- [ ] Interactive docs open (`http://localhost:8000/docs`)
- [ ] Test suite passes (`python test_top_recipes_api.py`)
- [ ] Frontend integrated

---

## 🆘 Troubleshooting

**Problem:** Database not found

**Solution:** Check database path in `core/top_recipes_service.py`:
```python
DB_PATH = 'data/top_recipes_final.db'  # Relative to backend_recipe/
```

**Problem:** No recipes returned

**Solution:** Check database has data:
```bash
sqlite3 data/top_recipes_final.db "SELECT COUNT(*) FROM top_recipes;"
```

**Problem:** Import errors

**Solution:** Run from `backend_recipe` directory

---

That's it! You're ready to use the Top Recipes API! 🎉
