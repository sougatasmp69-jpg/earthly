import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Fixed emission factors as specified in prompt
const EMISSION_FACTORS = {
  car: 0.20,         // 0.20 kg CO2/km
  bus: 0.08,         // 0.08 kg CO2/km
  flight: 0.25,      // 0.25 kg CO2/km
  electricity: 0.80, // 0.80 kg CO2/kWh
  veg_meal: 0.50,    // 0.50 kg CO2/meal
  non_veg_meal: 2.00 // 2.00 kg CO2/meal
};

const CATEGORY_NAMES = {
  car: 'Car travel',
  bus: 'Bus travel',
  flight: 'Flight',
  electricity: 'Electricity',
  veg_meal: 'Veg meal',
  non_veg_meal: 'Non-veg meal'
};

const MAX_LIMITS = {
  car: 2500,
  bus: 1500,
  flight: 25000,
  electricity: 2000,
  veg_meal: 15,
  non_veg_meal: 15
};

const SOFT_WARNINGS = {
  car: 350,
  bus: 200,
  flight: 4000,
  electricity: 60,
  veg_meal: 5,
  non_veg_meal: 5
};

// Password Hashing Helpers
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function normalizePhoneNumber(phone) {
  return (phone || '').replace(/\D/g, '');
}

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(date.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------- AI DIET PLAN ENGINE ----------------
function generateAIDietPlan({ name, heightCm, weightKg, dietPreference = 'vegetarian', fitnessGoal = 'eco_wellness' }) {
  const h = Number(heightCm) || 175;
  const w = Number(weightKg) || 68;
  const heightM = h / 100;
  const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;

  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obese';

  // Mifflin-St Jeor Formula (approximated for gender-neutral normalized wellness)
  const bmr = Math.round(10 * w + 6.25 * h - 5 * 28 + 5);
  const tdee = Math.round(bmr * 1.375); // moderate activity factor

  let targetCalories = tdee;
  if (fitnessGoal === 'weight_loss') {
    targetCalories = Math.max(1300, Math.round(tdee * 0.82));
  } else if (fitnessGoal === 'muscle_gain') {
    targetCalories = Math.round(tdee * 1.15);
  } else if (fitnessGoal === 'eco_wellness' || fitnessGoal === 'maintain') {
    targetCalories = tdee;
  }

  // Macronutrient calculation
  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatsRatio = 0.25;

  if (fitnessGoal === 'muscle_gain') {
    proteinRatio = 0.30;
    carbsRatio = 0.45;
    fatsRatio = 0.25;
  } else if (dietPreference === 'low_carb') {
    proteinRatio = 0.30;
    carbsRatio = 0.30;
    fatsRatio = 0.40;
  }

  const proteinG = Math.round((targetCalories * proteinRatio) / 4);
  const carbsG = Math.round((targetCalories * carbsRatio) / 4);
  const fatsG = Math.round((targetCalories * fatsRatio) / 9);

  const hydrationTargetLiters = Math.round((w * 0.035) * 10) / 10;

  // Recipe catalog based on preference
  const recipes = {
    breakfast: {
      vegetarian: {
        name: 'Organic Rolled Oats & Chia Superfood Bowl',
        title: 'High-Fiber Antioxidant Breakfast',
        description: 'Warm steel-cut oats simmered in unsweetened oat milk, topped with chia seeds, wild blueberries, crushed walnuts, and a drizzle of organic maple.',
        portion: '1 medium bowl (320g)',
        calories: Math.round(targetCalories * 0.26),
        proteinG: Math.round(proteinG * 0.22),
        carbsG: Math.round(carbsG * 0.32),
        fatsG: Math.round(fatsG * 0.24),
        ecoScore: 'A+',
        carbonKg: 0.18,
        ingredients: ['Rolled Oats', 'Oat Milk', 'Chia Seeds', 'Wild Blueberries', 'Raw Walnuts'],
        tips: 'Rich in beta-glucan fiber to regulate glucose and sustain morning mental clarity.'
      },
      vegan: {
        name: 'Turmeric Tofu Scramble & Avocado Toast',
        title: 'Plant Protein & Healthy Fats',
        description: 'Pan-seared sprouted organic tofu seasoned with turmeric, nutritional yeast, and baby spinach served atop whole-grain artisan sourdough with sliced avocado.',
        portion: '1 plate (300g)',
        calories: Math.round(targetCalories * 0.27),
        proteinG: Math.round(proteinG * 0.26),
        carbsG: Math.round(carbsG * 0.28),
        fatsG: Math.round(fatsG * 0.28),
        ecoScore: 'A+',
        carbonKg: 0.22,
        ingredients: ['Sprouted Tofu', 'Baby Spinach', 'Sourdough Bread', 'Avocado', 'Nutritional Yeast'],
        tips: 'Sprouted tofu provides complete bioavailable amino acids with minimal carbon footprint.'
      },
      omnivore: {
        name: 'Pasture-Raised Poached Eggs & Wilted Greens',
        title: 'Nutrient-Dense Morning Fuel',
        description: 'Two poached pasture-raised eggs served over garlic-sauteed baby kale and roasted cherry tomatoes on sprouted grain toast.',
        portion: '1 plate (280g)',
        calories: Math.round(targetCalories * 0.26),
        proteinG: Math.round(proteinG * 0.28),
        carbsG: Math.round(carbsG * 0.24),
        fatsG: Math.round(fatsG * 0.28),
        ecoScore: 'A',
        carbonKg: 0.38,
        ingredients: ['Pasture Eggs', 'Baby Kale', 'Cherry Tomatoes', 'Sprouted Grain Toast', 'Extra Virgin Olive Oil'],
        tips: 'Eggs from local farms reduce transit emissions while delivering lutein and choline.'
      },
      pescatarian: {
        name: 'Smoked Salmon & Herbed Cashew Cream Crisp',
        title: 'Omega-3 Rich Marine Breakfast',
        description: 'Wild Alaskan sockeye salmon slices over seeded rye crispbread with fermented cashew cream, capers, fresh dill, and cucumber ribbons.',
        portion: '1 plate (250g)',
        calories: Math.round(targetCalories * 0.27),
        proteinG: Math.round(proteinG * 0.30),
        carbsG: Math.round(carbsG * 0.22),
        fatsG: Math.round(fatsG * 0.26),
        ecoScore: 'A',
        carbonKg: 0.42,
        ingredients: ['Wild Salmon', 'Rye Crispbread', 'Cashew Cream', 'Fresh Dill', 'Cucumbers'],
        tips: 'Marine omega-3 fatty acids EPA & DHA support cardiovascular and cellular resilience.'
      },
      low_carb: {
        name: 'Avocado & Hemp Seed Green Power Bowl',
        title: 'Ketogenic Clean Energy Start',
        description: 'Fresh sliced Haas avocado, toasted hemp hearts, roasted pumpkin seeds, and steamed asparagus spears tossed in cold-pressed olive oil.',
        portion: '1 bowl (260g)',
        calories: Math.round(targetCalories * 0.25),
        proteinG: Math.round(proteinG * 0.24),
        carbsG: Math.round(carbsG * 0.16),
        fatsG: Math.round(fatsG * 0.38),
        ecoScore: 'A+',
        carbonKg: 0.19,
        ingredients: ['Haas Avocado', 'Hemp Hearts', 'Pumpkin Seeds', 'Asparagus', 'Cold-Pressed Olive Oil'],
        tips: 'High healthy fat density promotes steady metabolic ketosis without energy dips.'
      }
    },
    morningSnack: {
      name: 'Raw California Walnuts & Honeycrisp Apple Slices',
      title: 'Brain-Boosting Morning Refuel',
      description: 'Handful of unsalted raw walnuts paired with crisp, locally harvested organic apple slices sprinkled with Ceylon cinnamon.',
      portion: '1 serving (140g)',
      calories: Math.round(targetCalories * 0.10),
      proteinG: Math.round(proteinG * 0.08),
      carbsG: Math.round(carbsG * 0.12),
      fatsG: Math.round(fatsG * 0.12),
      ecoScore: 'A+',
      carbonKg: 0.08,
      ingredients: ['Raw Walnuts', 'Organic Apple', 'Ceylon Cinnamon'],
      tips: 'Polyphenols in apple peels protect gut microbiota and dampen mid-morning oxidative stress.'
    },
    lunch: {
      vegetarian: {
        name: 'Mediterranean Quinoa & Spiced Chickpea Buddha Bowl',
        title: 'Complete Plant Protein & Micro-Nutrients',
        description: 'Fluffy tri-color quinoa, paprika-roasted chickpeas, diced Persian cucumbers, Kalamata olives, shredded red cabbage, and lemon-tahini dressing.',
        portion: '1 large bowl (380g)',
        calories: Math.round(targetCalories * 0.32),
        proteinG: Math.round(proteinG * 0.32),
        carbsG: Math.round(carbsG * 0.34),
        fatsG: Math.round(fatsG * 0.28),
        ecoScore: 'A+',
        carbonKg: 0.26,
        ingredients: ['Tri-Color Quinoa', 'Chickpeas', 'Tahini', 'Cucumbers', 'Kalamata Olives', 'Red Cabbage'],
        tips: 'Quinoa + chickpeas provide all 9 essential amino acids in a 100% zero-slaughter meal.'
      },
      vegan: {
        name: 'Golden Lentil & Sweet Potato Coconut Curry',
        title: 'Ayurvedic Anti-Inflammatory Lunch',
        description: 'Simmered yellow split lentils, tender Japanese sweet potatoes, and organic coconut milk infused with fresh ginger, garlic, turmeric, served with brown basmati.',
        portion: '1 deep bowl (400g)',
        calories: Math.round(targetCalories * 0.33),
        proteinG: Math.round(proteinG * 0.30),
        carbsG: Math.round(carbsG * 0.36),
        fatsG: Math.round(fatsG * 0.26),
        ecoScore: 'A+',
        carbonKg: 0.24,
        ingredients: ['Yellow Lentils', 'Sweet Potato', 'Coconut Milk', 'Turmeric', 'Brown Basmati Rice'],
        tips: 'Curcumin combined with healthy lipids enhances anti-inflammatory systemic absorption.'
      },
      omnivore: {
        name: 'Grilled Free-Range Herb Chicken & Roasted Sweet Potato',
        title: 'Lean Protein & Complex Carbs',
        description: 'Marinated rosemary chicken breast with roasted thyme sweet potatoes, steamed broccolini, and a light balsamic reduction.',
        portion: '1 plate (360g)',
        calories: Math.round(targetCalories * 0.33),
        proteinG: Math.round(proteinG * 0.38),
        carbsG: Math.round(carbsG * 0.28),
        fatsG: Math.round(fatsG * 0.24),
        ecoScore: 'B',
        carbonKg: 0.65,
        ingredients: ['Free-Range Chicken Breast', 'Sweet Potatoes', 'Broccolini', 'Rosemary & Garlic', 'Balsamic'],
        tips: 'Choosing free-range chicken over beef slashes the meal carbon footprint by over 75%.'
      },
      pescatarian: {
        name: 'Seared Wild Cod & Lemon-Herb Bulgur Pilaf',
        title: 'Low-Toxin Clean Ocean Protein',
        description: 'Pan-roasted Atlantic cod fillet seasoned with sea salt and cracked pepper over warm herb-infused bulgur wheat and shaved fennel salad.',
        portion: '1 plate (350g)',
        calories: Math.round(targetCalories * 0.32),
        proteinG: Math.round(proteinG * 0.36),
        carbsG: Math.round(carbsG * 0.30),
        fatsG: Math.round(fatsG * 0.22),
        ecoScore: 'A',
        carbonKg: 0.44,
        ingredients: ['Wild Cod', 'Bulgur Wheat', 'Fennel', 'Meyer Lemon', 'Parsley'],
        tips: 'Cod is an exceptionally lean protein source with low bio-accumulative heavy metals.'
      },
      low_carb: {
        name: 'Zucchini Noodle Bowl with Pesto & Grilled Halloumi',
        title: 'High-Fat Mediterranean Energy',
        description: 'Spiralized fresh zucchini ribbons tossed in homemade pine nut and basil pesto, topped with golden-seared halloumi cheese and sun-dried tomatoes.',
        portion: '1 bowl (320g)',
        calories: Math.round(targetCalories * 0.32),
        proteinG: Math.round(proteinG * 0.30),
        carbsG: Math.round(carbsG * 0.16),
        fatsG: Math.round(fatsG * 0.42),
        ecoScore: 'A',
        carbonKg: 0.38,
        ingredients: ['Zucchini', 'Basil Pesto', 'Pine Nuts', 'Halloumi Cheese', 'Sun-Dried Tomatoes'],
        tips: 'Zucchini ribbons provide volume and micronutrients with near-zero glycemic impact.'
      }
    },
    afternoonSnack: {
      name: 'Steamed Edamame with Coarse Sea Salt & Matcha Tea',
      title: 'Afternoon Focus & Clean Protein',
      description: 'Fresh organic edamame pods lightly steamed with flaky Celtic sea salt, served alongside antioxidant-rich Japanese ceremonial matcha.',
      portion: '1 bowl (160g)',
      calories: Math.round(targetCalories * 0.09),
      proteinG: Math.round(proteinG * 0.10),
      carbsG: Math.round(carbsG * 0.08),
      fatsG: Math.round(fatsG * 0.08),
      ecoScore: 'A+',
      carbonKg: 0.09,
      ingredients: ['Edamame Pods', 'Flaky Sea Salt', 'Ceremonial Matcha'],
      tips: 'L-theanine in matcha works synergistically with natural amino acids to sharpen mental focus.'
    },
    dinner: {
      vegetarian: {
        name: 'Crispy Sesame Tempeh & Wok-Tossed Rainbow Greens',
        title: 'Probiotic Fermented Protein Feast',
        description: 'Pan-crisped organic soy tempeh glazed in low-sodium tamari and toasted sesame oil, served over wok-seared bok choy, bell peppers, snap peas, and black wild rice.',
        portion: '1 large plate (390g)',
        calories: Math.round(targetCalories * 0.23),
        proteinG: Math.round(proteinG * 0.28),
        carbsG: Math.round(carbsG * 0.24),
        fatsG: Math.round(fatsG * 0.28),
        ecoScore: 'A+',
        carbonKg: 0.28,
        ingredients: ['Organic Tempeh', 'Bok Choy', 'Black Wild Rice', 'Snap Peas', 'Tamari & Sesame'],
        tips: 'Fermented tempeh provides intact gut probiotics and gentle nighttime digestibility.'
      },
      vegan: {
        name: 'Moroccan Chickpea & Roasted Vegetable Tagine',
        title: 'Warm Spiced Slow-Simmered Comfort',
        description: 'Slow-cooked stew of chickpeas, butternut squash, zucchini, and dried apricots in a fragrant cumin-coriander broth, served with whole-wheat couscous.',
        portion: '1 large bowl (400g)',
        calories: Math.round(targetCalories * 0.23),
        proteinG: Math.round(proteinG * 0.26),
        carbsG: Math.round(carbsG * 0.28),
        fatsG: Math.round(fatsG * 0.26),
        ecoScore: 'A+',
        carbonKg: 0.25,
        ingredients: ['Chickpeas', 'Butternut Squash', 'Zucchini', 'Apricots', 'Whole-Wheat Couscous'],
        tips: 'Slow-simmered spices stimulate thermogenesis and ease digestive transit before sleep.'
      },
      omnivore: {
        name: 'Wild Salmon Fillet with Steamed Asparagus & Quinoa',
        title: 'Cardio-Protective Clean Seafood Dinner',
        description: 'Pan-seared Alaskan wild salmon topped with dill butter, served with grilled asparagus spears and warm lemon parsley quinoa.',
        portion: '1 plate (350g)',
        calories: Math.round(targetCalories * 0.23),
        proteinG: Math.round(proteinG * 0.30),
        carbsG: Math.round(carbsG * 0.22),
        fatsG: Math.round(fatsG * 0.28),
        ecoScore: 'A',
        carbonKg: 0.48,
        ingredients: ['Wild Alaskan Salmon', 'Asparagus', 'Lemon Quinoa', 'Fresh Dill', 'Cold Pressed Olive Oil'],
        tips: 'High EPA/DHA fatty acids lower nocturnal inflammation and promote deep restorative sleep.'
      },
      pescatarian: {
        name: 'Seared Sea Scallops with Cauliflower Puree & Truffle Oil',
        title: 'Gourmet Low-Carbon Coastal Dinner',
        description: 'Golden pan-seared sea scallops served over velvet garlic cauliflower puree with roasted chanterelle mushrooms and a drizzle of white truffle oil.',
        portion: '1 plate (320g)',
        calories: Math.round(targetCalories * 0.23),
        proteinG: Math.round(proteinG * 0.28),
        carbsG: Math.round(carbsG * 0.18),
        fatsG: Math.round(fatsG * 0.30),
        ecoScore: 'A',
        carbonKg: 0.45,
        ingredients: ['Sea Scallops', 'Cauliflower', 'Chanterelle Mushrooms', 'Truffle Oil', 'Garlic'],
        tips: 'Bivalves and mollusks have the lowest ecological footprint among all seafood varieties.'
      },
      low_carb: {
        name: 'Herb-Crusted Tofu & Roasted Broccoli Steaks with Tahini',
        title: 'Metabolic Detox & Low Glycemic Load',
        description: 'Extra-firm herb-crusted tofu cutlets baked until crispy, served with char-grilled broccoli steaks and creamy toasted garlic tahini sauce.',
        portion: '1 plate (340g)',
        calories: Math.round(targetCalories * 0.23),
        proteinG: Math.round(proteinG * 0.28),
        carbsG: Math.round(carbsG * 0.14),
        fatsG: Math.round(fatsG * 0.38),
        ecoScore: 'A+',
        carbonKg: 0.21,
        ingredients: ['Extra Firm Tofu', 'Broccoli Steaks', 'Toasted Tahini', 'Garlic', 'Rosemary'],
        tips: 'Sulforaphane from charred broccoli assists phase II hepatic detoxification.'
      }
    }
  };

  const prefKey = recipes.breakfast[dietPreference] ? dietPreference : 'vegetarian';
  const breakfast = { ...recipes.breakfast[prefKey], id: `meal-b-${Date.now()}`, category: 'breakfast' };
  const morningSnack = { ...recipes.morningSnack, id: `meal-ms-${Date.now()}`, category: 'morning_snack' };
  const lunch = { ...recipes.lunch[prefKey], id: `meal-l-${Date.now()}`, category: 'lunch' };
  const afternoonSnack = { ...recipes.afternoonSnack, id: `meal-as-${Date.now()}`, category: 'afternoon_snack' };
  const dinner = { ...recipes.dinner[prefKey], id: `meal-d-${Date.now()}`, category: 'dinner' };

  const totalDailyCarbonKg = Math.round((breakfast.carbonKg + morningSnack.carbonKg + lunch.carbonKg + afternoonSnack.carbonKg + dinner.carbonKg) * 100) / 100;
  const standardDietDailyKg = 3.65; // Average Western diet carbon footprint
  const ecoSavingsPct = Math.round(((standardDietDailyKg - totalDailyCarbonKg) / standardDietDailyKg) * 100);

  const weeklyOverview = [
    { day: 'Monday', focus: 'Plant-Forward Foundation', calorieTarget: targetCalories, highlight: 'Quinoa & Lentil Power Bowl', ecoTip: 'Cutting red meat today saves ~4.2 kg CO₂.' },
    { day: 'Tuesday', focus: 'Metabolic & Fiber Boost', calorieTarget: targetCalories, highlight: 'Tempeh Stir-Fry & Steamed Greens', ecoTip: 'Fermented proteins nurture microbiome diversity.' },
    { day: 'Wednesday', focus: 'Antioxidant & Recovery', calorieTarget: targetCalories, highlight: 'Berry & Walnut Superfood Mix', ecoTip: 'Locally grown berries have 60% lower transit emissions.' },
    { day: 'Thursday', focus: 'Clean Lean Nutrition', calorieTarget: targetCalories, highlight: 'Golden Sweet Potato Dal', ecoTip: 'Root vegetables require minimal irrigation.' },
    { day: 'Friday', focus: 'Sustained Vitality', calorieTarget: targetCalories, highlight: 'Mediterranean Chickpea Platter', ecoTip: 'Plant legumes naturally fix nitrogen into soils.' },
    { day: 'Saturday', focus: 'Mindful Seasonal Dining', calorieTarget: Math.round(targetCalories * 1.05), highlight: 'Chef Wild Harvest Medley', ecoTip: 'Dining seasonally reduces cold-storage emissions.' },
    { day: 'Sunday', focus: 'Digestive Reset & Meal Prep', calorieTarget: Math.round(targetCalories * 0.95), highlight: 'Hydrating Green Detox Soup', ecoTip: 'Batch cooking lowers kitchen energy consumption by 35%.' }
  ];

  return {
    id: `diet-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    generatedAt: new Date().toISOString(),
    bmi,
    bmiCategory,
    bmrCalories: bmr,
    tdeeCalories: tdee,
    targetCalories,
    macroSplit: {
      proteinG,
      proteinPct: Math.round(proteinRatio * 100),
      carbsG,
      carbsPct: Math.round(carbsRatio * 100),
      fatsG,
      fatsPct: Math.round(fatsRatio * 100)
    },
    hydrationTargetLiters,
    meals: {
      breakfast,
      morningSnack,
      lunch,
      afternoonSnack,
      dinner
    },
    weeklyOverview,
    ecoFootprintDailyKg: totalDailyCarbonKg,
    ecoSavingsPct,
    ecoTip: `By following this ${dietPreference} plan, your daily food emissions are only ${totalDailyCarbonKg} kg CO₂/day — ${ecoSavingsPct}% lower than the national benchmark!`,
    disclaimer: 'This diet plan is an AI-generated general wellness suggestion based on user-provided metrics and is not professional medical, nutritional, or clinical advice. Consult a licensed healthcare provider or registered dietitian before making significant dietary changes.'
  };
}

// ---------------- AI FITNESS ACTIVITY PLAN ENGINE ----------------
function generateAIFitnessPlan({ name, heightCm, weightKg, fitnessGoal = 'eco_wellness' }) {
  const h = Number(heightCm) || 175;
  const w = Number(weightKg) || 68;
  const heightM = h / 100;
  const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;

  let bmiCategory = 'Normal weight';
  let isHigherWeight = false;
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Overweight';
    isHigherWeight = true;
  } else if (bmi >= 30) {
    bmiCategory = 'Obese';
    isHigherWeight = true;
  }

  // Determine fitness level and frequency
  let fitnessLevel = 'Beginner / Moderate Intensity';
  let recommendedDaysPerWeek = 4;
  if (isHigherWeight) {
    fitnessLevel = 'Beginner Friendly / Joint-Safe Low Impact';
    recommendedDaysPerWeek = 4;
  } else if (fitnessGoal === 'muscle_gain') {
    fitnessLevel = 'Progressive Functional Calisthenics';
    recommendedDaysPerWeek = 5;
  } else if (fitnessGoal === 'weight_loss') {
    fitnessLevel = 'Aerobic Metabolic Conditioning & Active Steps';
    recommendedDaysPerWeek = 5;
  }

  // Weight-adaptive routines
  const schedule = [
    {
      day: 'Monday',
      focusTitle: isHigherWeight ? 'Low-Impact Brisk Walk & Postural Reset' : 'Morning Tempo Brisk Walk & Core Warmup',
      isRestDay: false,
      totalDurationMinutes: isHigherWeight ? 30 : 35,
      estimatedCalorieBurn: Math.round(w * 0.055 * 30),
      routine: [
        {
          id: `ex-mon-1-${Date.now()}`,
          name: isHigherWeight ? 'Brisk Flat-Ground Walking' : 'Brisk Cadence Walking & Light Jog Intervals',
          category: 'cardio',
          durationMinutes: 25,
          intensity: 'Moderate',
          targetHeartRate: '110-130 bpm (Conversational pace)',
          estimatedCalorieBurn: Math.round(w * 0.05 * 25),
          description: isHigherWeight 
            ? 'Smooth, continuous rhythmic walking on a flat surface or track with natural arm swing to protect knees and ankles.'
            : 'Comfortable steady-paced walking with 30-second light jog intervals every 5 minutes.',
          equipmentNeeded: 'Comfortable supportive walking shoes',
          warmup: '2 minutes of ankle circles, hip openers, and slow gentle pacing.',
          cooldown: '3 minutes of slow walking and standing calf/quad stretches.',
          safetyTip: 'Maintain upright posture; avoid leaning forward to minimize lower back pressure.'
        },
        {
          id: `ex-mon-2-${Date.now()}`,
          name: 'Standing Core & Pelvic Alignment',
          category: 'strength',
          durationMinutes: isHigherWeight ? 5 : 10,
          intensity: 'Low',
          targetHeartRate: '95-110 bpm',
          estimatedCalorieBurn: Math.round(w * 0.035 * 10),
          description: 'Controlled standing pelvic tilts, abdominal bracing, and gentle high-knee march holds.',
          equipmentNeeded: 'None (wall or chair for light balance support)',
          warmup: 'Side-to-side gentle torso rotations.',
          cooldown: 'Slow deep diaphragm breathing.',
          safetyTip: 'Engage core gently without holding your breath.'
        }
      ],
      wellnessNote: 'Hydrate with at least 500ml of water throughout the morning.'
    },
    {
      day: 'Tuesday',
      focusTitle: isHigherWeight ? 'Joint-Friendly Bodyweight Stability' : 'Functional Lower Body & Core Strength',
      isRestDay: false,
      totalDurationMinutes: isHigherWeight ? 25 : 30,
      estimatedCalorieBurn: Math.round(w * 0.06 * 25),
      routine: [
        {
          id: `ex-tue-1-${Date.now()}`,
          name: isHigherWeight ? 'Chair Squats & Wall Push-Ups' : 'Bodyweight Air Squats & Incline Push-Ups',
          category: 'strength',
          durationMinutes: 15,
          intensity: 'Moderate',
          targetHeartRate: '115-135 bpm',
          estimatedCalorieBurn: Math.round(w * 0.055 * 15),
          description: isHigherWeight
            ? '3 sets of 8 chair squats (sitting back onto a sturdy chair and standing up smoothly) + 10 wall push-ups.'
            : '3 sets of 12 full air squats + 10 incline push-ups + 20-second plank hold.',
          equipmentNeeded: 'Sturdy chair or stable wall',
          warmup: 'Arm swings and unweighted knee lifts for 2 minutes.',
          cooldown: 'Seated hamstring stretch and chest opening stretch.',
          safetyTip: 'Ensure knees stay aligned over your second toe; do not let knees collapse inward.'
        },
        {
          id: `ex-tue-2-${Date.now()}`,
          name: 'Glute Bridges & Seated Spinal Twist',
          category: 'mobility',
          durationMinutes: 10,
          intensity: 'Low',
          targetHeartRate: '90-105 bpm',
          estimatedCalorieBurn: Math.round(w * 0.035 * 10),
          description: 'Lying on a soft yoga mat, press through heels to raise hips into bridge (2 sets of 10 reps), followed by seated spine twists.',
          equipmentNeeded: 'Yoga mat or carpet',
          warmup: 'Cat-Cow stretch on hands and knees.',
          cooldown: 'Child’s pose hold for 60 seconds.',
          safetyTip: 'Squeeze glutes at the top of the bridge without arching your lower back excessively.'
        }
      ],
      wellnessNote: 'Muscle recovery takes 24-48 hours; prioritize quality protein at lunch.'
    },
    {
      day: 'Wednesday',
      focusTitle: 'Active Recovery & Mindful Mobility',
      isRestDay: true,
      totalDurationMinutes: 20,
      estimatedCalorieBurn: Math.round(w * 0.03 * 20),
      routine: [
        {
          id: `ex-wed-1-${Date.now()}`,
          name: 'Gentle Restorative Flow & Neck/Shoulder Release',
          category: 'mobility',
          durationMinutes: 20,
          intensity: 'Low',
          targetHeartRate: '85-100 bpm',
          estimatedCalorieBurn: Math.round(w * 0.03 * 20),
          description: 'A soothing sequence of neck rolls, shoulder shrugs, seated side bends, and 10 minutes of easy strolling outdoors.',
          equipmentNeeded: 'Yoga mat (optional)',
          warmup: 'Deep diaphragmatic breathing in a comfortable seated position.',
          cooldown: 'Lying supine hamstring stretch with towel support.',
          safetyTip: 'Never bounce in a stretch; hold each position gently for 20-30 seconds.'
        }
      ],
      wellnessNote: 'Rest days allow muscle tissue to rebuild stronger and reduce cortisol levels.'
    },
    {
      day: 'Thursday',
      focusTitle: isHigherWeight ? 'Low-Impact Cycling or Stationary Aerobics' : 'Tempo Cardio & Interval Walk',
      isRestDay: false,
      totalDurationMinutes: 30,
      estimatedCalorieBurn: Math.round(w * 0.065 * 30),
      routine: [
        {
          id: `ex-thu-1-${Date.now()}`,
          name: isHigherWeight ? 'Low-Resistance Stationary Cycling or Pool Walking' : 'Brisk Outdoor Cycling or Incline Walk',
          category: 'cardio',
          durationMinutes: 25,
          intensity: 'Moderate',
          targetHeartRate: '115-135 bpm',
          estimatedCalorieBurn: Math.round(w * 0.065 * 25),
          description: isHigherWeight
            ? 'Smooth continuous pedal stroke with low flywheel resistance to protect patellar tendons, maintaining steady breathing.'
            : 'Moderate paced cycling on flat/rolling terrain or a 3-degree treadmill incline walk.',
          equipmentNeeded: 'Stationary bike, outdoor cycle, or walking path',
          warmup: '3 minutes of zero-resistance gentle pedaling or casual walking.',
          cooldown: '2 minutes of easy pacing and standing quad stretches.',
          safetyTip: 'Adjust saddle height so your knee has a slight 10-15 degree bend at the bottom of the stroke.'
        },
        {
          id: `ex-thu-2-${Date.now()}`,
          name: 'Standing Calf Raises & Ankle Mobility',
          category: 'strength',
          durationMinutes: 5,
          intensity: 'Low',
          targetHeartRate: '95-105 bpm',
          estimatedCalorieBurn: Math.round(w * 0.035 * 5),
          description: '2 sets of 12 controlled calf raises standing on flat ground, holding a counter for balance.',
          equipmentNeeded: 'None',
          warmup: 'Ankle rotations.',
          cooldown: 'Calf stretch against the wall.',
          safetyTip: 'Raise and lower on a 2-second count for maximum tendon adaptation.'
        }
      ],
      wellnessNote: 'Endurance workouts boost capillary density and mitochondria function.'
    },
    {
      day: 'Friday',
      focusTitle: isHigherWeight ? 'Upper Body & Postural Strengthening' : 'Full Body Calisthenics Circuit',
      isRestDay: false,
      totalDurationMinutes: 25,
      estimatedCalorieBurn: Math.round(w * 0.055 * 25),
      routine: [
        {
          id: `ex-fri-1-${Date.now()}`,
          name: isHigherWeight ? 'Seated Resistance Rows & Wall Angels' : 'Doorframe Rows, Push-Ups & Step-Ups',
          category: 'strength',
          durationMinutes: 15,
          intensity: 'Moderate',
          targetHeartRate: '110-130 bpm',
          estimatedCalorieBurn: Math.round(w * 0.055 * 15),
          description: isHigherWeight
            ? 'Using light resistance bands or water bottles, perform 3 sets of 10 seated rows + 8 wall angels to strengthen upper back and neck.'
            : '3 rounds of 10 doorframe rows, 8 push-ups, and 10 alternating step-ups on a sturdy step.',
          equipmentNeeded: 'Light resistance band or two 1-liter water bottles',
          warmup: 'Arm circles and torso twists for 2 minutes.',
          cooldown: 'Chest doorway stretch and upper back stretch.',
          safetyTip: 'Keep shoulders pulled down and back away from your ears.'
        },
        {
          id: `ex-fri-2-${Date.now()}`,
          name: 'Core Bracing & Deadbugs',
          category: 'strength',
          durationMinutes: 10,
          intensity: 'Low',
          targetHeartRate: '95-110 bpm',
          estimatedCalorieBurn: Math.round(w * 0.04 * 10),
          description: 'Lying on back, alternate extending opposite arm and leg while pressing lower back flat into the floor (2 sets of 8 reps per side).',
          equipmentNeeded: 'Yoga mat',
          warmup: 'Pelvic tilts.',
          cooldown: 'Full body pencil stretch on mat.',
          safetyTip: 'If your lower back arches off the mat, reduce the range of motion of your legs.'
        }
      ],
      wellnessNote: 'Consistent core strength prevents lower back fatigue during daily work.'
    },
    {
      day: 'Saturday',
      focusTitle: 'Eco-Commute Nature Walk or Green Exploration',
      isRestDay: false,
      totalDurationMinutes: isHigherWeight ? 35 : 45,
      estimatedCalorieBurn: Math.round(w * 0.05 * (isHigherWeight ? 35 : 45)),
      routine: [
        {
          id: `ex-sat-1-${Date.now()}`,
          name: 'Nature Trail Walk / Low-Carbon Transit Stroll',
          category: 'cardio',
          durationMinutes: isHigherWeight ? 35 : 45,
          intensity: 'Moderate',
          targetHeartRate: '110-125 bpm',
          estimatedCalorieBurn: Math.round(w * 0.05 * (isHigherWeight ? 35 : 45)),
          description: 'Continuous relaxed outdoor walk in a local park, greenway, or walking errand, taking in natural sunlight and fresh air.',
          equipmentNeeded: 'Walking shoes & water bottle',
          warmup: '3 minutes of slow pacing.',
          cooldown: 'Gentle standing quad and hamstring stretches.',
          safetyTip: 'Stay on established paths and wear sunscreen for outdoor sessions.'
        }
      ],
      wellnessNote: 'Exercising in green outdoor spaces reduces stress biomarkers by up to 28%.'
    },
    {
      day: 'Sunday',
      focusTitle: 'Full Body Restorative Yoga & Sleep Prep',
      isRestDay: true,
      totalDurationMinutes: 20,
      estimatedCalorieBurn: Math.round(w * 0.03 * 20),
      routine: [
        {
          id: `ex-sun-1-${Date.now()}`,
          name: 'Gentle Evening Yoga & Diaphragmatic Breathwork',
          category: 'flexibility',
          durationMinutes: 20,
          intensity: 'Low',
          targetHeartRate: '80-95 bpm',
          estimatedCalorieBurn: Math.round(w * 0.03 * 20),
          description: 'Gentle seated forward fold, butterfly pose, legs-up-the-wall pose (5 minutes), and 5 minutes of 4-7-8 relaxing breathing.',
          equipmentNeeded: 'Yoga mat & comfortable loose clothing',
          warmup: 'Gentle neck and shoulder rolls.',
          cooldown: 'Savasana relaxation pose.',
          safetyTip: 'Focus on slow nasal breathing; allow muscles to release without tension.'
        }
      ],
      wellnessNote: 'Good sleep tonight establishes positive metabolic rhythm for the coming week.'
    }
  ];

  const weeklyCalorieBurnEstimate = schedule.reduce((acc, d) => acc + d.estimatedCalorieBurn, 0);

  const weeklyMilestones = [
    `Complete at least ${recommendedDaysPerWeek} planned activity sessions this week.`,
    `Accumulate a minimum of ${isHigherWeight ? '120' : '150'} active movement minutes across the 7 days.`,
    `Burn an estimated ${weeklyCalorieBurnEstimate} active kcal while maintaining safe joint alignment.`
  ];

  const introSummary = `Based on your current weight (${w} kg, BMI ${bmi}), here's a personalized, beginner-safe weekly activity plan to help you build functional fitness and stamina.`;

  return {
    id: `actplan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    generatedAt: new Date().toISOString(),
    weightKg: w,
    heightCm: h,
    bmi,
    bmiCategory,
    fitnessLevel,
    recommendedDaysPerWeek,
    weeklyCalorieBurnEstimate,
    introSummary,
    schedule,
    weeklyMilestones,
    disclaimer: 'This is an AI-generated suggestion, not medical advice. Consult a professional before starting any new fitness routine, especially if you have existing health conditions.'
  };
}

// ---------------- REMINDER / ALARM SETTINGS HELPER ----------------
function getDefaultReminderSettings() {
  return {
    globalEnabled: true,
    soundEnabled: true,
    browserNotificationsEnabled: false,
    reminders: {
      breakfast: {
        id: 'breakfast',
        label: 'Breakfast Reminder',
        time: '08:00',
        enabled: true,
        soundEnabled: true,
        description: 'Morning sustenance & hydration'
      },
      morning_snack: {
        id: 'morning_snack',
        label: 'Mid-Morning Snack',
        time: '10:30',
        enabled: true,
        soundEnabled: true,
        description: 'Focus boost & healthy fats'
      },
      lunch: {
        id: 'lunch',
        label: 'Lunch Reminder',
        time: '13:00',
        enabled: true,
        soundEnabled: true,
        description: 'Core midday metabolic fuel'
      },
      afternoon_snack: {
        id: 'afternoon_snack',
        label: 'Afternoon Snack',
        time: '16:30',
        enabled: true,
        soundEnabled: true,
        description: 'Clean energy refuel'
      },
      dinner: {
        id: 'dinner',
        label: 'Dinner Reminder',
        time: '20:00',
        enabled: true,
        soundEnabled: true,
        description: 'Restorative evening meal'
      },
      activity: {
        id: 'activity',
        label: 'Fitness Activity Session',
        time: '18:30',
        enabled: true,
        soundEnabled: true,
        description: 'Scheduled movement & exercise routine'
      }
    },
    lastFiredMap: {}
  };
}

const DEMO_USER_ID = 'usr-alex-01';
const DEMO_PHONE = '+1 (555) 019-2834';
const DEMO_NORMALIZED = normalizePhoneNumber(DEMO_PHONE);

function getInitialSeedData() {
  const monday = getMonday(new Date());

  const getOffset = (days) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + days);
    return formatDate(d);
  };

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('earthly123', salt);

  const initialDietPlan = generateAIDietPlan({
    name: 'Alex Morgan',
    heightCm: 175,
    weightKg: 68,
    dietPreference: 'vegetarian',
    fitnessGoal: 'eco_wellness'
  });

  const initialActivityPlan = generateAIFitnessPlan({
    name: 'Alex Morgan',
    heightCm: 175,
    weightKg: 68,
    fitnessGoal: 'eco_wellness'
  });

  const demoUser = {
    id: DEMO_USER_ID,
    phoneNumber: DEMO_PHONE,
    normalizedPhone: DEMO_NORMALIZED,
    name: 'Alex Morgan',
    heightCm: 175,
    weightKg: 68,
    heightUnit: 'cm',
    weightUnit: 'kg',
    dietPreference: 'vegetarian',
    fitnessGoal: 'eco_wellness',
    isProfileComplete: true,
    dietPlan: initialDietPlan,
    activityPlan: initialActivityPlan,
    reminderSettings: getDefaultReminderSettings(),
    passwordHash,
    salt,
    weeklyTargetKg: 50.0,
    createdAt: new Date().toISOString()
  };

  const seed = [
    { id: 'act-01', category: 'car', quantity: 24, date: getOffset(0), notes: 'Morning & evening commute' },
    { id: 'act-02', category: 'electricity', quantity: 14.5, date: getOffset(0), notes: 'Home power consumption' },
    { id: 'act-03', category: 'veg_meal', quantity: 2, date: getOffset(0), notes: 'Breakfast & lunch' },
    { id: 'act-04', category: 'non_veg_meal', quantity: 1, date: getOffset(0), notes: 'Salmon dinner' },
    { id: 'act-05', category: 'bus', quantity: 18, date: getOffset(1), notes: 'Metro & city bus transit' },
    { id: 'act-06', category: 'electricity', quantity: 12.0, date: getOffset(1), notes: 'Daily electricity' },
    { id: 'act-07', category: 'veg_meal', quantity: 3, date: getOffset(1), notes: 'Plant-based day' },
    { id: 'act-08', category: 'car', quantity: 32, date: getOffset(2), notes: 'Client meeting across town' },
    { id: 'act-09', category: 'electricity', quantity: 16.0, date: getOffset(2), notes: 'Laundry & workstations' },
    { id: 'act-10', category: 'non_veg_meal', quantity: 2, date: getOffset(2), notes: 'Chicken wrap & burger' },
    { id: 'act-11', category: 'bus', quantity: 12, date: getOffset(3), notes: 'Library commute' },
    { id: 'act-12', category: 'veg_meal', quantity: 2, date: getOffset(3), notes: 'Grain bowl & salad' },
    { id: 'act-13', category: 'electricity', quantity: 13.2, date: getOffset(3), notes: 'Standard home usage' },
    { id: 'act-14', category: 'flight', quantity: 120, date: getOffset(4), notes: 'Short regional flight' }
  ];

  const activities = seed.map(item => {
    const factor = EMISSION_FACTORS[item.category] || 0;
    const emissionsKg = Math.round(item.quantity * factor * 100) / 100;
    const unit = item.category === 'electricity' ? 'kWh' : item.category.includes('meal') ? 'meals' : 'km';
    return {
      id: item.id,
      userId: DEMO_USER_ID,
      category: item.category,
      quantity: item.quantity,
      unit,
      emissionsKg,
      date: item.date,
      notes: item.notes,
      createdAt: new Date().toISOString()
    };
  });

  return {
    users: [demoUser],
    sessions: {},
    activities
  };
}

let db = {
  users: [],
  sessions: {},
  activities: []
};

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(raw);
      if (!Array.isArray(db.users) || !Array.isArray(db.activities) || !db.sessions) {
        console.log('Old or invalid DB format detected, resetting to seed data with user support');
        db = getInitialSeedData();
        saveDB();
      } else {
        let changed = false;
        db.users.forEach(u => {
          if (u.heightCm && u.weightKg && !u.activityPlan) {
            u.activityPlan = generateAIFitnessPlan({
              name: u.name,
              heightCm: u.heightCm,
              weightKg: u.weightKg,
              fitnessGoal: u.fitnessGoal || 'eco_wellness'
            });
            changed = true;
          }
          if (!u.reminderSettings) {
            u.reminderSettings = getDefaultReminderSettings();
            changed = true;
          }
        });
        if (changed) saveDB();
      }
    } else {
      db = getInitialSeedData();
      saveDB();
    }
  } catch (err) {
    console.error('Error loading DB, fallback to seed:', err);
    db = getInitialSeedData();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

loadDB();

// Helper to extract authenticated user
function getAuthenticatedUser(req) {
  // Check Authorization header or query param
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token;
  } else if (req.headers['x-user-id']) {
    const user = db.users.find(u => u.id === req.headers['x-user-id']);
    if (user) return user;
  }

  if (token && db.sessions && db.sessions[token]) {
    const userId = db.sessions[token].userId;
    const user = db.users.find(u => u.id === userId);
    if (user) return user;
  }

  // Fallback to demo user if no token provided
  return db.users.find(u => u.id === DEMO_USER_ID) || db.users[0] || null;
}

// User serializer helper
function serializeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    normalizedPhone: user.normalizedPhone,
    name: user.name,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    heightUnit: user.heightUnit || 'cm',
    weightUnit: user.weightUnit || 'kg',
    dietPreference: user.dietPreference || 'vegetarian',
    fitnessGoal: user.fitnessGoal || 'eco_wellness',
    isProfileComplete: Boolean(user.isProfileComplete && user.heightCm && user.weightKg),
    dietPlan: user.dietPlan || null,
    activityPlan: user.activityPlan || null,
    reminderSettings: user.reminderSettings || getDefaultReminderSettings(),
    weeklyTargetKg: user.weeklyTargetKg || 50.0,
    createdAt: user.createdAt
  };
}

// ---------------- AUTH ROUTES ----------------

// POST /api/auth/login (Login or First-Time Auto Signup)
app.post('/api/auth/login', (req, res) => {
  const { phoneNumber, password, name } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide both phone number and password.' 
    });
  }

  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length < 10 || normalized.length > 15) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please enter a valid phone number (10 to 15 digits).' 
    });
  }

  if (password.length < 4) {
    return res.status(400).json({ 
      success: false, 
      error: 'Password must be at least 4 characters.' 
    });
  }

  let user = db.users.find(u => u.normalizedPhone === normalized);
  let isNewUser = false;

  if (!user) {
    // First-Time Signup Flow: Create new user account automatically!
    isNewUser = true;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    user = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      phoneNumber: phoneNumber.trim(),
      normalizedPhone: normalized,
      name: name && name.trim() ? name.trim() : `User ${normalized.slice(-4)}`,
      heightCm: undefined,
      weightKg: undefined,
      heightUnit: 'cm',
      weightUnit: 'kg',
      dietPreference: 'vegetarian',
      fitnessGoal: 'eco_wellness',
      isProfileComplete: false,
      dietPlan: null,
      activityPlan: null,
      reminderSettings: getDefaultReminderSettings(),
      passwordHash,
      salt,
      weeklyTargetKg: 50.0,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    saveDB();
  } else {
    // Returning User Flow: Check password match
    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      return res.status(401).json({ 
        success: false, 
        error: 'Incorrect password. Please verify your credentials.' 
      });
    }
  }

  // Create session token
  const token = `token-${user.id}-${crypto.randomBytes(24).toString('hex')}`;
  if (!db.sessions) db.sessions = {};
  db.sessions[token] = {
    userId: user.id,
    createdAt: new Date().toISOString()
  };
  saveDB();

  res.json({
    success: true,
    isNewUser,
    user: serializeUser(user),
    token
  });
});

// GET /api/auth/me (Check active session)
app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  res.json({
    success: true,
    user: serializeUser(user)
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (db.sessions && db.sessions[token]) {
      delete db.sessions[token];
      saveDB();
    }
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ---------------- USER ONBOARDING & PROFILE ROUTES ----------------

// POST /api/user/profile (Save Name, Height, Weight & Preferences)
app.post('/api/user/profile', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  const { name, heightCm, weightKg, heightUnit, weightUnit, dietPreference, fitnessGoal } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }

  const h = Number(heightCm);
  if (isNaN(h) || h < 50 || h > 250) {
    return res.status(400).json({ success: false, error: 'Height must be a realistic number between 50 cm and 250 cm.' });
  }

  const w = Number(weightKg);
  if (isNaN(w) || w < 20 || w > 300) {
    return res.status(400).json({ success: false, error: 'Weight must be a realistic number between 20 kg and 300 kg.' });
  }

  user.name = name.trim();
  user.heightCm = Math.round(h * 10) / 10;
  user.weightKg = Math.round(w * 10) / 10;
  user.heightUnit = heightUnit === 'ft_in' ? 'ft_in' : 'cm';
  user.weightUnit = weightUnit === 'lb' ? 'lb' : 'kg';
  if (dietPreference) user.dietPreference = dietPreference;
  if (fitnessGoal) user.fitnessGoal = fitnessGoal;
  user.isProfileComplete = true;

  saveDB();

  res.json({
    success: true,
    user: serializeUser(user),
    message: 'Profile updated successfully!'
  });
});

// POST /api/ai/diet-chart (Generate & Persist AI Diet Plan AND AI Activity Plan on Onboarding)
app.post('/api/ai/diet-chart', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  const { name, heightCm, weightKg, dietPreference, fitnessGoal } = req.body;

  const h = Number(heightCm || user.heightCm);
  const w = Number(weightKg || user.weightKg);

  if (!h || h < 50 || h > 250) {
    return res.status(400).json({ success: false, error: 'Valid height (50–250 cm) is required for plan generation.' });
  }

  if (!w || w < 20 || w > 300) {
    return res.status(400).json({ success: false, error: 'Valid weight (20–300 kg) is required for plan generation.' });
  }

  // Update profile metrics if passed
  if (name && name.trim()) user.name = name.trim();
  user.heightCm = Math.round(h * 10) / 10;
  user.weightKg = Math.round(w * 10) / 10;
  if (dietPreference) user.dietPreference = dietPreference;
  if (fitnessGoal) user.fitnessGoal = fitnessGoal;
  user.isProfileComplete = true;

  // Generate AI Diet Plan
  const dietPlan = generateAIDietPlan({
    name: user.name,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    dietPreference: user.dietPreference || 'vegetarian',
    fitnessGoal: user.fitnessGoal || 'eco_wellness'
  });

  // Generate AI Fitness Activity Plan (weight-adaptive)
  const activityPlan = generateAIFitnessPlan({
    name: user.name,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    fitnessGoal: user.fitnessGoal || 'eco_wellness'
  });

  user.dietPlan = dietPlan;
  user.activityPlan = activityPlan;
  saveDB();

  res.json({
    success: true,
    dietPlan,
    activityPlan,
    user: serializeUser(user),
    message: 'Personalized AI diet plan and fitness activity plan generated successfully!'
  });
});

// GET /api/user/diet-plan (Retrieve persisted diet plan)
app.get('/api/user/diet-plan', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  if (!user.dietPlan) {
    // Generate on-the-fly if profile is complete
    if (user.heightCm && user.weightKg) {
      user.dietPlan = generateAIDietPlan({
        name: user.name,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        dietPreference: user.dietPreference || 'vegetarian',
        fitnessGoal: user.fitnessGoal || 'eco_wellness'
      });
      saveDB();
    } else {
      return res.status(404).json({ success: false, error: 'No diet plan found. Please complete profile onboarding.' });
    }
  }

  res.json({
    success: true,
    dietPlan: user.dietPlan,
    user: serializeUser(user)
  });
});

// POST /api/ai/activity-plan (Generate & Persist AI Fitness Activity Plan independently)
app.post('/api/ai/activity-plan', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  const { name, heightCm, weightKg, fitnessGoal } = req.body;

  const h = Number(heightCm || user.heightCm);
  const w = Number(weightKg || user.weightKg);

  if (!h || h < 50 || h > 250) {
    return res.status(400).json({ success: false, error: 'Valid height (50–250 cm) is required for activity plan generation.' });
  }

  if (!w || w < 20 || w > 300) {
    return res.status(400).json({ success: false, error: 'Valid weight (20–300 kg) is required for activity plan generation.' });
  }

  if (name && name.trim()) user.name = name.trim();
  user.heightCm = Math.round(h * 10) / 10;
  user.weightKg = Math.round(w * 10) / 10;
  if (fitnessGoal) user.fitnessGoal = fitnessGoal;
  user.isProfileComplete = true;

  const activityPlan = generateAIFitnessPlan({
    name: user.name,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    fitnessGoal: user.fitnessGoal || 'eco_wellness'
  });

  user.activityPlan = activityPlan;
  saveDB();

  res.json({
    success: true,
    activityPlan,
    user: serializeUser(user),
    message: 'Personalized AI fitness activity plan generated successfully!'
  });
});

// GET /api/user/activity-plan (Retrieve persisted activity plan)
app.get('/api/user/activity-plan', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  if (!user.activityPlan) {
    if (user.heightCm && user.weightKg) {
      user.activityPlan = generateAIFitnessPlan({
        name: user.name,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        fitnessGoal: user.fitnessGoal || 'eco_wellness'
      });
      saveDB();
    } else {
      return res.status(404).json({ success: false, error: 'No activity plan found. Please complete profile onboarding.' });
    }
  }

  res.json({
    success: true,
    activityPlan: user.activityPlan,
    user: serializeUser(user)
  });
});

// GET /api/user/reminders (Retrieve persisted reminder preferences)
app.get('/api/user/reminders', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  if (!user.reminderSettings) {
    user.reminderSettings = getDefaultReminderSettings();
    saveDB();
  }

  res.json({
    success: true,
    reminderSettings: user.reminderSettings,
    user: serializeUser(user)
  });
});

// POST /api/user/reminders (Save reminder times, on/off toggles, sound, and last fired dates)
app.post('/api/user/reminders', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  const payload = req.body.reminderSettings || req.body;

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid reminder settings payload.' });
  }

  // Merge safely with existing settings to prevent accidental omission
  const current = user.reminderSettings || getDefaultReminderSettings();
  user.reminderSettings = {
    ...current,
    ...payload,
    reminders: {
      ...current.reminders,
      ...(payload.reminders || {})
    },
    lastFiredMap: {
      ...current.lastFiredMap,
      ...(payload.lastFiredMap || {})
    }
  };

  saveDB();

  res.json({
    success: true,
    reminderSettings: user.reminderSettings,
    user: serializeUser(user),
    message: 'Reminder preferences saved successfully!'
  });
});

// ---------------- ACTIVITY & DASHBOARD ROUTES ----------------

// GET /api/target
app.get('/api/target', (req, res) => {
  const user = getAuthenticatedUser(req);
  const mon = getMonday();
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  res.json({
    success: true,
    data: {
      targetKg: user ? (user.weeklyTargetKg || 50.0) : 50.0,
      weekStart: formatDate(mon),
      weekEnd: formatDate(sun)
    }
  });
});

// POST /api/target (Feature 3: Set weekly target)
app.post('/api/target', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  const { targetKg } = req.body;
  const num = Number(targetKg);
  if (isNaN(num) || num <= 0) {
    return res.status(400).json({ success: false, error: 'Target must be a positive number in kg CO2.' });
  }

  user.weeklyTargetKg = Math.round(num * 10) / 10;
  saveDB();

  res.json({ success: true, targetKg: user.weeklyTargetKg });
});

// GET /api/activities (Feature 4: Activity History, scoped to user)
app.get('/api/activities', (req, res) => {
  const user = getAuthenticatedUser(req);
  const userId = user ? user.id : DEMO_USER_ID;

  const { category, startDate, endDate, search } = req.query;
  let list = db.activities.filter(a => a.userId === userId);

  if (category && category !== 'all') {
    list = list.filter(a => a.category === category);
  }

  if (startDate) {
    list = list.filter(a => a.date >= startDate);
  }

  if (endDate) {
    list = list.filter(a => a.date <= endDate);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => 
      (CATEGORY_NAMES[a.category] && CATEGORY_NAMES[a.category].toLowerCase().includes(q)) ||
      (a.notes && a.notes.toLowerCase().includes(q)) ||
      a.date.includes(q)
    );
  }

  res.json({
    success: true,
    count: list.length,
    data: list
  });
});

// POST /api/activities (Feature 1: Log daily activity)
app.post('/api/activities', (req, res) => {
  const user = getAuthenticatedUser(req);
  const userId = user ? user.id : DEMO_USER_ID;

  const { category, quantity, date, notes, warningFlag } = req.body;

  if (!category || !EMISSION_FACTORS[category]) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid activity category. Supported: ${Object.keys(EMISSION_FACTORS).join(', ')}` 
    });
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Quantity must be a valid number greater than 0.' 
    });
  }

  // DP2 Hard Block
  const maxLimit = MAX_LIMITS[category] || 100000;
  if (numQty > maxLimit) {
    return res.status(400).json({
      success: false,
      error: `Value exceeds plausible daily maximum (${maxLimit} for ${CATEGORY_NAMES[category]}).`
    });
  }

  const factor = EMISSION_FACTORS[category];
  const emissionsKg = Math.round(numQty * factor * 100) / 100;
  const unit = category === 'electricity' ? 'kWh' : category.includes('meal') ? 'meals' : 'km';

  let flag = warningFlag;
  if (!flag && numQty > (SOFT_WARNINGS[category] || 99999)) {
    flag = 'High single-day entry';
  }

  const newActivity = {
    id: `act-${Date.now()}`,
    userId,
    category,
    quantity: numQty,
    unit,
    emissionsKg,
    date: date || formatDate(new Date()),
    notes: notes ? notes.trim() : undefined,
    createdAt: new Date().toISOString(),
    warningFlag: flag
  };

  db.activities.unshift(newActivity);
  saveDB();

  res.status(201).json({ success: true, data: newActivity });
});

// DELETE /api/activities/:id
app.delete('/api/activities/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  const userId = user ? user.id : DEMO_USER_ID;

  const initialLength = db.activities.length;
  db.activities = db.activities.filter(a => !(a.id === req.params.id && a.userId === userId));

  if (db.activities.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Activity not found or unauthorized.' });
  }

  saveDB();
  res.json({ success: true, message: 'Activity deleted successfully.' });
});

// GET /api/summary (Feature 2: Emissions Dashboard)
app.get('/api/summary', (req, res) => {
  const user = getAuthenticatedUser(req);
  const userId = user ? user.id : DEMO_USER_ID;
  const userTarget = user ? (user.weeklyTargetKg || 50.0) : 50.0;

  const mon = getMonday();
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const startStr = formatDate(mon);
  const endStr = formatDate(sun);

  // Filter user activities for this week
  const userActivities = db.activities.filter(a => a.userId === userId);
  const weekActivities = userActivities.filter(a => a.date >= startStr && a.date <= endStr);
  const totalWeekEmissions = Math.round(weekActivities.reduce((acc, a) => acc + a.emissionsKg, 0) * 100) / 100;

  const catTotals = {
    car: { quantity: 0, emissions: 0, count: 0 },
    bus: { quantity: 0, emissions: 0, count: 0 },
    flight: { quantity: 0, emissions: 0, count: 0 },
    electricity: { quantity: 0, emissions: 0, count: 0 },
    veg_meal: { quantity: 0, emissions: 0, count: 0 },
    non_veg_meal: { quantity: 0, emissions: 0, count: 0 }
  };

  weekActivities.forEach(a => {
    if (catTotals[a.category]) {
      catTotals[a.category].quantity += a.quantity;
      catTotals[a.category].emissions += a.emissionsKg;
      catTotals[a.category].count += 1;
    }
  });

  const categories = Object.keys(catTotals).map(cat => {
    const data = catTotals[cat];
    const percentage = totalWeekEmissions > 0 ? Math.round((data.emissions / totalWeekEmissions) * 1000) / 10 : 0;
    const unit = cat === 'electricity' ? 'kWh' : cat.includes('meal') ? 'meals' : 'km';
    return {
      category: cat,
      name: CATEGORY_NAMES[cat],
      totalQuantity: Math.round(data.quantity * 10) / 10,
      unit,
      totalEmissionsKg: Math.round(data.emissions * 100) / 100,
      percentage,
      entryCount: data.count
    };
  }).sort((a, b) => b.totalEmissionsKg - a.totalEmissionsKg);

  res.json({
    success: true,
    data: {
      weekStart: startStr,
      weekEnd: endStr,
      weeklyTargetKg: userTarget,
      totalWeekEmissionsKg: totalWeekEmissions,
      categories,
      weekActivitiesCount: weekActivities.length,
      allTimeEmissionsKg: Math.round(userActivities.reduce((acc, a) => acc + a.emissionsKg, 0) * 100) / 100,
      totalActivitiesCount: userActivities.length
    }
  });
});

// POST /api/reset-seed
app.post('/api/reset-seed', (req, res) => {
  db = getInitialSeedData();
  saveDB();
  res.json({
    success: true,
    message: 'Database reset to demo state successfully!'
  });
});

app.listen(PORT, () => {
  console.log(`🌱 Earthly Carbon Footprint Tracker API listening on http://localhost:${PORT}`);
});
