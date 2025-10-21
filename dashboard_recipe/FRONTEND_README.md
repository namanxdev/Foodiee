# 🍳 Foodiee - AI Recipe Assistant Frontend

A beautiful, modern Next.js frontend for the Foodiee AI Recipe Recommendation System.

## ✨ Features

- **Beautiful UI**: Gradient backgrounds, smooth animations, and hover effects
- **Interactive Forms**: Easy-to-use preference selection with tags and multi-select
- **Recipe Recommendations**: AI-powered recipe suggestions based on your preferences
- **Step-by-Step Cooking**: Guided cooking experience with visual aids
- **Image Generation**: AI-generated images for each cooking step (GPU support)
- **Ingredient Alternatives**: Smart suggestions for missing ingredients
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🛠️ Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **DaisyUI** - UI components
- **React Icons** - Beautiful icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page with routing logic
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── PreferencesForm.tsx   # User preferences form
│   ├── RecipeList.tsx        # Recipe recommendations display
│   ├── RecipeDetails.tsx     # Detailed recipe view
│   └── CookingSteps.tsx      # Step-by-step cooking guide
└── lib/
    └── api.ts            # API utility functions
```

## 🎨 Features Overview

### 1. Preferences Form
- Select cuisine type
- Choose taste preferences (multiple selection)
- Specify meal type and time available
- Add allergies and dislikes
- List available ingredients

### 2. Recipe Recommendations
- View AI-generated recipe suggestions
- See recipe descriptions and cooking time
- Click to view detailed recipe

### 3. Recipe Details
- Complete ingredient list
- Step-by-step instructions preview
- Cooking tips and tricks

### 4. Cooking Steps
- Interactive step-by-step guide
- Progress tracking
- Visual guide generation with AI
- Ingredient alternatives lookup
- Completion celebration

## 🔧 Configuration

Create a `.env.local` file to customize the API endpoint:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎨 Customization

### Colors
The app uses a warm, food-themed color palette with gradients:
- Orange/Red/Pink for primary actions
- Green/Teal for ingredients
- Blue/Purple for steps
- Yellow/Amber for tips

### Components
All components use:
- Gradient backgrounds
- Smooth transitions
- Hover effects
- Shadow effects
- Scale transformations

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (375px+)

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in backend
- Verify API endpoints are accessible

### Styling Issues
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check Tailwind CSS configuration

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ for food lovers by Foodiee Team
