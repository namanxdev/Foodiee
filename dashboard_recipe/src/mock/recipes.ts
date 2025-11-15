import type {
  RecipeDetail,
  RecipeDietaryTag,
  RecipeDifficulty,
  RecipeMealType,
  RecipeSummary,
} from "@/types/library";

const cuisines = [
  "Italian",
  "Indian",
  "Mexican",
  "Japanese",
  "Mediterranean",
  "Thai",
  "American",
  "Korean",
  "French",
];

const mealTypes: RecipeMealType[] = [
  "Breakfast",
  "Brunch",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
  "Drink",
];

const dietaryTags: RecipeDietaryTag[] = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Pescatarian",
  "Low-Carb",
  "High-Protein",
];

const difficulties: RecipeDifficulty[] = ["Easy", "Medium", "Hard"];

const now = new Date();

function daysAgo(days: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const createSummary = (detail: RecipeDetail): RecipeSummary => ({
  id: detail.id,
  slug: detail.slug,
  title: detail.title,
  description: detail.description,
  cuisine: detail.cuisine,
  mealType: detail.mealType,
  difficulty: detail.difficulty,
  tags: detail.tags,
  dietary: detail.dietary,
  totalTimeMinutes: detail.totalTimeMinutes,
  prepTimeMinutes: detail.prepTimeMinutes,
  cookTimeMinutes: detail.cookTimeMinutes,
  servings: detail.servings,
  rating: detail.rating,
  ratingCount: detail.ratingCount,
  favorite: detail.favorite,
  image: detail.image,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt,
  lastCookedAt: detail.lastCookedAt,
  isTrending: detail.isTrending,
});

export const RECIPE_LIBRARY_MOCKS: RecipeDetail[] = [
  {
    id: "caprese-pasta-salad",
    slug: "caprese-pasta-salad",
    title: "Roasted Caprese Pasta Salad",
    description:
      "Twirl-able gemelli tossed with blistered cherry tomatoes, basil pesto, and creamy burrata.",
    cuisine: "Italian",
    mealType: "Dinner",
    difficulty: "Easy",
    tags: ["30-minutes", "Summer", "One-pot"],
    dietary: ["Vegetarian"],
    totalTimeMinutes: 30,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    rating: 4.8,
    ratingCount: 128,
    favorite: true,
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(6),
    lastCookedAt: daysAgo(9),
    isTrending: true,
    ingredients: [
      {
        name: "Gemelli pasta",
        amount: "12 oz",
      },
      {
        name: "Cherry tomatoes",
        amount: "3 cups",
        preparation: "halved",
      },
      {
        name: "Fresh basil pesto",
        amount: "1/2 cup",
      },
      {
        name: "Burrata cheese",
        amount: "2 balls",
      },
      {
        name: "Extra virgin olive oil",
        amount: "3 tbsp",
      },
      {
        name: "Balsamic glaze",
        amount: "2 tbsp",
        optional: true,
      },
    ],
    steps: [
      {
        id: "1",
        title: "Roast the tomatoes",
        instruction:
          "Toss tomatoes with olive oil, salt, and pepper. Roast at 425°F (220°C) for 18 minutes until blistered.",
        durationMinutes: 18,
        tip: "Use a rimmed baking sheet for even caramelization.",
      },
      {
        id: "2",
        title: "Cook the pasta",
        instruction:
          "Boil gemelli in salted water for 9 minutes until al dente. Reserve 1/2 cup of starchy water.",
        durationMinutes: 10,
      },
      {
        id: "3",
        title: "Toss and serve",
        instruction:
          "Combine pasta with tomatoes, pesto, and pasta water. Finish with torn burrata, basil leaves, and balsamic glaze.",
        tip: "Serve slightly warm for the creamiest texture.",
      },
    ],
    equipment: ["Sheet pan", "Large pot", "Colander", "Mixing bowl"],
    nutrition: {
      calories: 620,
      protein: 20,
      carbohydrates: 68,
      fat: 28,
      fiber: 4,
      sugar: 8,
      sodium: 780,
    },
    author: {
      name: "Lena Marchetti",
      avatarUrl:
        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f2?auto=format&fit=crop&w=400&q=80",
      title: "Pasta & Sauce Specialist",
    },
    relatedIds: ["lemon-garlic-shrimp-linguine", "crispy-gnocchi-skillet"],
    sourceUrl: "https://foodiee.ai/recipes/caprese-pasta-salad",
  },
  {
    id: "lemon-garlic-shrimp-linguine",
    slug: "lemon-garlic-shrimp-linguine",
    title: "Lemon Garlic Shrimp Linguine",
    description:
      "Silky linguine with garlic butter shrimp, charred lemon, and parsley gremolata.",
    cuisine: "Mediterranean",
    mealType: "Dinner",
    difficulty: "Medium",
    tags: ["Seafood", "Date-night"],
    dietary: ["Pescatarian", "High-Protein"],
    totalTimeMinutes: 28,
    prepTimeMinutes: 12,
    cookTimeMinutes: 16,
    servings: 2,
    rating: 4.9,
    ratingCount: 204,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(4),
    ingredients: [
      {
        name: "Linguine",
        amount: "8 oz",
      },
      {
        name: "Large shrimp, peeled & deveined",
        amount: "1 lb",
      },
      {
        name: "Unsalted butter",
        amount: "4 tbsp",
      },
      {
        name: "Garlic cloves",
        amount: "4",
        preparation: "thinly sliced",
      },
      {
        name: "Lemons",
        amount: "2",
        preparation: "zested and juiced",
      },
      {
        name: "Fresh parsley",
        amount: "1/2 cup",
        preparation: "finely chopped",
      },
    ],
    steps: [
      {
        id: "1",
        title: "Cook the linguine",
        instruction:
          "Boil linguine in generously salted water until al dente. Reserve 1 cup of pasta water.",
        durationMinutes: 9,
      },
      {
        id: "2",
        title: "Sauté the shrimp",
        instruction:
          "Melt butter over medium heat. Add garlic, cook 1 minute, then sear shrimp 2 minutes per side until opaque.",
        durationMinutes: 5,
        tip: "Work in batches to avoid overcrowding the skillet.",
      },
      {
        id: "3",
        title: "Finish the sauce",
        instruction:
          "Add lemon juice, zest, and pasta water. Toss linguine through sauce and top with parsley gremolata.",
        durationMinutes: 3,
      },
    ],
    equipment: ["Large skillet", "Microplane", "Tongs", "Large pot"],
    nutrition: {
      calories: 540,
      protein: 38,
      carbohydrates: 54,
      fat: 18,
      fiber: 3,
      sugar: 4,
      sodium: 860,
    },
    author: {
      name: "Mateo Alvarez",
      avatarUrl:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      title: "Seafood Enthusiast",
    },
    relatedIds: ["caprese-pasta-salad", "miso-glazed-salmon-bowls"],
    sourceUrl: "https://foodiee.ai/recipes/lemon-garlic-shrimp-linguine",
  },
  {
    id: "golden-chickpea-curry",
    slug: "golden-chickpea-curry",
    title: "Golden Coconut Chickpea Curry",
    description:
      "Creamy tomato-coconut curry with roasted cauliflower, garam masala, and lime-infused basmati.",
    cuisine: "Indian",
    mealType: "Dinner",
    difficulty: "Medium",
    tags: ["Plant-based", "Meal-prep"],
    dietary: ["Vegan", "Gluten-Free"],
    totalTimeMinutes: 35,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 4,
    rating: 4.7,
    ratingCount: 312,
    favorite: true,
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(75),
    updatedAt: daysAgo(11),
    lastCookedAt: daysAgo(2),
    ingredients: [
      { name: "Canned chickpeas", amount: "2 cans", preparation: "drained & rinsed" },
      { name: "Cauliflower florets", amount: "4 cups" },
      { name: "Yellow onion", amount: "1 large", preparation: "diced" },
      { name: "Garlic cloves", amount: "5", preparation: "minced" },
      { name: "Ginger", amount: "1 tbsp", preparation: "grated" },
      { name: "Garam masala", amount: "2 tsp" },
      { name: "Turmeric", amount: "1 tsp" },
      { name: "Crushed tomatoes", amount: "1 can (14 oz)" },
      { name: "Coconut milk", amount: "1 can (13.5 oz)" },
      { name: "Baby spinach", amount: "3 cups" },
    ],
    steps: [
      {
        id: "1",
        title: "Roast the cauliflower",
        instruction:
          "Toss florets with oil, salt, pepper, and turmeric. Roast at 425°F for 20 minutes.",
        durationMinutes: 20,
      },
      {
        id: "2",
        title: "Build the curry base",
        instruction:
          "Sauté onion, garlic, and ginger. Stir in spices, tomatoes, and coconut milk; simmer 10 minutes.",
        durationMinutes: 15,
      },
      {
        id: "3",
        title: "Finish and serve",
        instruction:
          "Fold in chickpeas, roasted cauliflower, and spinach. Simmer 5 minutes and serve with lime basmati rice.",
        durationMinutes: 5,
      },
    ],
    equipment: ["Dutch oven", "Sheet pan", "Wooden spoon"],
    nutrition: {
      calories: 480,
      protein: 18,
      carbohydrates: 52,
      fat: 20,
      fiber: 12,
      sugar: 9,
      sodium: 620,
    },
    author: {
      name: "Priya Desai",
      avatarUrl:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      title: "Plant-Based Chef",
    },
    relatedIds: ["miso-glazed-salmon-bowls", "crispy-gnocchi-skillet"],
    sourceUrl: "https://foodiee.ai/recipes/golden-chickpea-curry",
  },
  {
    id: "miso-glazed-salmon-bowls",
    slug: "miso-glazed-salmon-bowls",
    title: "Miso Glazed Salmon Bowls",
    description:
      "Caramelized miso salmon over sesame rice with pickled cucumbers and edamame.",
    cuisine: "Japanese",
    mealType: "Dinner",
    difficulty: "Medium",
    tags: ["Weeknight", "High-protein", "Omega-3"],
    dietary: ["Pescatarian", "High-Protein"],
    totalTimeMinutes: 32,
    prepTimeMinutes: 12,
    cookTimeMinutes: 20,
    servings: 3,
    rating: 4.9,
    ratingCount: 410,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(28),
    updatedAt: daysAgo(3),
    ingredients: [
      { name: "Salmon fillets", amount: "3 (6 oz each)" },
      { name: "White miso paste", amount: "3 tbsp" },
      { name: "Maple syrup", amount: "2 tbsp" },
      { name: "Rice vinegar", amount: "2 tbsp" },
      { name: "Soy sauce", amount: "2 tbsp" },
      { name: "Cooked sushi rice", amount: "3 cups" },
      { name: "Edamame", amount: "2 cups", preparation: "shelled" },
      { name: "Persian cucumber", amount: "2", preparation: "thinly sliced" },
      { name: "Pickled ginger", amount: "1/3 cup" },
      { name: "Scallions", amount: "1/2 cup", preparation: "sliced" },
    ],
    steps: [
      {
        id: "1",
        title: "Marinate the salmon",
        instruction:
          "Whisk miso, maple syrup, soy, and vinegar. Brush over salmon and marinate 10 minutes.",
      },
      {
        id: "2",
        title: "Broil to caramelize",
        instruction:
          "Broil salmon skin-side down at 500°F for 8 minutes until lacquered and flaky.",
        durationMinutes: 8,
        tip: "Line baking sheet with foil for easy cleanup.",
      },
      {
        id: "3",
        title: "Assemble bowls",
        instruction:
          "Layer sesame rice, edamame, pickled cucumbers, and flaked salmon. Finish with ginger and scallions.",
      },
    ],
    equipment: ["Sheet pan", "Small bowl", "Rice cooker"],
    nutrition: {
      calories: 560,
      protein: 35,
      carbohydrates: 52,
      fat: 24,
      fiber: 6,
      sugar: 14,
      sodium: 930,
    },
    author: {
      name: "Naoko Sato",
      avatarUrl:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
      title: "Sea-to-Table Expert",
    },
    relatedIds: ["lemon-garlic-shrimp-linguine"],
    sourceUrl: "https://foodiee.ai/recipes/miso-glazed-salmon-bowls",
  },
  {
    id: "crispy-gnocchi-skillet",
    slug: "crispy-gnocchi-skillet",
    title: "Crispy Gnocchi Skillet Bake",
    description:
      "Skillet-seared gnocchi baked with fennel sausage ragù, kale, and whipped ricotta.",
    cuisine: "Italian",
    mealType: "Dinner",
    difficulty: "Medium",
    tags: ["Skillet", "Comfort-food"],
    dietary: ["High-Protein"],
    totalTimeMinutes: 45,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    rating: 4.6,
    ratingCount: 189,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(20),
    ingredients: [
      { name: "Shelf-stable gnocchi", amount: "18 oz" },
      { name: "Italian sausage", amount: "12 oz", preparation: "casings removed" },
      { name: "Fennel bulb", amount: "1", preparation: "thinly sliced" },
      { name: "Tuscan kale", amount: "3 cups", preparation: "shredded" },
      { name: "Crushed tomatoes", amount: "1 can (28 oz)" },
      { name: "Fresh ricotta", amount: "1 cup", preparation: "whipped" },
      { name: "Fresh mozzarella", amount: "6 oz", preparation: "torn" },
    ],
    steps: [
      {
        id: "1",
        title: "Toast the gnocchi",
        instruction:
          "Sear gnocchi in olive oil until golden and crispy. Remove and set aside.",
        durationMinutes: 8,
      },
      {
        id: "2",
        title: "Build the ragù",
        instruction:
          "Brown sausage with fennel. Add tomatoes and kale; simmer 12 minutes.",
        durationMinutes: 15,
      },
      {
        id: "3",
        title: "Bake until bubbling",
        instruction:
          "Fold in gnocchi, top with ricotta dollops and mozzarella. Bake at 400°F for 12 minutes.",
        durationMinutes: 12,
      },
    ],
    equipment: ["12-inch oven-safe skillet", "Wooden spoon"],
    nutrition: {
      calories: 710,
      protein: 32,
      carbohydrates: 62,
      fat: 36,
      fiber: 6,
      sugar: 10,
      sodium: 1050,
    },
    author: {
      name: "Sofia Romano",
      avatarUrl:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      title: "Comfort Food Stylist",
    },
    relatedIds: ["caprese-pasta-salad"],
    sourceUrl: "https://foodiee.ai/recipes/crispy-gnocchi-skillet",
  },
  {
    id: "charred-broccoli-caesar",
    slug: "charred-broccoli-caesar",
    title: "Charred Broccoli Caesar with Herby Croutons",
    description:
      "Blistered broccoli, smoky Caesar dressing, and rye sourdough croutons.",
    cuisine: "American",
    mealType: "Lunch",
    difficulty: "Easy",
    tags: ["Vegetables", "Weekday lunch"],
    dietary: ["Vegetarian", "Low-Carb"],
    totalTimeMinutes: 20,
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 3,
    rating: 4.5,
    ratingCount: 96,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(2),
    ingredients: [
      { name: "Broccoli crowns", amount: "2", preparation: "cut into florets" },
      { name: "Sourdough bread", amount: "2 cups", preparation: "cubed" },
      { name: "Parmesan cheese", amount: "1/2 cup", preparation: "shaved" },
      { name: "Greek yogurt", amount: "1/3 cup" },
      { name: "Anchovy paste", amount: "1 tsp" },
      { name: "Smoked paprika", amount: "1/2 tsp" },
      { name: "Lemon", amount: "1", preparation: "zested and juiced" },
    ],
    steps: [
      {
        id: "1",
        title: "Char the broccoli",
        instruction:
          "Toss florets with oil and sear in a hot skillet until deeply charred but crisp.",
        durationMinutes: 6,
      },
      {
        id: "2",
        title: "Toast the croutons",
        instruction:
          "Crisp sourdough cubes in butter with herbs until golden, about 4 minutes.",
        durationMinutes: 4,
      },
      {
        id: "3",
        title: "Whisk the dressing",
        instruction:
          "Blend yogurt, anchovy, lemon, garlic, and paprika. Toss with broccoli and croutons, top with parmesan.",
      },
    ],
    equipment: ["Cast iron skillet", "Mixing bowl", "Whisk"],
    nutrition: {
      calories: 320,
      protein: 14,
      carbohydrates: 28,
      fat: 18,
      fiber: 6,
      sugar: 5,
      sodium: 480,
    },
    author: {
      name: "Jordan Blake",
      avatarUrl:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
      title: "Vegetable Whisperer",
    },
    relatedIds: ["caprese-pasta-salad"],
    sourceUrl: "https://foodiee.ai/recipes/charred-broccoli-caesar",
  },
  {
    id: "orange-cardamom-french-toast",
    slug: "orange-cardamom-french-toast",
    title: "Orange Cardamom French Toast Bake",
    description:
      "Custardy brioche with citrus marmalade, pistachios, and rose whipped cream.",
    cuisine: "French",
    mealType: "Brunch",
    difficulty: "Medium",
    tags: ["Brunch", "Make-ahead"],
    dietary: ["Vegetarian"],
    totalTimeMinutes: 50,
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    servings: 6,
    rating: 4.9,
    ratingCount: 152,
    favorite: true,
    image:
      "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(25),
    ingredients: [
      { name: "Brioche loaf", amount: "1", preparation: "cut into thick slices" },
      { name: "Eggs", amount: "6" },
      { name: "Heavy cream", amount: "1 1/2 cups" },
      { name: "Orange zest", amount: "2 tbsp" },
      { name: "Ground cardamom", amount: "1 tsp" },
      { name: "Orange marmalade", amount: "1/2 cup" },
      { name: "Shelled pistachios", amount: "1/3 cup", preparation: "chopped" },
      { name: "Rose water", amount: "1/2 tsp" },
    ],
    steps: [
      {
        id: "1",
        title: "Build the custard",
        instruction:
          "Whisk eggs, cream, orange zest, cardamom, and vanilla until smooth.",
      },
      {
        id: "2",
        title: "Layer and soak",
        instruction:
          "Layer brioche in a buttered baking dish. Pour custard over, dot with marmalade, rest 15 minutes.",
        durationMinutes: 15,
      },
      {
        id: "3",
        title: "Bake & finish",
        instruction:
          "Bake at 350°F for 35 minutes. Top with rose whipped cream and pistachios.",
        durationMinutes: 35,
      },
    ],
    equipment: ["9x13-inch baking dish", "Whisk", "Stand mixer"],
    nutrition: {
      calories: 410,
      protein: 11,
      carbohydrates: 42,
      fat: 22,
      fiber: 2,
      sugar: 20,
      sodium: 360,
    },
    author: {
      name: "Élodie Bernard",
      avatarUrl:
        "https://images.unsplash.com/photo-1544723795-432537ff10d7?auto=format&fit=crop&w=400&q=80",
      title: "Pastry Curator",
    },
    relatedIds: ["chai-spiced-oat-latte"],
    sourceUrl: "https://foodiee.ai/recipes/orange-cardamom-french-toast",
  },
  {
    id: "spicy-tofu-lettuce-wraps",
    slug: "spicy-tofu-lettuce-wraps",
    title: "Crispy Spicy Tofu Lettuce Wraps",
    description:
      "Charred tofu crumbles with gochujang glaze, quick pickles, and butter lettuce cups.",
    cuisine: "Korean",
    mealType: "Dinner",
    difficulty: "Easy",
    tags: ["30-minutes", "Weeknight"],
    dietary: ["Vegan", "High-Protein"],
    totalTimeMinutes: 25,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    rating: 4.6,
    ratingCount: 178,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(34),
    updatedAt: daysAgo(1),
    ingredients: [
      { name: "Extra firm tofu", amount: "16 oz", preparation: "pressed & crumbled" },
      { name: "Gochujang", amount: "2 tbsp" },
      { name: "Soy sauce", amount: "2 tbsp" },
      { name: "Rice vinegar", amount: "2 tbsp" },
      { name: "Brown sugar", amount: "1 tbsp" },
      { name: "Sesame oil", amount: "1 tbsp" },
      { name: "Butter lettuce", amount: "2 heads", preparation: "leaves separated" },
      { name: "Quick pickled carrots", amount: "1 cup" },
    ],
    steps: [
      {
        id: "1",
        title: "Crisp the tofu",
        instruction:
          "Sear crumbled tofu in a hot skillet until golden on the edges, about 6 minutes.",
        durationMinutes: 6,
      },
      {
        id: "2",
        title: "Glaze and reduce",
        instruction:
          "Stir in gochujang, soy, vinegar, and brown sugar. Cook 4 minutes until sticky.",
        durationMinutes: 4,
      },
      {
        id: "3",
        title: "Assemble wraps",
        instruction:
          "Spoon tofu into lettuce cups, top with pickles, herbs, and sesame seeds.",
      },
    ],
    equipment: ["Non-stick skillet", "Silicone spatula"],
    nutrition: {
      calories: 320,
      protein: 18,
      carbohydrates: 28,
      fat: 14,
      fiber: 5,
      sugar: 12,
      sodium: 740,
    },
    author: {
      name: "Minji Park",
      avatarUrl:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      title: "Weeknight Innovator",
    },
    relatedIds: ["golden-chickpea-curry"],
    sourceUrl: "https://foodiee.ai/recipes/spicy-tofu-lettuce-wraps",
  },
  {
    id: "mango-chili-chia-parfait",
    slug: "mango-chili-chia-parfait",
    title: "Mango Chili Chia Parfaits",
    description:
      "Coconut chia pudding layered with mango puree, tajin crunch, and lime zest.",
    cuisine: "Mexican",
    mealType: "Breakfast",
    difficulty: "Easy",
    tags: ["Meal-prep", "No-cook"],
    dietary: ["Vegan", "Gluten-Free"],
    totalTimeMinutes: 10,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 4,
    rating: 4.4,
    ratingCount: 88,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(2),
    ingredients: [
      { name: "Coconut milk", amount: "2 cups" },
      { name: "Chia seeds", amount: "1/2 cup" },
      { name: "Agave syrup", amount: "3 tbsp" },
      { name: "Mangoes", amount: "3", preparation: "blended smooth" },
      { name: "Tajin seasoning", amount: "2 tsp" },
      { name: "Toasted coconut flakes", amount: "1/3 cup" },
      { name: "Lime zest", amount: "1 tbsp" },
    ],
    steps: [
      {
        id: "1",
        title: "Make the chia base",
        instruction:
          "Whisk coconut milk, chia, agave, and pinch sea salt. Chill 2 hours or overnight.",
      },
      {
        id: "2",
        title: "Blend the mango",
        instruction:
          "Puree mango flesh with lime zest until silky. Chill until ready.",
      },
      {
        id: "3",
        title: "Layer & finish",
        instruction:
          "Layer chia pudding with mango puree, topping with tajin crunch and toasted coconut.",
      },
    ],
    equipment: ["Blender", "Mixing bowl", "Mason jars"],
    nutrition: {
      calories: 280,
      protein: 5,
      carbohydrates: 34,
      fat: 12,
      fiber: 8,
      sugar: 22,
      sodium: 120,
    },
    author: {
      name: "Camila Reyes",
      avatarUrl:
        "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=400&q=80",
      title: "Breakfast Architect",
    },
    relatedIds: ["orange-cardamom-french-toast"],
    sourceUrl: "https://foodiee.ai/recipes/mango-chili-chia-parfait",
  },
  {
    id: "chai-spiced-oat-latte",
    slug: "chai-spiced-oat-latte",
    title: "Chai Spiced Oat Milk Latte",
    description:
      "Creamy oat latte infused with homemade chai concentrate and maple foam.",
    cuisine: "Indian",
    mealType: "Drink",
    difficulty: "Easy",
    tags: ["Beverage", "Batch-prep"],
    dietary: ["Vegan"],
    totalTimeMinutes: 15,
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    servings: 2,
    rating: 4.3,
    ratingCount: 65,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    ingredients: [
      { name: "Oat milk", amount: "3 cups" },
      { name: "Cinnamon sticks", amount: "2" },
      { name: "Green cardamom pods", amount: "8" },
      { name: "Fresh ginger", amount: "1 inch", preparation: "sliced" },
      { name: "Black tea bags", amount: "3" },
      { name: "Maple syrup", amount: "3 tbsp" },
      { name: "Vanilla extract", amount: "1 tsp" },
    ],
    steps: [
      {
        id: "1",
        title: "Steep the spices",
        instruction:
          "Simmer oat milk with cinnamon, cardamom, cloves, and ginger for 5 minutes.",
      },
      {
        id: "2",
        title: "Add tea & sweeten",
        instruction:
          "Remove from heat, steep tea bags 4 minutes. Stir in maple syrup and vanilla.",
      },
      {
        id: "3",
        title: "Froth & serve",
        instruction:
          "Froth a portion of the latte, pour over ice or serve warm, dust with cinnamon.",
      },
    ],
    equipment: ["Saucepan", "Fine mesh strainer", "Milk frother"],
    nutrition: {
      calories: 160,
      protein: 3,
      carbohydrates: 30,
      fat: 3,
      fiber: 2,
      sugar: 20,
      sodium: 180,
    },
    author: {
      name: "Ananya Patel",
      avatarUrl:
        "https://images.unsplash.com/photo-1521572278905-ffb58991ed00?auto=format&fit=crop&w=400&q=80",
      title: "Beverage Director",
    },
    relatedIds: ["mango-chili-chia-parfait"],
    sourceUrl: "https://foodiee.ai/recipes/chai-spiced-oat-latte",
  },
  {
    id: "firecracker-cauliflower-tacos",
    slug: "firecracker-cauliflower-tacos",
    title: "Firecracker Cauliflower Tacos",
    description:
      "Crispy tempura cauliflower tossed in sweet heat sauce with avocado crema and pickled onions.",
    cuisine: "Mexican",
    mealType: "Dinner",
    difficulty: "Medium",
    tags: ["Taco-night", "Crowd-pleaser"],
    dietary: ["Vegetarian"],
    totalTimeMinutes: 40,
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    rating: 4.8,
    ratingCount: 236,
    favorite: true,
    image:
      "https://images.unsplash.com/photo-1660485038927-478e032fe2f1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1176",
    createdAt: daysAgo(62),
    updatedAt: daysAgo(7),
    ingredients: [
      { name: "Cauliflower florets", amount: "5 cups" },
      { name: "Tempura batter mix", amount: "1 1/4 cups" },
      { name: "Gochujang", amount: "2 tbsp" },
      { name: "Honey", amount: "2 tbsp" },
      { name: "Corn tortillas", amount: "12", preparation: "charred" },
      { name: "Quick pickled onions", amount: "1 cup" },
      { name: "Avocado", amount: "2", preparation: "blended with lime" },
    ],
    steps: [
      {
        id: "1",
        title: "Fry the cauliflower",
        instruction:
          "Dip florets in tempura batter and fry until crisp and golden. Drain on rack.",
        durationMinutes: 12,
      },
      {
        id: "2",
        title: "Make the firecracker glaze",
        instruction:
          "Simmer gochujang, honey, soy, and rice vinegar until syrupy. Toss with cauliflower.",
        durationMinutes: 6,
      },
      {
        id: "3",
        title: "Assemble tacos",
        instruction:
          "Spread avocado crema on tortillas, top with cauliflower, pickles, and cilantro.",
      },
    ],
    equipment: ["Deep skillet", "Wire rack", "Blender"],
    nutrition: {
      calories: 420,
      protein: 10,
      carbohydrates: 56,
      fat: 18,
      fiber: 8,
      sugar: 18,
      sodium: 780,
    },
    author: {
      name: "Diego Solis",
      avatarUrl:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      title: "Street Food Maestro",
    },
    relatedIds: ["spicy-tofu-lettuce-wraps"],
    sourceUrl: "https://foodiee.ai/recipes/firecracker-cauliflower-tacos",
  },
  {
    id: "summer-berry-fool",
    slug: "summer-berry-fool",
    title: "Honeyed Summer Berry Fool",
    description:
      "Layered macerated berries, honey whipped mascarpone, and almond crumble.",
    cuisine: "British",
    mealType: "Dessert",
    difficulty: "Easy",
    tags: ["No-bake", "Entertaining"],
    dietary: ["Vegetarian"],
    totalTimeMinutes: 15,
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    servings: 4,
    rating: 4.7,
    ratingCount: 143,
    favorite: false,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    createdAt: daysAgo(21),
    updatedAt: daysAgo(2),
    ingredients: [
      { name: "Mixed berries", amount: "4 cups", preparation: "sliced" },
      { name: "Honey", amount: "3 tbsp" },
      { name: "Mascarpone cheese", amount: "8 oz" },
      { name: "Heavy cream", amount: "1 cup" },
      { name: "Vanilla bean paste", amount: "1 tsp" },
      { name: "Almond cookies", amount: "1 cup", preparation: "crushed" },
      { name: "Fresh mint", amount: "for garnish" },
    ],
    steps: [
      {
        id: "1",
        title: "Macerate the berries",
        instruction:
          "Toss berries with honey and a pinch of salt. Let sit 10 minutes until juicy.",
      },
      {
        id: "2",
        title: "Whip the mascarpone",
        instruction:
          "Beat mascarpone, cream, honey, and vanilla until light peaks form.",
      },
      {
        id: "3",
        title: "Layer the fool",
        instruction:
          "Layer berries, cream, and almond crumble in glasses. Serve immediately.",
      },
    ],
    equipment: ["Stand mixer", "Mixing bowls"],
    nutrition: {
      calories: 360,
      protein: 6,
      carbohydrates: 38,
      fat: 20,
      fiber: 5,
      sugar: 28,
      sodium: 140,
    },
    author: {
      name: "Harper Collins",
      avatarUrl:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      title: "Dessert Editor",
    },
    relatedIds: ["orange-cardamom-french-toast"],
    sourceUrl: "https://foodiee.ai/recipes/summer-berry-fool",
  },
];

export const RECIPE_SUMMARY_MOCKS: RecipeSummary[] =
  RECIPE_LIBRARY_MOCKS.map(createSummary);

export const RECIPE_FACET_VALUES = {
  cuisines,
  mealTypes,
  dietaryTags,
  difficulties,
};

