 🍳 Recipe Recommender FastAPI Backend

AI-powered recipe recommendation system with RAG (Retrieval-Augmented Generation) and GPU-accelerated image generation.

## 🌟 Features

- ✅ **Smart Recipe Recommendations** - AI analyzes your preferences and suggests 3 perfect recipes
- ✅ **RAG-Powered Search** - Searches your recipe PDF books first, enhances with AI
- ✅ **Step-by-Step Cooking** - Interactive cooking instructions, one step at a time
- ✅ **GPU Image Generation** - Real AI-generated food images using Stable Diffusion
- ✅ **Ingredient Alternatives** - Smart substitutions for missing ingredients
- ✅ **Session Management** - Stateful cooking sessions with progress tracking
- ✅ **RESTful API** - Clean, well-documented endpoints
- ✅ **Interactive Docs** - Built-in Swagger UI and ReDoc

## 🏗️ Architecture

```
User Preferences → FastAPI → RAG Search (PDFs) → LangChain → Gemini AI
                                                      ↓
                                              Recipe Response
                                                      ↓
                                          Step-by-Step Instructions
                                                      ↓
                      (Optional) Stable Diffusion → Food Images
```

## 📋 Prerequisites

- Python 3.8+
- Google Gemini API key ([Get here](https://makersuite.google.com/app/apikey))
- (Optional) NVIDIA GPU with CUDA for image generation
- (Optional) Recipe PDFs for RAG functionality

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd "e:\Oldowan Innovations"

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
copy .env.example .env

# Edit .env and add your Google Gemini API key
notepad .env
```

**Required in `.env`:**
```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

### 3. Add Recipe PDFs (Optional but Recommended)

```bash
# Create Pdfs folder if it doesn't exist
mkdir Pdfs

# Add your recipe PDF files
# - Cookbooks
# - Recipe collections
# - Cooking magazines
```

### 4. Enable GPU Image Generation (Optional)

If you have an NVIDIA GPU:

```bash
# Run the Image_gen.ipynb notebook cells 1-3
# This installs PyTorch with CUDA support

# Or manually:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install diffusers transformers accelerate safetensors
```

### 5. Start the API

```bash
# Method 1: Run main.py
python main.py

# Method 2: Use uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Access the API

- **API Base:** http://localhost:8000
- **Interactive Docs (Swagger):** http://localhost:8000/docs
- **API Docs (ReDoc):** http://localhost:8000/redoc

**📖 For step-by-step Swagger UI testing, see [SWAGGER_TESTING_GUIDE.md](SWAGGER_TESTING_GUIDE.md)**

## 📖 API Usage

### Example Flow with Python

```python
import requests

# 1. Submit preferences
response = requests.post("http://localhost:8000/api/preferences", json={
    "region": "Indian",
    "taste_preferences": ["spicy", "savory"],
    "meal_type": "lunch",
    "time_available": "30 mins",
    "allergies": [],
    "dislikes": [],
    "available_ingredients": ["chicken", "rice", "spices"]
})

data = response.json()
session_id = data["message"].split("session_")[1].split(".")[0]
session_id = f"session_{session_id}"

print(data["recommendations"])

# 2. Choose recipe and get details
response = requests.post(
    f"http://localhost:8000/api/recipe/details?session_id={session_id}",
    json={"recipe_name": "Chicken Biryani"}
)
details = response.json()

print("Ingredients:", details["ingredients"])
print("Steps:", len(details["steps"]))

# 3. Get next cooking step
response = requests.post(
    f"http://localhost:8000/api/step/next?session_id={session_id}"
)
step = response.json()
print(f"Step {step['step_number']}: {step['step']}")

# 4. Generate image for step
response = requests.post(
    f"http://localhost:8000/api/step/image?session_id={session_id}"
)
image_data = response.json()

if image_data["image_data"]:
    # Decode base64 image
    import base64
    from PIL import Image
    from io import BytesIO
    
    img_bytes = base64.b64decode(image_data["image_data"])
    img = Image.open(BytesIO(img_bytes))
    img.save("step_image.png")

# 5. Get ingredient alternatives
response = requests.post(
    f"http://localhost:8000/api/ingredients/alternatives?session_id={session_id}",
    json={
        "missing_ingredient": "yogurt",
        "recipe_context": "Chicken Biryani"
    }
)
alternatives = response.json()
print(alternatives["alternatives"])
```

### Example with Test Client

```bash
# Run the interactive test client
python test_api.py

# Choose option 1 for interactive mode
# Choose option 2 for automated demo
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and API status |
| `POST` | `/api/preferences` | Submit preferences, get recommendations |
| `POST` | `/api/recipe/details` | Get detailed recipe instructions |
| `POST` | `/api/step/next` | Get next cooking step |
| `POST` | `/api/step/image` | Generate image for current step |
| `POST` | `/api/step/skip` | Skip to alternatives section |
| `POST` | `/api/ingredients/alternatives` | Get ingredient substitutes |
| `GET` | `/api/session/{session_id}` | Get session information |
| `DELETE` | `/api/session/{session_id}` | Delete session |

**Full API documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🖼️ Image Generation

### GPU Mode (Recommended)
- **Hardware:** NVIDIA GPU (RTX 3050 or better)
- **Performance:** 10-30 seconds per image
- **Quality:** Photorealistic, high-quality food images
- **Setup:** Run `Image_gen.ipynb` to install dependencies

### Text-Only Mode (Fallback)
- **Hardware:** Any CPU
- **Performance:** 2-3 seconds
- **Output:** Detailed text descriptions
- **Automatic:** Enabled if GPU not available

## 📚 RAG (Recipe PDFs)

### How It Works

1. **On First Run:**
   - Loads PDFs from `Pdfs` folder
   - Extracts text and creates embeddings
   - Builds FAISS vector index
   - Saves index to `recipe_faiss_index` folder

2. **On Subsequent Runs:**
   - Loads pre-built index from disk (instant startup)
   - No reprocessing needed

3. **When User Queries:**
   - Searches PDF recipes semantically
   - Retrieves relevant chunks
   - Enhances with Gemini AI
   - Returns personalized recipe

### To Rebuild Index

```bash
# Delete the index folder
rmdir /s /q recipe_faiss_index

# Restart the API - it will rebuild automatically
python main.py
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key

# Optional
HF_TOKEN=your_huggingface_token
API_HOST=0.0.0.0
API_PORT=8000
PDF_DIRECTORY=Pdfs
FAISS_INDEX_PATH=recipe_faiss_index
```

### Customization

Edit `main.py` to customize:

- **Model Selection:** Change `gemini-2.5-flash` to other Gemini models
- **Image Model:** Switch from Stable Diffusion 1.5 to other models
- **RAG Settings:** Adjust chunk size, overlap, top-k results
- **Session Storage:** Implement Redis/database for production

## 🧪 Testing

### Manual Testing

```bash
# 1. Start the API
python main.py

# 2. Open Swagger UI
# Navigate to: http://localhost:8000/docs

# 3. Try endpoints interactively
```

### Automated Testing

```bash
# Run test client
python test_api.py

# Choose mode:
# 1 = Interactive (follow prompts)
# 2 = Automated (no input needed)
```

### cURL Testing

```bash
# Health check
curl http://localhost:8000/

# Submit preferences
curl -X POST "http://localhost:8000/api/preferences" \
  -H "Content-Type: application/json" \
  -d "{\"region\":\"Indian\",\"taste_preferences\":[\"spicy\"],\"meal_type\":\"lunch\",\"time_available\":\"30 mins\",\"allergies\":[],\"dislikes\":[],\"available_ingredients\":[\"chicken\",\"rice\"]}"
```

## 🐛 Troubleshooting

### API Won't Start

**Error:** `GOOGLE_API_KEY not found`
```bash
# Solution: Create .env file with your API key
echo GOOGLE_API_KEY=your_key_here > .env
```

**Error:** `Address already in use`
```bash
# Solution: Change port in main.py or kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

### RAG Not Working

**Issue:** No recipes from PDFs
```bash
# Check if Pdfs folder exists and has PDF files
dir Pdfs

# Check API logs for indexing status
# Should see: "✅ Recipe vector store created with X chunks!"
```

### Image Generation Not Working

**Issue:** Always getting text descriptions
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# If False, install PyTorch with CUDA:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Restart API
```

### Session Not Found

**Issue:** `404: Session not found`
```
Solution: Sessions are in-memory. If you restart the API, all sessions are lost.
Start a new flow with /api/preferences
```

## 📁 Project Structure

```
e:\Oldowan Innovations\
├── main.py                    # FastAPI backend
├── test_api.py               # Test client
├── API_DOCUMENTATION.md      # Detailed API docs
├── requirements.txt          # Dependencies
├── .env                      # Configuration (create this)
├── .env.example             # Configuration template
├── Foodie.ipynb             # Original notebook implementation
├── Image_gen.ipynb          # GPU setup notebook
├── Pdfs/                    # Recipe PDFs (create this)
│   ├── cookbook1.pdf
│   └── cookbook2.pdf
└── recipe_faiss_index/      # Generated FAISS index (auto-created)
    ├── index.faiss
    └── index.pkl
```

## 🚢 Deployment

### Local Development
```bash
python main.py
```

### Production (Docker - Coming Soon)
```bash
docker build -t recipe-api .
docker run -p 8000:8000 -v ./Pdfs:/app/Pdfs recipe-api
```

### Cloud Deployment
- **Recommended:** Railway, Render, or Google Cloud Run
- **Requirements:** 
  - Environment variables set
  - Persistent storage for FAISS index
  - (Optional) GPU instance for image generation

## 🤝 Contributing

This is part of the Oldowan Innovations project. To contribute:

1. Test the API thoroughly
2. Document any issues in the project tracker
3. Suggest improvements or new features
4. Create pull requests for bug fixes

## 📄 License

Part of Oldowan Innovations project.

## 🙏 Acknowledgments

Built with:
- **FastAPI** - Modern web framework
- **LangChain** - AI orchestration
- **Google Gemini** - Language model
- **FAISS** - Vector search
- **Stable Diffusion** - Image generation
- **PyTorch** - Deep learning framework

## 📞 Support

For issues or questions:
1. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. Review troubleshooting section above
3. Check Swagger docs: http://localhost:8000/docs
4. Review code comments in `main.py`

---

**Status:** ✅ Production-ready API with RAG + Image Generation

**Last Updated:** 2025-01-18
