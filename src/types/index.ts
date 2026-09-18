export type ActivityCategory = 
  | 'car'
  | 'bus'
  | 'flight'
  | 'electricity'
  | 'veg_meal'
  | 'non_veg_meal';

export interface CategoryConfig {
  id: ActivityCategory;
  name: string;
  factor: number; // kg CO2 per unit
  unit: string;
  unitLabel: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  // DP2 bounds
  maxPlausibleDaily: number;
  softWarningThreshold: number;
}

// Fixed, hardcoded constants as strictly required by prompt
export const EMISSION_FACTORS: Record<ActivityCategory, number> = {
  car: 0.20,         // 0.20 kg CO2/km
  bus: 0.08,         // 0.08 kg CO2/km
  flight: 0.25,      // 0.25 kg CO2/km
  electricity: 0.80, // 0.80 kg CO2/kWh
  veg_meal: 0.50,    // 0.50 kg CO2/meal
  non_veg_meal: 2.00 // 2.00 kg CO2/meal
};

export const CATEGORY_CONFIGS: Record<ActivityCategory, CategoryConfig> = {
  car: {
    id: 'car',
    name: 'Car Travel',
    factor: 0.20,
    unit: 'km',
    unitLabel: 'Kilometers (km)',
    icon: 'Car',
    color: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#fdba74',
    description: '0.20 kg CO₂ per km',
    maxPlausibleDaily: 2500,
    softWarningThreshold: 350
  },
  bus: {
    id: 'bus',
    name: 'Bus Travel',
    factor: 0.08,
    unit: 'km',
    unitLabel: 'Kilometers (km)',
    icon: 'Bus',
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
    borderColor: '#7dd3fc',
    description: '0.08 kg CO₂ per km',
    maxPlausibleDaily: 1500,
    softWarningThreshold: 200
  },
  flight: {
    id: 'flight',
    name: 'Flight',
    factor: 0.25,
    unit: 'km',
    unitLabel: 'Flight distance (km)',
    icon: 'Plane',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#c4b5fd',
    description: '0.25 kg CO₂ per km',
    maxPlausibleDaily: 25000,
    softWarningThreshold: 4000
  },
  electricity: {
    id: 'electricity',
    name: 'Electricity',
    factor: 0.80,
    unit: 'kWh',
    unitLabel: 'Kilowatt-hours (kWh)',
    icon: 'Zap',
    color: '#eab308',
    bgColor: '#fefce8',
    borderColor: '#fde047',
    description: '0.80 kg CO₂ per kWh',
    maxPlausibleDaily: 2000,
    softWarningThreshold: 60
  },
  veg_meal: {
    id: 'veg_meal',
    name: 'Veg Meal',
    factor: 0.50,
    unit: 'meals',
    unitLabel: 'Meal count',
    icon: 'Salad',
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#6ee7b7',
    description: '0.50 kg CO₂ per meal',
    maxPlausibleDaily: 15,
    softWarningThreshold: 5
  },
  non_veg_meal: {
    id: 'non_veg_meal',
    name: 'Non-Veg Meal',
    factor: 2.00,
    unit: 'meals',
    unitLabel: 'Meal count',
    icon: 'Utensils',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    description: '2.00 kg CO₂ per meal',
    maxPlausibleDaily: 15,
    softWarningThreshold: 5
  }
};

export interface MealItem {
  id: string;
  name: string;
  category: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner';
  title: string;
  description: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  ecoScore: 'A+' | 'A' | 'B' | 'C';
  carbonKg: number;
  ingredients: string[];
  tips?: string;
}

export interface MealSchedule {
  breakfast: MealItem;
  morningSnack?: MealItem;
  lunch: MealItem;
  afternoonSnack?: MealItem;
  dinner: MealItem;
}

export interface MacroSplit {
  proteinG: number;
  proteinPct: number;
  carbsG: number;
  carbsPct: number;
  fatsG: number;
  fatsPct: number;
}

export interface DayPlanOverview {
  day: string;
  focus: string;
  calorieTarget: number;
  highlight: string;
  ecoTip: string;
}

export interface DietPlan {
  id: string;
  generatedAt: string;
  bmi: number;
  bmiCategory: string; // 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese'
  bmrCalories: number;
  tdeeCalories: number;
  targetCalories: number;
  macroSplit: MacroSplit;
  hydrationTargetLiters: number;
  meals: MealSchedule;
  weeklyOverview: DayPlanOverview[];
  ecoFootprintDailyKg: number;
  ecoSavingsPct: number; // e.g. 52% reduction vs standard diet
  ecoTip: string;
  disclaimer: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'mobility' | 'recovery' | 'flexibility';
  durationMinutes: number;
  intensity: 'Low' | 'Moderate' | 'Moderate-High';
  targetHeartRate?: string;
  estimatedCalorieBurn: number;
  description: string;
  equipmentNeeded: string;
  warmup: string;
  cooldown: string;
  safetyTip: string;
}

export interface DayActivityRoutine {
  day: string;
  focusTitle: string;
  isRestDay: boolean;
  totalDurationMinutes: number;
  estimatedCalorieBurn: number;
  routine: ExerciseItem[];
  wellnessNote: string;
}

export interface ActivityPlan {
  id: string;
  generatedAt: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  fitnessLevel: string;
  recommendedDaysPerWeek: number;
  weeklyCalorieBurnEstimate: number;
  introSummary: string;
  schedule: DayActivityRoutine[];
  weeklyMilestones: string[];
  disclaimer: string;
}

export type ReminderType = 
  | 'breakfast' 
  | 'morning_snack' 
  | 'lunch' 
  | 'afternoon_snack' 
  | 'dinner' 
  | 'activity';

export interface ReminderConfig {
  id: ReminderType;
  label: string;
  time: string; // HH:mm 24-hour format, e.g. "08:00"
  enabled: boolean;
  soundEnabled?: boolean;
  description?: string;
  icon?: string;
  lastFiredDate?: string;
}

export interface ReminderSettings {
  globalEnabled: boolean;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  reminders: {
    breakfast: ReminderConfig;
    morning_snack?: ReminderConfig;
    lunch: ReminderConfig;
    afternoon_snack?: ReminderConfig;
    dinner: ReminderConfig;
    activity: ReminderConfig;
  };
  lastFiredMap: Record<string, string>; // e.g. { "breakfast": "2026-09-19" }
  updatedAt?: string;
}

export interface ActiveReminderAlert {
  id: string;
  type: ReminderType;
  title: string;
  subtitle: string;
  details: string;
  time: string;
  badge?: string;
  planTarget: 'diet' | 'activity';
  timestamp: number;
}

export interface User {
  id: string;
  phoneNumber: string;
  normalizedPhone: string;
  name: string;
  heightCm?: number;
  weightKg?: number;
  heightUnit?: 'cm' | 'ft_in';
  weightUnit?: 'kg' | 'lb';
  dietPreference?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
  fitnessGoal?: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  isProfileComplete?: boolean;
  dietPlan?: DietPlan | null;
  activityPlan?: ActivityPlan | null;
  reminderSettings?: ReminderSettings;
  weeklyTargetKg: number;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  isNewUser?: boolean;
  error?: string;
}

export interface ActivityEntry {
  id: string;
  userId?: string;
  category: ActivityCategory;
  quantity: number;
  unit: string;
  emissionsKg: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  warningFlag?: string; // DP2 soft warning tag if unusually large
}

export interface WeeklyTarget {
  targetKg: number;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
}

export interface CategorySummary {
  category: ActivityCategory;
  name: string;
  totalQuantity: number;
  unit: string;
  totalEmissionsKg: number;
  percentage: number;
  entryCount: number;
  color: string;
}

export interface DailySummary {
  date: string;
  dayName: string;
  dayNumber: number; // 1 (Mon) to 7 (Sun)
  totalEmissionsKg: number;
  isToday: boolean;
  isFuture: boolean;
}
