# Contributing to Foodiee 🍳

Thank you for your interest in contributing to Foodiee! As a candidate for professional open-source initiatives like **GSoC 2025**, we maintain high standards for code quality, documentation, and architectural integrity.

This guide will help you get started with your first contribution.

---

## 🚀 Development Setup

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher (LTS recommended)
- **Database**: A PostgreSQL instance (Supabase recommended)
- **AI Access**: Google Cloud API Key with access to **Gemini 1.5 Pro** and **Imagen 4.0**

### 2. Fork & Clone
```bash
git clone https://github.com/chetanr25/foodiee.git
cd foodiee
```

### 3. Backend Intelligence Layer (FastAPI)
```bash
cd backend_recipe
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Environment Configuration**: Create a `.env` file in `backend_recipe/`:
```env
GOOGLE_API_KEY=your_google_api_key
SUPABASE_OG_URL=your_postgres_connection_string
S3_BUCKET_NAME=your_aws_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

**Run the Backend**:
```bash
python main.py
```

### 4. Frontend Presentation Layer (Next.js)
```bash
cd ../dashboard_recipe
npm install
```

**Environment Configuration**: Create a `.env.local` in `dashboard_recipe/`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Run the Frontend**:
```bash
npm run dev
```

---

## 🛠️ Contribution Workflow

### 1. Find an Issue
Check the [Issue Tracker](https://github.com/chetanr25/foodiee/issues) for tasks labeled `good-first-issue` or `help-wanted`. If you want to propose a new feature, please open an issue first to discuss the architectural implications.

### 2. Branching Strategy
We follow a standard feature-branch workflow:
- `main`: Production-ready code.
- `feature/your-feature-name`: For new features.
- `fix/bug-name`: For bug fixes.

### 3. Coding Standards
- **Python**: Follow [PEP 8](https://pep8.org/). Use type hints for all function signatures.
- **TypeScript**: Ensure strict type safety. Avoid using `any`.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add temporal state persistence`, `fix: handle 429 rate limits`).

### 4. Submitting a Pull Request
1. Ensure your code passes all linting checks.
2. Update the `README.md` or relevant documentation if necessary.
3. Provide a clear description of the changes and link to the relevant issue.
4. Request a review from the maintainers.

---

## 🧠 Architectural Guidelines

When contributing to the core engine, keep the following pillars in mind:
- **Statefulness**: Always maintain the integrity of the `CumulativeRecipeState`.
- **Resilience**: Ensure all external API calls are wrapped in the `retry_with_backoff` utility.
- **Modularity**: Keep the API routers decoupled from the core reasoning logic in `backend_recipe/core`.

---

## 📜 Code of Conduct
We are committed to providing a welcoming and inspiring community. Please be respectful and professional in all interactions.

*Happy Cooking and Coding!* 👩‍🍳👨‍💻

