import { DietPlan, ActivityPlan, MealSchedule, DayPlanOverview, DayActivityRoutine, ExerciseItem } from '../types';

export function generateClientAIDietPlan(payload: {
  name?: string;
  heightCm?: number;
  weightKg?: number;
  dietPreference?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
  fitnessGoal?: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
}): DietPlan {
  const h = Number(payload.heightCm) || 175;
  const w = Number(payload.weightKg) || 68;
  const dietPreference = payload.dietPreference || 'vegetarian';
  const fitnessGoal = payload.fitnessGoal || 'eco_wellness';

  const heightM = h / 100;
  const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;

  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obese';

  const bmr = Math.round(10 * w + 6.25 * h - 5 * 28 + 5);
  const tdee = Math.round(bmr * 1.375);

  let targetCalories = tdee;
  if (fitnessGoal === 'weight_loss') targetCalories = Math.max(1300, Math.round(tdee * 0.82));
  else if (fitnessGoal === 'muscle_gain') targetCalories = Math.round(tdee * 1.15);

  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatsRatio = 0.25;

  if (fitnessGoal === 'muscle_gain') {
    proteinRatio = 0.30;
    carbsRatio = 0.45;
  } else if (dietPreference === 'low_carb') {
    proteinRatio = 0.30;
    carbsRatio = 0.30;
    fatsRatio = 0.40;
  }

  const proteinG = Math.round((targetCalories * proteinRatio) / 4);
  const carbsG = Math.round((targetCalories * carbsRatio) / 4);
  const fatsG = Math.round((targetCalories * fatsRatio) / 9);

  const hydrationTargetLiters = Math.round((w * 0.035) * 10) / 10;

  const breakfastCalories = Math.round(targetCalories * 0.26);
  const lunchCalories = Math.round(targetCalories * 0.36);
  const dinnerCalories = Math.round(targetCalories * 0.28);
  const snackCalories = Math.round(targetCalories * 0.05);

  const meals: MealSchedule = {
    breakfast: {
      id: `meal-b-${Date.now()}`,
      category: 'breakfast',
      name: dietPreference === 'vegan' ? 'Turmeric Tofu Scramble & Artisan Toast' : 'Organic Rolled Oats & Chia Superfood Bowl',
      title: 'High-Fiber Antioxidant Breakfast',
      description: 'Warm steel-cut oats simmered in oat milk with chia seeds, wild blueberries, crushed walnuts, and organic maple.',
      portion: '1 bowl (320g)',
      calories: breakfastCalories,
      proteinG: Math.round(proteinG * 0.24),
      carbsG: Math.round(carbsG * 0.32),
      fatsG: Math.round(fatsG * 0.24),
      ecoScore: 'A+',
      carbonKg: 0.18,
      ingredients: ['Rolled Oats', 'Oat Milk', 'Chia Seeds', 'Blueberries', 'Walnuts']
    },
    morningSnack: {
      id: `meal-ms-${Date.now()}`,
      category: 'morning_snack',
      name: 'Raw California Walnuts & Organic Apple Slices',
      title: 'Brain-Boosting Morning Refuel',
      description: 'Crisp organic apple slices paired with heart-healthy raw walnuts.',
      portion: '1 serving (140g)',
      calories: snackCalories,
      proteinG: 6,
      carbsG: 18,
      fatsG: 7,
      ecoScore: 'A+',
      carbonKg: 0.08,
      ingredients: ['Raw Walnuts', 'Organic Apple']
    },
    lunch: {
      id: `meal-l-${Date.now()}`,
      category: 'lunch',
      name: 'Roasted Chickpea & Mediterranean Quinoa Bowl',
      title: 'Balanced Plant-Powered Midday Fuel',
      description: 'Fluffy organic quinoa tossed with crispy spiced chickpeas, cucumbers, cherry tomatoes, and tahini lemon dressing.',
      portion: '1 large bowl (380g)',
      calories: lunchCalories,
      proteinG: Math.round(proteinG * 0.38),
      carbsG: Math.round(carbsG * 0.40),
      fatsG: Math.round(fatsG * 0.32),
      ecoScore: 'A+',
      carbonKg: 0.26,
      ingredients: ['Tri-color Quinoa', 'Organic Chickpeas', 'Tahini', 'Cucumbers', 'Extra Virgin Olive Oil']
    },
    afternoonSnack: {
      id: `meal-as-${Date.now()}`,
      category: 'afternoon_snack',
      name: 'Steamed Edamame with Coarse Sea Salt & Matcha Tea',
      title: 'Afternoon Focus & Clean Protein',
      description: 'Organic edamame pods steamed with flaky sea salt alongside antioxidant-rich matcha.',
      portion: '1 bowl (120g)',
      calories: snackCalories,
      proteinG: 9,
      carbsG: 8,
      fatsG: 3,
      ecoScore: 'A+',
      carbonKg: 0.07,
      ingredients: ['Organic Edamame', 'Celtic Sea Salt', 'Matcha Tea']
    },
    dinner: {
      id: `meal-d-${Date.now()}`,
      category: 'dinner',
      name: 'Warm Beluga Lentils & Roasted Winter Squash',
      title: 'Restorative Low-Carbon Evening Meal',
      description: 'Braised black beluga lentils over roasted kabocha squash with wilted rainbow chard and lemon herb vinaigrette.',
      portion: '1 plate (340g)',
      calories: dinnerCalories,
      proteinG: Math.round(proteinG * 0.32),
      carbsG: Math.round(carbsG * 0.30),
      fatsG: Math.round(fatsG * 0.28),
      ecoScore: 'A+',
      carbonKg: 0.22,
      ingredients: ['Black Beluga Lentils', 'Kabocha Squash', 'Rainbow Chard', 'Garlic', 'Cold-Pressed Olive Oil']
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklyOverview: DayPlanOverview[] = days.map((day, idx) => ({
    day,
    focus: idx % 2 === 0 ? 'Plant Protein & Micro-Nutrients' : 'Slow Complex Carbs & Healthy Fats',
    calorieTarget: targetCalories,
    highlight: idx % 2 === 0 ? 'High-fiber legume bowls' : 'Whole-grain restorative energy',
    ecoTip: 'Opt for local seasonal produce to minimize food miles.'
  }));

  return {
    id: `diet-${Date.now()}`,
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
    meals,
    weeklyOverview,
    ecoFootprintDailyKg: 0.81,
    ecoSavingsPct: 58,
    ecoTip: `Adopting this ${dietPreference} diet reduces your food emissions by up to 58% compared to the national average.`,
    disclaimer: 'This plan is generated for wellness and carbon footprint tracking purposes.'
  };
}

export function generateClientAIFitnessPlan(payload: {
  name?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
}): ActivityPlan {
  const h = Number(payload.heightCm) || 175;
  const w = Number(payload.weightKg) || 68;
  const heightM = h / 100;
  const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;

  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obese';

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule: DayActivityRoutine[] = days.map((day, idx) => {
    const isRest = idx === 3 || idx === 6;
    if (isRest) {
      return {
        day,
        focusTitle: 'Active Recovery & Joint Mobility',
        isRestDay: true,
        totalDurationMinutes: 20,
        estimatedCalorieBurn: 45,
        routine: [
          {
            id: `ex-${day}-1`,
            name: 'Gentle Spinal Flow & Hip Openers',
            category: 'mobility',
            durationMinutes: 20,
            intensity: 'Low',
            estimatedCalorieBurn: 45,
            description: 'Slow, deep breathing stretching routine.',
            equipmentNeeded: 'Yoga mat',
            warmup: 'Deep diaphragmatic breathing',
            cooldown: 'Corpse pose relaxation',
            safetyTip: 'Never force range of motion.'
          }
        ],
        wellnessNote: 'Hydrate well and let muscle tissue regenerate.'
      };
    }

    const cardioEx: ExerciseItem = {
      id: `ex-${day}-1`,
      name: idx % 2 === 0 ? 'Brisk Cadence Walking & Light Jog Intervals' : 'Functional Bodyweight Circuit',
      category: idx % 2 === 0 ? 'cardio' : 'strength',
      durationMinutes: 25,
      intensity: 'Moderate',
      estimatedCalorieBurn: Math.round(w * 1.5),
      description: 'Continuous movement keeping heart rate in aerobic zone.',
      equipmentNeeded: 'Supportive running/training shoes',
      warmup: '3 minutes ankle and knee rotations',
      cooldown: '3 minutes standing hamstring stretches',
      safetyTip: 'Maintain steady upright posture.'
    };

    const strengthEx: ExerciseItem = {
      id: `ex-${day}-2`,
      name: 'Core Stability & Glute Bridges',
      category: 'strength',
      durationMinutes: 15,
      intensity: 'Moderate',
      estimatedCalorieBurn: Math.round(w * 0.9),
      description: 'Bodyweight isometric holds and controlled reps.',
      equipmentNeeded: 'Floor mat',
      warmup: 'Cat-cow dynamic stretch',
      cooldown: 'Child pose stretch',
      safetyTip: 'Engage pelvic floor and avoid arching lower back.'
    };

    return {
      day,
      focusTitle: idx % 2 === 0 ? 'Aerobic Endurance & Core Activation' : 'Full Body Calisthenics & Strength',
      isRestDay: false,
      totalDurationMinutes: 40,
      estimatedCalorieBurn: Math.round(w * 2.4),
      routine: [cardioEx, strengthEx],
      wellnessNote: 'Focus on fluid movement and nasal breathing.'
    };
  });

  return {
    id: `actplan-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    weightKg: w,
    heightCm: h,
    bmi,
    bmiCategory,
    fitnessLevel: 'Progressive Functional Calisthenics',
    recommendedDaysPerWeek: 5,
    weeklyCalorieBurnEstimate: Math.round(w * 12),
    introSummary: `Tailored weekly activity routine calibrated for ${w} kg bodyweight to develop sustainable functional strength and stamina.`,
    schedule,
    weeklyMilestones: [
      'Complete 4-5 activity sessions consistently',
      'Reach 10,000 daily movement steps',
      'Maintain daily hydration goals'
    ],
    disclaimer: 'Consult your physician before beginning any new vigorous exercise regimen.'
  };
}
