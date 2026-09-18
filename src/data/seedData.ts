import { ActivityEntry, WeeklyTarget } from '../types';
import { calculateEmissions, getMondayOfWeek, formatDateString } from '../services/calculator';

export function getInitialSeedActivities(): ActivityEntry[] {
  const monday = getMondayOfWeek(new Date());

  const getOffsetDateStr = (daysFromMonday: number): string => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + daysFromMonday);
    return formatDateString(d);
  };

  const seedRaw = [
    // Monday
    {
      id: 'act-01',
      category: 'car' as const,
      quantity: 24,
      date: getOffsetDateStr(0),
      notes: 'Morning & evening commute to office via highway'
    },
    {
      id: 'act-02',
      category: 'electricity' as const,
      quantity: 14.5,
      date: getOffsetDateStr(0),
      notes: 'Home apartment daily electricity usage'
    },
    {
      id: 'act-03',
      category: 'veg_meal' as const,
      quantity: 2,
      date: getOffsetDateStr(0),
      notes: 'Oatmeal breakfast and Mediterranean grain bowl lunch'
    },
    {
      id: 'act-04',
      category: 'non_veg_meal' as const,
      quantity: 1,
      date: getOffsetDateStr(0),
      notes: 'Grilled salmon dinner'
    },

    // Tuesday
    {
      id: 'act-05',
      category: 'bus' as const,
      quantity: 18,
      date: getOffsetDateStr(1),
      notes: 'Took electric metro & city bus instead of driving'
    },
    {
      id: 'act-06',
      category: 'electricity' as const,
      quantity: 12.0,
      date: getOffsetDateStr(1),
      notes: 'Efficient appliance mode & LED lighting'
    },
    {
      id: 'act-07',
      category: 'veg_meal' as const,
      quantity: 3,
      date: getOffsetDateStr(1),
      notes: 'Full plant-based day (smoothie, tofu stir-fry, lentil soup)'
    },

    // Wednesday
    {
      id: 'act-08',
      category: 'car' as const,
      quantity: 32,
      date: getOffsetDateStr(2),
      notes: 'Client meeting across town & grocery stop'
    },
    {
      id: 'act-09',
      category: 'electricity' as const,
      quantity: 16.0,
      date: getOffsetDateStr(2),
      notes: 'Laundry cycle and home office workstation'
    },
    {
      id: 'act-10',
      category: 'non_veg_meal' as const,
      quantity: 2,
      date: getOffsetDateStr(2),
      notes: 'Chicken wrap lunch and beef burger with colleagues'
    },

    // Thursday
    {
      id: 'act-11',
      category: 'bus' as const,
      quantity: 12,
      date: getOffsetDateStr(3),
      notes: 'Crosstown bus ride for library study session'
    },
    {
      id: 'act-12',
      category: 'veg_meal' as const,
      quantity: 2,
      date: getOffsetDateStr(3),
      notes: 'Avocado toast and chickpea salad bowl'
    },
    {
      id: 'act-13',
      category: 'electricity' as const,
      quantity: 13.2,
      date: getOffsetDateStr(3),
      notes: 'Standard household power consumption'
    },

    // Friday / Regional Trip
    {
      id: 'act-14',
      category: 'flight' as const,
      quantity: 120, // Short regional shuttle flight/connecting hop
      date: getOffsetDateStr(4),
      notes: 'Short regional flight for weekend family visit'
    }
  ];

  return seedRaw.map((item, index) => {
    const emissionsKg = calculateEmissions(item.category, item.quantity);
    return {
      id: item.id || `act-seed-${index + 1}`,
      category: item.category,
      quantity: item.quantity,
      unit: item.category === 'electricity' ? 'kWh' : item.category.includes('meal') ? 'meals' : 'km',
      emissionsKg,
      date: item.date,
      notes: item.notes,
      createdAt: new Date().toISOString()
    };
  });
}

export const INITIAL_WEEKLY_TARGET: WeeklyTarget = {
  targetKg: 50.0, // 50 kg CO2 / week baseline
  weekStart: formatDateString(getMondayOfWeek(new Date())),
  weekEnd: formatDateString(new Date(getMondayOfWeek(new Date()).getTime() + 6 * 24 * 60 * 60 * 1000))
};
