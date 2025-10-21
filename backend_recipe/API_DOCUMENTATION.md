# Recipe Recommender API Documentation

## Overview
FastAPI backend for AI-powered recipe recommendation system with RAG (Retrieval-Augmented Generation) and GPU-accelerated image generation.

## Base URL
```
http://localhost:8000
```

## Features
- ✅ Recipe recommendations based on user preferences
- ✅ RAG-powered search using recipe PDFs
- ✅ Step-by-step cooking instructions
- ✅ GPU-accelerated image generation (Stable Diffusion)
- ✅ Ingredient alternatives suggestions
- ✅ Session management

---

## API Endpoints

### 1. Health Check
**GET** `/`

Check API status and capabilities.

**Response:**
```json
{
  "message": "Recipe Recommender API is running!",
  "version": "1.0.0",
  "rag_enabled": true,
  "image_generation": "gpu"
}
```

---

### 2. Submit User Preferences
**POST** `/api/preferences`

Submit user preferences and get 3 recipe recommendations.

**Request Body:**
```json
{
  "region": "Indian",
  "taste_preferences": ["spicy", "savory"],
  "meal_type": "lunch",
  "time_available": "30 mins",
  "allergies": ["peanuts"],
  "dislikes": ["mushrooms"],
  "available_ingredients": ["chicken", "rice", "tomatoes", "onions", "spices"]
}
```

**Response:**
```json
{
  "recommendations": "1. Chicken Biryani\n   Description: Aromatic rice dish...\n   Ingredients: chicken, rice, spices...\n   Time: 30 minutes\n   Match: Spicy Indian lunch...\n\n2. ...",
  "success": true,
  "message": "Session ID: session_1. Use this for subsequent requests."
}
```

**Note:** Save the `session_id` from the message for all subsequent requests!

---

### 3. Get Recipe Details
**POST** `/api/recipe/details?session_id=session_1`

Get detailed instructions for a chosen recipe.

**Request Body:**
```json
{
  "recipe_name": "Chicken Biryani"
}
```

**Response:**
```json
{
  "recipe_name": "Chicken Biryani",
  "ingredients": "- 500g chicken\n- 2 cups basmati rice\n- 3 onions...",
  "steps": [
    "STEP 1: Marinate chicken with yogurt and spices for 30 minutes",
    "STEP 2: Heat oil in a pan and fry onions until golden brown",
    "STEP 3: Add marinated chicken and cook for 10 minutes...",
    "..."
  ],
  "tips": "- Use aged basmati rice for better texture\n- Don't skip the marination step...",
  "success": true
}
```

---

### 4. Get Next Step
**POST** `/api/step/next?session_id=session_1`

Get the next cooking step in sequence.

**Response:**
```json
{
  "step": "STEP 1: Marinate chicken with yogurt and spices for 30 minutes",
  "step_number": 1,
  "total_steps": 8,
  "completed": false,
  "message": "Success"
}
```

**When all steps completed:**
```json
{
  "step": null,
  "step_number": 9,
  "total_steps": 8,
  "completed": true,
  "message": "All steps completed!",
  "tips": "- Use aged basmati rice..."
}
```

---

### 5. Generate Image for Current Step
**POST** `/api/step/image?session_id=session_1`

Generate an AI image for the current cooking step.

**Response (GPU mode):**
```json
{
  "image_data": "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64 encoded PNG
  "description": "Professional overhead shot of marinated chicken...",
  "success": true,
  "generation_type": "gpu"
}
```

**Response (Text-only mode):**
```json
{
  "image_data": null,
  "description": "Professional overhead shot of marinated chicken pieces in a stainless steel bowl, yogurt coating visible, spices sprinkled on top, warm kitchen lighting, food photography style",
  "success": true,
  "generation_type": "text_only"
}
```

**Note:** Decode `image_data` from base64 to display the image.

---

### 6. Skip to Alternatives
**POST** `/api/step/skip?session_id=session_1`

Skip remaining cooking steps and jump to ingredient alternatives section.

**Response:**
```json
{
  "message": "Skipped to ingredient alternatives section",
  "success": true,
  "tips": "- Use aged basmati rice for better texture..."
}
```

---

### 7. Get Ingredient Alternatives
**POST** `/api/ingredients/alternatives?session_id=session_1`

Get alternatives for missing ingredients.

**Request Body:**
```json
{
  "missing_ingredient": "yogurt",
  "recipe_context": "Chicken Biryani"
}
```

**Response:**
```json
{
  "alternatives": "Here are 3 alternatives for yogurt in Chicken Biryani:\n\n1. Buttermilk\n   - Use 1 cup buttermilk instead of 1 cup yogurt\n   - It provides similar tanginess and helps tenderize chicken\n   - Taste: Slightly more sour, but works great\n\n2. Sour Cream\n   - Use equal amount as yogurt\n   - Adds creaminess and tang\n   - Taste: Richer and thicker texture\n\n3. Coconut Milk + Lemon Juice\n   - Mix 1 cup coconut milk with 1 tbsp lemon juice\n   - Good dairy-free alternative\n   - Taste: Adds subtle coconut flavor, still tangy",
  "success": true
}
```

---

### 8. Get Session Info
**GET** `/api/session/{session_id}`

Get current session state.

**Response:**
```json
{
  "session_id": "session_1",
  "current_recipe": "Chicken Biryani",
  "current_step": 3,
  "total_steps": 8,
  "has_recipe": true
}
```

---

### 9. Delete Session
**DELETE** `/api/session/{session_id}`

Delete a session and clear its data.

**Response:**
```json
{
  "message": "Session deleted successfully",
  "success": true
}
```

---

## Usage Flow

### Typical User Journey:

```
1. POST /api/preferences
   ↓ (Get session_id)
   
2. POST /api/recipe/details?session_id=...
   ↓ (Choose recipe, get ingredients & steps)
   
3. Loop:
   - POST /api/step/next?session_id=...
   - (Optional) POST /api/step/image?session_id=...
   - Repeat until completed
   
   OR
   
   - POST /api/step/skip?session_id=...
   
4. POST /api/ingredients/alternatives?session_id=...
   (For any missing ingredients)
   
5. DELETE /api/session/{session_id}
   (Clean up)
```

---

## Setup & Configuration

### 1. Environment Variables (.env file)
```env
GOOGLE_API_KEY=your_gemini_api_key_here
HF_TOKEN=your_huggingface_token_here  # Optional, for image generation
```

### 2. PDF Setup
- Create a `Pdfs` folder in the project root
- Add your recipe PDF files (cookbooks, recipe collections)
- The API will automatically index them on startup

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the API
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Image Generation Modes

### GPU Mode (Recommended)
- **Requirements:** NVIDIA GPU with CUDA, PyTorch with CUDA, Stable Diffusion
- **Setup:** Run `Image_gen.ipynb` cells 1-3 to install dependencies
- **Performance:** ~10-30 seconds per image
- **Quality:** High-quality, photorealistic food images

### Text-Only Mode (Fallback)
- **When:** No GPU available or dependencies not installed
- **Output:** Detailed text description of what the image would show
- **Performance:** Instant (~2-3 seconds)

---

## Error Handling

All endpoints return standard HTTP status codes:

- **200 OK:** Success
- **400 Bad Request:** Invalid input
- **404 Not Found:** Session not found
- **500 Internal Server Error:** Server error

**Error Response Format:**
```json
{
  "detail": "Error message here"
}
```

---

## Session Management

### Session Storage
- Sessions are stored in memory (development mode)
- For production: Use Redis, database, or persistent storage

### Session Data
Each session contains:
- User preferences
- Current recipe name
- Recipe steps
- Current step index
- Ingredients and tips

### Session Lifecycle
1. Created on `/api/preferences`
2. Used for all subsequent requests
3. Deleted manually or expires (implement timeout in production)

---

## API Testing with cURL

### 1. Submit Preferences
```bash
curl -X POST "http://localhost:8000/api/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Indian",
    "taste_preferences": ["spicy"],
    "meal_type": "lunch",
    "time_available": "30 mins",
    "allergies": [],
    "dislikes": [],
    "available_ingredients": ["chicken", "rice", "spices"]
  }'
```

### 2. Get Recipe Details
```bash
curl -X POST "http://localhost:8000/api/recipe/details?session_id=session_1" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_name": "Chicken Biryani"
  }'
```

### 3. Get Next Step
```bash
curl -X POST "http://localhost:8000/api/step/next?session_id=session_1"
```

### 4. Generate Image
```bash
curl -X POST "http://localhost:8000/api/step/image?session_id=session_1"
```

---

## Frontend Integration Tips

### Decoding Base64 Images (JavaScript)
```javascript
// For web browsers
const imgElement = document.getElementById('step-image');
imgElement.src = `data:image/png;base64,${response.image_data}`;

// For React
<img src={`data:image/png;base64,${imageData}`} alt="Cooking step" />
```

### Session Management (JavaScript)
```javascript
let sessionId = null;

// Submit preferences
const response = await fetch('/api/preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(preferences)
});

const data = await response.json();
// Extract session ID from message
sessionId = data.message.match(/session_\d+/)[0];
```

### Polling for Next Step (JavaScript)
```javascript
async function getNextStep() {
  const response = await fetch(`/api/step/next?session_id=${sessionId}`, {
    method: 'POST'
  });
  
  const data = await response.json();
  
  if (data.completed) {
    console.log('All steps completed!');
    console.log('Tips:', data.tips);
  } else {
    console.log(`Step ${data.step_number}/${data.total_steps}:`, data.step);
  }
}
```

---

## Performance Considerations

### RAG Search
- **First run:** Processes PDFs and creates FAISS index (1-5 minutes)
- **Subsequent runs:** Loads pre-built index (instant)
- **To rebuild:** Delete `recipe_faiss_index` folder

### Image Generation
- **GPU mode:** 10-30 seconds per image (depends on GPU)
- **Text mode:** 2-3 seconds per description
- **Optimization:** Images are generated on-demand, not cached

### Concurrency
- Current implementation: In-memory session storage (single instance)
- For production: Use Redis/database for multi-instance deployment

---

## Troubleshooting

### "Session not found"
- Session ID expired or invalid
- Start with `/api/preferences` to create new session

### "No recipe loaded"
- Call `/api/recipe/details` before `/api/step/next`

### Image generation returns text only
- Check if CUDA is available: See `Image_gen.ipynb` cell 4
- Install PyTorch with CUDA support
- Restart the API server

### RAG not working
- Ensure `Pdfs` folder exists with recipe PDF files
- Check API startup logs for indexing status
- Delete `recipe_faiss_index` folder to rebuild

---

## API Documentation URLs

After starting the API, access interactive documentation at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

---

## License & Credits

Built with:
- FastAPI - Web framework
- LangChain - AI orchestration
- Google Gemini - LLM
- FAISS - Vector search
- Stable Diffusion - Image generation
