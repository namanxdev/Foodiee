# User Model Setup Guide - Foodiee Application

This guide explains how the user authentication and database storage works in the Foodiee application.

## Architecture Overview

```
NextAuth (Frontend) → FastAPI Backend → Supabase Database
     ↓                       ↓                  ↓
Google OAuth          User Model          PostgreSQL
```

## Database Setup

### 1. Create Supabase Table

Go to your Supabase Dashboard: https://app.supabase.com

Navigate to **SQL Editor** and run the SQL script in `supabase_setup.sql`

Or manually create the table:

```sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    google_id VARCHAR(255),
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 2. Install Python Dependencies

```bash
cd backend_recipe
pip install supabase
# Or install all requirements
pip install -r requirements.txt
```

## Configuration

### Backend Environment Variables (`.env`)

```env
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Use the **HTTPS URL** format for Supabase, not the PostgreSQL connection string!

### Frontend Environment Variables (`.env.local`)

```env
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_secret
AUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### 1. User Sign In Flow

```
1. User clicks "Sign in with Google"
2. NextAuth handles Google OAuth
3. On successful auth, NextAuth callback triggers
4. Callback sends user data to backend API
5. Backend creates/updates user in Supabase
6. User data is stored with email, name, image
```

### 2. User Model Features

**Located in:** `backend_recipe/model/User_model.py`

#### Methods:

- `create_or_update_user(user_data)` - Create new user or update existing
- `get_user_by_email(email)` - Retrieve user by email
- `get_user_by_id(user_id)` - Retrieve user by ID
- `update_user_preferences(email, preferences)` - Save user's food preferences
- `get_user_preferences(email)` - Retrieve saved preferences
- `delete_user(email)` - Delete user from database

### 3. API Endpoints

#### User Management

```
POST   /api/user/signin           - Create/update user on sign in
GET    /api/user/{email}           - Get user information
PUT    /api/user/{email}/preferences - Update user preferences
GET    /api/user/{email}/preferences - Get user preferences
```

#### Example Request - Sign In:

```bash
curl -X POST http://localhost:8000/api/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/...",
    "google_id": "1234567890"
  }'
```

#### Example Request - Update Preferences:

```bash
curl -X PUT http://localhost:8000/api/user/user@example.com/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Indian",
    "taste_preferences": ["Spicy", "Savory"],
    "meal_type": "Dinner",
    "time_available": "30-45 mins",
    "allergies": ["Nuts"],
    "dislikes": ["Mushrooms"],
    "available_ingredients": ["Chicken", "Rice", "Tomatoes"]
  }'
```

## Frontend Integration

The frontend is already configured to sync users automatically in `src/auth.ts`:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Automatically syncs user with backend
    await fetch('http://localhost:8000/api/user/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        image: user.image,
        google_id: account?.providerAccountId,
      }),
    });
    return true;
  },
}
```

## Usage in Your Code

### Python Backend

```python
from model.User_model import user_model

# Create or update user
result = user_model.create_or_update_user({
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "google_id": "123456"
})

# Get user
user = user_model.get_user_by_email("user@example.com")

# Update preferences
preferences = {
    "region": "Indian",
    "taste_preferences": ["Spicy"],
    "meal_type": "Dinner",
    "allergies": ["Nuts"]
}
result = user_model.update_user_preferences("user@example.com", preferences)

# Get preferences
prefs = user_model.get_user_preferences("user@example.com")
```

### TypeScript Frontend

```typescript
// Get user info from backend
const response = await fetch(`http://localhost:8000/api/user/${email}`);
const { user } = await response.json();

// Update preferences
await fetch(`http://localhost:8000/api/user/${email}/preferences`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(preferences)
});
```

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `email` | VARCHAR(255) | User's email (unique) |
| `name` | VARCHAR(255) | User's full name |
| `image` | TEXT | Profile image URL |
| `google_id` | VARCHAR(255) | Google OAuth ID |
| `preferences` | JSONB | User's food preferences |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |

### Preferences JSON Structure

```json
{
  "region": "Indian",
  "taste_preferences": ["Spicy", "Savory"],
  "meal_type": "Dinner",
  "time_available": "30-45 mins",
  "allergies": ["Nuts", "Dairy"],
  "dislikes": ["Mushrooms"],
  "available_ingredients": ["Chicken", "Rice"]
}
```

## Testing

### 1. Test Backend Connection

```bash
cd backend_recipe
python -c "from model.User_model import user_model; print(user_model.client)"
```

### 2. Test User Creation

```bash
curl -X POST http://localhost:8000/api/user/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 3. Verify in Supabase

Go to Supabase Dashboard → Table Editor → `users` table

## Security Notes

- ✅ Row Level Security (RLS) is enabled on the users table
- ✅ Using Supabase anon key (safe for client-side)
- ✅ CORS configured for localhost:3000
- ⚠️ For production: Update CORS origins and use environment-specific URLs
- ⚠️ Never commit `.env` files to Git

## Troubleshooting

### Error: "Import 'supabase' could not be resolved"

```bash
pip install supabase
```

### Error: "SUPABASE_URL not found"

Check your `.env` file in `backend_recipe/` directory. Make sure it contains:
- `SUPABASE_URL` (HTTPS format)
- `SUPABASE_ANON_KEY`

### Error: "relation 'users' does not exist"

Run the SQL script in `supabase_setup.sql` in your Supabase SQL Editor.

### Users not syncing on sign in

Check browser console and backend logs. Make sure:
1. Backend is running on port 8000
2. Frontend can reach `http://localhost:8000`
3. CORS is configured correctly

## Why Use Supabase URL (not PostgreSQL string)?

**✅ Correct (Python Client):**
```
SUPABASE_URL=https://oluavpacyvbevnirnakd.supabase.co
```

**❌ Incorrect (Direct PostgreSQL):**
```
SUPABASE_URL=postgresql://postgres:password@db.oluavpacyvbevnirnakd.supabase.co:5432/postgres
```

The Python `supabase` library uses the REST API over HTTPS, not direct PostgreSQL connections. This provides:
- Built-in authentication
- Automatic Row Level Security
- Better security for client-side usage
- Easier connection management

## Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Run SQL setup in Supabase Dashboard
3. ✅ Update environment variables
4. ✅ Start backend: `python main.py`
5. ✅ Start frontend: `npm run dev`
6. ✅ Test sign in with Google
7. ✅ Check Supabase dashboard to verify user creation

## Support

For issues, check:
- Supabase Dashboard: https://app.supabase.com
- API Documentation: http://localhost:8000/docs
- NextAuth Documentation: https://authjs.dev
