import { ActivityEntry, WeeklyTarget, ActivityCategory, User, AuthResponse, DietPlan, ActivityPlan, ReminderSettings } from '../types';
import { getInitialSeedActivities, INITIAL_WEEKLY_TARGET } from '../data/seedData';
import { calculateEmissions } from './calculator';
import { generateClientAIDietPlan, generateClientAIFitnessPlan } from './clientPlanEngine';

const API_BASE = '/api';

const STORAGE_KEYS = {
  TOKEN: 'earthly_auth_token_v3',
  USER: 'earthly_auth_user_v3',
  ACTIVITIES: 'earthly_activities_v3',
  TARGET: 'earthly_target_v3',
  REMINDERS: 'earthly_reminders_v3'
};

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallback;
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const user = getLocalData<User | null>(STORAGE_KEYS.USER, null);
  if (user?.id) {
    headers['x-user-id'] = user.id;
  }
  return headers;
}

export const api = {
  // Authentication: Login or First-time Auto Signup
  async login(phoneNumber: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password, name })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.token) localStorage.setItem(STORAGE_KEYS.TOKEN, json.token);
          if (json.user) setLocalData(STORAGE_KEYS.USER, json.user);
          return json;
        }
      }
    } catch {
      // ignore network errors and use local fallback
    }

    // Local fallback for offline / GitHub Pages mode
    const normalized = (phoneNumber || '').replace(/\D/g, '');
    const user: User = {
      id: `usr-${normalized || 'demo'}`,
      phoneNumber,
      normalizedPhone: normalized,
      name: name || `User ${normalized.slice(-4) || 'Eco'}`,
      weeklyTargetKg: 50.0,
      createdAt: new Date().toISOString()
    };
    const token = `local-token-${user.id}`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    setLocalData(STORAGE_KEYS.USER, user);
    return { success: true, user, token, isNewUser: true };
  },

  // Check current session
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const cachedUser = getLocalData<User | null>(STORAGE_KEYS.USER, null);
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setLocalData(STORAGE_KEYS.USER, json.user);
          return json.user;
        }
      }
    } catch {
      // fallback to cached user
    }
    return cachedUser;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Get Target
  async getTarget(): Promise<WeeklyTarget> {
    try {
      const res = await fetch(`${API_BASE}/target`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setLocalData(STORAGE_KEYS.TARGET, json.data);
        return json.data;
      }
    } catch {
      // fallback
    }
    return getLocalData(STORAGE_KEYS.TARGET, INITIAL_WEEKLY_TARGET);
  },

  // Update Target (Feature 3)
  async updateTarget(targetKg: number): Promise<WeeklyTarget> {
    try {
      const res = await fetch(`${API_BASE}/target`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetKg })
      });
      if (res.ok) {
        const json = await res.json();
        const currentTarget = getLocalData(STORAGE_KEYS.TARGET, INITIAL_WEEKLY_TARGET);
        currentTarget.targetKg = json.targetKg;
        setLocalData(STORAGE_KEYS.TARGET, currentTarget);
        return currentTarget;
      }
    } catch {
      // fallback
    }
    const currentTarget = getLocalData(STORAGE_KEYS.TARGET, INITIAL_WEEKLY_TARGET);
    currentTarget.targetKg = targetKg;
    setLocalData(STORAGE_KEYS.TARGET, currentTarget);
    return currentTarget;
  },

  // Get Activities (Feature 4)
  async getActivities(filter?: { category?: string; startDate?: string; endDate?: string; search?: string }): Promise<ActivityEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.category && filter.category !== 'all') params.append('category', filter.category);
      if (filter?.startDate) params.append('startDate', filter.startDate);
      if (filter?.endDate) params.append('endDate', filter.endDate);
      if (filter?.search) params.append('search', filter.search);

      const res = await fetch(`${API_BASE}/activities?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const list: ActivityEntry[] = getLocalData(STORAGE_KEYS.ACTIVITIES, getInitialSeedActivities());
    return list;
  },

  // Log Activity (Feature 1)
  async logActivity(payload: {
    category: ActivityCategory;
    quantity: number;
    date: string;
    notes?: string;
    warningFlag?: string;
  }): Promise<ActivityEntry> {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const unit = payload.category === 'electricity' ? 'kWh' : payload.category.includes('meal') ? 'meals' : 'km';
    const emissionsKg = calculateEmissions(payload.category, payload.quantity);
    const newEntry: ActivityEntry = {
      id: `act-${Date.now()}`,
      category: payload.category,
      quantity: payload.quantity,
      unit,
      emissionsKg,
      date: payload.date,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      warningFlag: payload.warningFlag
    };

    const currentList = getLocalData<ActivityEntry[]>(STORAGE_KEYS.ACTIVITIES, getInitialSeedActivities());
    setLocalData(STORAGE_KEYS.ACTIVITIES, [newEntry, ...currentList]);
    return newEntry;
  },

  // Delete Activity
  async deleteActivity(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }

    const currentList = getLocalData<ActivityEntry[]>(STORAGE_KEYS.ACTIVITIES, getInitialSeedActivities());
    const updated = currentList.filter(a => a.id !== id);
    setLocalData(STORAGE_KEYS.ACTIVITIES, updated);
    return true;
  },

  // Reset Demo Seed Data
  async resetSeedData(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reset-seed`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setLocalData(STORAGE_KEYS.ACTIVITIES, getInitialSeedActivities());
        setLocalData(STORAGE_KEYS.TARGET, INITIAL_WEEKLY_TARGET);
        return true;
      }
    } catch {
      // fallback
    }
    setLocalData(STORAGE_KEYS.ACTIVITIES, getInitialSeedActivities());
    setLocalData(STORAGE_KEYS.TARGET, INITIAL_WEEKLY_TARGET);
    return true;
  },

  // Save / Update User Profile
  async updateProfile(payload: {
    name: string;
    heightCm: number;
    weightKg: number;
    heightUnit?: 'cm' | 'ft_in';
    weightUnit?: 'kg' | 'lb';
    dietPreference?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
    fitnessGoal?: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.success && json.user) {
        setLocalData(STORAGE_KEYS.USER, json.user);
        return { success: true, user: json.user };
      }
      return { success: false, error: json.error || 'Failed to update profile.' };
    } catch {
      // Local fallback
      const cached = getLocalData<User | null>(STORAGE_KEYS.USER, null);
      if (cached) {
        const updatedUser: User = {
          ...cached,
          ...payload,
          isProfileComplete: true
        };
        setLocalData(STORAGE_KEYS.USER, updatedUser);
        return { success: true, user: updatedUser };
      }
      return { success: false, error: 'Failed to update profile locally.' };
    }
  },

  // Generate AI Diet Chart & Activity Plan
  async generateDietChart(payload?: {
    name?: string;
    heightCm?: number;
    weightKg?: number;
    dietPreference?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
    fitnessGoal?: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  }): Promise<{ success: boolean; dietPlan?: DietPlan; activityPlan?: ActivityPlan; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/ai/diet-chart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload || {})
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.user) setLocalData(STORAGE_KEYS.USER, json.user);
        return { 
          success: true, 
          dietPlan: json.dietPlan, 
          activityPlan: json.activityPlan, 
          user: json.user 
        };
      }
    } catch {
      // Offline / Static fallback
    }

    // Client-side instant generator for static deployments
    const cachedUser = getLocalData<User | null>(STORAGE_KEYS.USER, null);
    const combinedPayload = {
      name: payload?.name || cachedUser?.name || 'Alex Morgan',
      heightCm: payload?.heightCm || cachedUser?.heightCm || 175,
      weightKg: payload?.weightKg || cachedUser?.weightKg || 68,
      dietPreference: payload?.dietPreference || cachedUser?.dietPreference || 'vegetarian',
      fitnessGoal: payload?.fitnessGoal || cachedUser?.fitnessGoal || 'eco_wellness'
    };

    const dietPlan = generateClientAIDietPlan(combinedPayload);
    const activityPlan = generateClientAIFitnessPlan(combinedPayload);
    if (cachedUser) {
      const updatedUser: User = {
        ...cachedUser,
        ...combinedPayload,
        dietPlan,
        activityPlan,
        isProfileComplete: true
      };
      setLocalData(STORAGE_KEYS.USER, updatedUser);
      return { success: true, dietPlan, activityPlan, user: updatedUser };
    }

    return { success: true, dietPlan, activityPlan };
  },

  // Get Diet Plan
  async getDietPlan(): Promise<{ success: boolean; dietPlan?: DietPlan; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/user/diet-plan`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.user) setLocalData(STORAGE_KEYS.USER, json.user);
        return { success: true, dietPlan: json.dietPlan, user: json.user };
      }
    } catch {
      // Offline fallback
    }

    const cachedUser = getLocalData<User | null>(STORAGE_KEYS.USER, null);
    if (cachedUser?.dietPlan) {
      return { success: true, dietPlan: cachedUser.dietPlan, user: cachedUser };
    }
    if (cachedUser?.heightCm && cachedUser?.weightKg) {
      const dietPlan = generateClientAIDietPlan(cachedUser);
      cachedUser.dietPlan = dietPlan;
      setLocalData(STORAGE_KEYS.USER, cachedUser);
      return { success: true, dietPlan, user: cachedUser };
    }
    return { success: false, error: 'No diet plan found.' };
  },

  // Generate AI Fitness Activity Plan
  async generateActivityPlan(payload?: {
    name?: string;
    heightCm?: number;
    weightKg?: number;
    fitnessGoal?: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  }): Promise<{ success: boolean; activityPlan?: ActivityPlan; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/ai/activity-plan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload || {})
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.user) setLocalData(STORAGE_KEYS.USER, json.user);
        return { success: true, activityPlan: json.activityPlan, user: json.user };
      }
    } catch {
      // Offline fallback
    }

    const cachedUser = getLocalData<User | null>(STORAGE_KEYS.USER, null);
    const combinedPayload = {
      name: payload?.name || cachedUser?.name || 'Alex Morgan',
      heightCm: payload?.heightCm || cachedUser?.heightCm || 175,
      weightKg: payload?.weightKg || cachedUser?.weightKg || 68,
      fitnessGoal: payload?.fitnessGoal || cachedUser?.fitnessGoal || 'eco_wellness'
    };

    const activityPlan = generateClientAIFitnessPlan(combinedPayload);
    if (cachedUser) {
      const updatedUser: User = {
        ...cachedUser,
        ...combinedPayload,
        activityPlan
      };
      setLocalData(STORAGE_KEYS.USER, updatedUser);
      return { success: true, activityPlan, user: updatedUser };
    }

    return { success: true, activityPlan };
  },

  // Get Activity Plan
  async getActivityPlan(): Promise<{ success: boolean; activityPlan?: ActivityPlan; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/user/activity-plan`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.user) setLocalData(STORAGE_KEYS.USER, json.user);
        return { success: true, activityPlan: json.activityPlan, user: json.user };
      }
    } catch {
      // Offline fallback
    }

    const cachedUser = getLocalData<User | null>(STORAGE_KEYS.USER, null);
    if (cachedUser?.activityPlan) {
      return { success: true, activityPlan: cachedUser.activityPlan, user: cachedUser };
    }
    if (cachedUser?.heightCm && cachedUser?.weightKg) {
      const activityPlan = generateClientAIFitnessPlan(cachedUser);
      cachedUser.activityPlan = activityPlan;
      setLocalData(STORAGE_KEYS.USER, cachedUser);
      return { success: true, activityPlan, user: cachedUser };
    }
    return { success: false, error: 'No activity plan found.' };
  },

  // Get Reminder Settings
  async getReminderSettings(): Promise<{ success: boolean; reminderSettings?: ReminderSettings; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/user/reminders`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.reminderSettings) setLocalData(STORAGE_KEYS.REMINDERS, json.reminderSettings);
        return { success: true, reminderSettings: json.reminderSettings };
      }
      return { success: false, error: json.error || 'Failed to fetch reminder settings.' };
    } catch {
      const cached = getLocalData<ReminderSettings | null>(STORAGE_KEYS.REMINDERS, null);
      if (cached) return { success: true, reminderSettings: cached };
      return { success: false, error: 'Could not fetch reminders.' };
    }
  },

  // Save / Update Reminder Settings
  async updateReminderSettings(settings: Partial<ReminderSettings>): Promise<{ success: boolean; reminderSettings?: ReminderSettings; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/user/reminders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (res.ok && json.success && json.reminderSettings) {
        setLocalData(STORAGE_KEYS.REMINDERS, json.reminderSettings);
        const cachedUser = getLocalData<User | null>(STORAGE_KEYS.USER, null);
        if (cachedUser) {
          cachedUser.reminderSettings = json.reminderSettings;
          setLocalData(STORAGE_KEYS.USER, cachedUser);
        }
        return { success: true, reminderSettings: json.reminderSettings };
      }
      return { success: false, error: json.error || 'Failed to save reminder settings.' };
    } catch {
      // Local fallback
      const cached = getLocalData<ReminderSettings | null>(STORAGE_KEYS.REMINDERS, null);
      if (cached) {
        const merged: ReminderSettings = { ...cached, ...settings, updatedAt: new Date().toISOString() };
        setLocalData(STORAGE_KEYS.REMINDERS, merged);
        return { success: true, reminderSettings: merged };
      }
      return { success: false, error: 'Failed to update reminders locally.' };
    }
  }
};
