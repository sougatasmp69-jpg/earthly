import { 
  ActivityCategory, 
  EMISSION_FACTORS, 
  CATEGORY_CONFIGS, 
  ActivityEntry, 
  CategorySummary, 
  DailySummary 
} from '../types';

/**
 * Calculates CO2 emissions in kg using fixed emission factors.
 */
export function calculateEmissions(category: ActivityCategory, quantity: number): number {
  const factor = EMISSION_FACTORS[category] ?? 0;
  const raw = Number(quantity) * factor;
  return Math.round(raw * 100) / 100;
}

/**
 * DP2 · Absurd Input Validation & Guardrails
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  isSoftWarning: boolean;
  warningMessage?: string;
}

export function validateQuantity(category: ActivityCategory, quantity: number): ValidationResult {
  const config = CATEGORY_CONFIGS[category];
  const val = Number(quantity);

  // 1. Hard Rejections
  if (isNaN(val) || quantity === null || quantity === undefined) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid numeric value.',
      isSoftWarning: false
    };
  }

  if (val <= 0) {
    return {
      isValid: false,
      errorMessage: 'Quantity must be greater than 0.',
      isSoftWarning: false
    };
  }

  if (val > config.maxPlausibleDaily) {
    return {
      isValid: false,
      errorMessage: `Maximum plausible limit for ${config.name} is ${config.maxPlausibleDaily.toLocaleString()} ${config.unit}/day. Please verify your number.`,
      isSoftWarning: false
    };
  }

  // 2. Soft Warning (Unusually large single-day entry)
  if (val > config.softWarningThreshold) {
    return {
      isValid: true,
      isSoftWarning: true,
      warningMessage: `⚠️ ${val.toLocaleString()} ${config.unit} is higher than typical daily usage. Are you logging a multi-day trip or total month figure?`
    };
  }

  return {
    isValid: true,
    isSoftWarning: false
  };
}

/**
 * DP3 · Week Definition: Standard ISO Monday–Sunday weekly cycle
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getSundayOfWeek(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekBounds(referenceDate: Date = new Date()) {
  const monday = getMondayOfWeek(referenceDate);
  const sunday = getSundayOfWeek(monday);
  return {
    startStr: formatDateString(monday),
    endStr: formatDateString(sunday),
    monday,
    sunday
  };
}

/**
 * Calculates Day X of 7 in the tracking week
 */
export function getCurrentDayOfWeekIndex(referenceDate: Date = new Date()): number {
  const day = referenceDate.getDay();
  return day === 0 ? 7 : day; // 1 = Monday, ..., 7 = Sunday
}

/**
 * DP1 · Over-Target Nudging and Pacing Analysis
 */
export interface PacingAnalysis {
  currentEmissionsKg: number;
  targetKg: number;
  percentageUsed: number;
  status: 'under_target' | 'near_target' | 'over_target';
  dayIndex: number; // 1 to 7
  dayName: string;
  expectedPacingKg: number;
  pacingDeviationKg: number;
  isAheadOfPacing: boolean;
  nudgeLevel: 'green' | 'amber' | 'red';
  nudgeTitle: string;
  nudgeMessage: string;
  actionableTips: string[];
}

export function analyzeTargetPacing(
  weeklyEmissions: number, 
  targetKg: number, 
  referenceDate: Date = new Date()
): PacingAnalysis {
  const dayIndex = getCurrentDayOfWeekIndex(referenceDate);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayName = days[dayIndex - 1];

  const percentageUsed = targetKg > 0 ? (weeklyEmissions / targetKg) * 100 : 0;
  const expectedPacingKg = (targetKg / 7) * dayIndex;
  const pacingDeviationKg = weeklyEmissions - expectedPacingKg;
  const isAheadOfPacing = weeklyEmissions > expectedPacingKg;

  let status: 'under_target' | 'near_target' | 'over_target' = 'under_target';
  let nudgeLevel: 'green' | 'amber' | 'red' = 'green';
  let nudgeTitle = 'Great Pacing!';
  let nudgeMessage = `You've used ${percentageUsed.toFixed(1)}% of your weekly budget on Day ${dayIndex} of 7. Keep up the clean habits!`;
  const actionableTips: string[] = [];

  if (percentageUsed >= 100) {
    status = 'over_target';
    nudgeLevel = 'red';
    const excess = weeklyEmissions - targetKg;
    nudgeTitle = 'Weekly Target Exceeded';
    nudgeMessage = `You've exceeded your ${targetKg} kg budget by ${excess.toFixed(1)} kg CO₂ with ${7 - dayIndex} days remaining. Here are immediate low-effort ways to balance your footprint:`;
    actionableTips.push('Swap your next 2 meals to plant-based (saves ~3.0 kg CO₂)');
    actionableTips.push('Opt for walking, biking, or bus for local trips under 5 km');
    actionableTips.push('Unplug idle home electronics & minimize peak heating/AC');
  } else if (percentageUsed >= 80) {
    status = 'near_target';
    nudgeLevel = 'amber';
    const remaining = targetKg - weeklyEmissions;
    nudgeTitle = 'Approaching Weekly Limit';
    nudgeMessage = `You've used ${percentageUsed.toFixed(1)}% of your target with ${remaining.toFixed(1)} kg CO₂ buffer left for ${7 - dayIndex + 1} days.`;
    actionableTips.push('Choose vegetarian meals for dinner to preserve your remaining budget');
    actionableTips.push('Combine car errands into a single trip or take public transit');
  } else {
    status = 'under_target';
    nudgeLevel = 'green';
    const remaining = targetKg - weeklyEmissions;
    nudgeTitle = 'On Track with Clean Habits';
    nudgeMessage = `You have ${remaining.toFixed(1)} kg CO₂ remaining in your weekly allowance on Day ${dayIndex} of 7.`;
    actionableTips.push('Every plant-based meal saves ~1.5 kg CO₂ vs beef/poultry');
    actionableTips.push('Public transit emits ~60% less carbon per km than driving alone');
  }

  return {
    currentEmissionsKg: Math.round(weeklyEmissions * 100) / 100,
    targetKg,
    percentageUsed: Math.round(percentageUsed * 10) / 10,
    status,
    dayIndex,
    dayName,
    expectedPacingKg: Math.round(expectedPacingKg * 100) / 100,
    pacingDeviationKg: Math.round(pacingDeviationKg * 100) / 100,
    isAheadOfPacing,
    nudgeLevel,
    nudgeTitle,
    nudgeMessage,
    actionableTips
  };
}

/**
 * Aggregates emissions by category for charts and summary tables
 */
export function aggregateByCategory(entries: ActivityEntry[]): CategorySummary[] {
  const totals: Record<ActivityCategory, { quantity: number; emissions: number; count: number }> = {
    car: { quantity: 0, emissions: 0, count: 0 },
    bus: { quantity: 0, emissions: 0, count: 0 },
    flight: { quantity: 0, emissions: 0, count: 0 },
    electricity: { quantity: 0, emissions: 0, count: 0 },
    veg_meal: { quantity: 0, emissions: 0, count: 0 },
    non_veg_meal: { quantity: 0, emissions: 0, count: 0 }
  };

  let totalEmissions = 0;

  entries.forEach(entry => {
    if (totals[entry.category]) {
      totals[entry.category].quantity += entry.quantity;
      totals[entry.category].emissions += entry.emissionsKg;
      totals[entry.category].count += 1;
      totalEmissions += entry.emissionsKg;
    }
  });

  const categories: ActivityCategory[] = ['car', 'bus', 'flight', 'electricity', 'veg_meal', 'non_veg_meal'];

  return categories.map(cat => {
    const config = CATEGORY_CONFIGS[cat];
    const data = totals[cat];
    const percentage = totalEmissions > 0 ? (data.emissions / totalEmissions) * 100 : 0;

    return {
      category: cat,
      name: config.name,
      totalQuantity: Math.round(data.quantity * 10) / 10,
      unit: config.unit,
      totalEmissionsKg: Math.round(data.emissions * 100) / 100,
      percentage: Math.round(percentage * 10) / 10,
      entryCount: data.count,
      color: config.color
    };
  }).sort((a, b) => b.totalEmissionsKg - a.totalEmissionsKg);
}

/**
 * Aggregates day-by-day emissions for the Monday-Sunday week
 */
export function aggregateByDayOfWeek(entries: ActivityEntry[], monday: Date): DailySummary[] {
  const daysMap: Record<string, number> = {};
  const todayStr = formatDateString(new Date());

  // Initialize all 7 days Mon-Sun
  const result: DailySummary[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateString(d);
    daysMap[dateStr] = 0;

    const isToday = dateStr === todayStr;
    const isFuture = d.getTime() > new Date().setHours(23, 59, 59, 999);

    result.push({
      date: dateStr,
      dayName: dayNames[i],
      dayNumber: i + 1,
      totalEmissionsKg: 0,
      isToday,
      isFuture
    });
  }

  // Populate from entries
  entries.forEach(e => {
    if (daysMap[e.date] !== undefined) {
      daysMap[e.date] += e.emissionsKg;
    }
  });

  result.forEach(r => {
    r.totalEmissionsKg = Math.round((daysMap[r.date] || 0) * 100) / 100;
  });

  return result;
}
