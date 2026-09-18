import { ReminderType, ReminderSettings, ReminderConfig, DietPlan, ActivityPlan, ActiveReminderAlert } from '../types';

class NotificationService {
  private audioCtx: AudioContext | null = null;

  // Initialize Web Audio Context on user gesture or demand
  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Play synthesized chime using Web Audio API
  public playAlarmChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.36);

      // Note 2: A5 (880.00 Hz) - uplifting harmony
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.16);

      gain2.gain.setValueAtTime(0.001, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.16);
      osc2.stop(now + 0.76);

      // Note 3: F#5 (739.99 Hz) - gentle third chord tone
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(739.99, now + 0.24);

      gain3.gain.setValueAtTime(0.001, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.18, now + 0.28);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.24);
      osc3.stop(now + 0.86);
    } catch (e) {
      console.warn('Could not play audio chime:', e);
    }
  }

  // Check if browser notifications are supported
  public isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Get current browser notification permission
  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!this.isNotificationSupported()) return 'unsupported';
    return Notification.permission;
  }

  // Request browser notification permission
  public async requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isNotificationSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  // Send native browser notification
  public sendBrowserNotification(title: string, body: string): boolean {
    if (!this.isNotificationSupported() || Notification.permission !== 'granted') {
      return false;
    }
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'earthly-reminder',
        silent: false
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get local day name (e.g., 'Monday')
  public getTodayDayName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  // Get current local time in HH:mm (24-hour format)
  public getCurrentTimeHHMM(): string {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // Get local date key YYYY-MM-DD
  public getTodayDateKey(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Extract contextual details for a given reminder type from Diet and Activity plans
  public getReminderDetails(
    type: ReminderType,
    dietPlan?: DietPlan | null,
    activityPlan?: ActivityPlan | null
  ): { title: string; subtitle: string; details: string; badge?: string; planTarget: 'diet' | 'activity' } {
    const today = this.getTodayDayName();

    switch (type) {
      case 'breakfast': {
        const meal = dietPlan?.meals?.breakfast;
        return {
          title: 'Breakfast Reminder 🍳',
          subtitle: meal?.name || meal?.title || 'Time for a nourishing morning meal',
          details: meal ? `${meal.portion} • ${meal.calories} kcal • ${meal.carbonKg} kg CO₂` : 'Fuel your morning with high-protein, eco-friendly energy.',
          badge: meal?.calories ? `${meal.calories} kcal` : 'Morning Fuel',
          planTarget: 'diet'
        };
      }
      case 'morning_snack': {
        const meal = dietPlan?.meals?.morningSnack;
        return {
          title: 'Mid-Morning Snack 🍏',
          subtitle: meal?.name || meal?.title || 'Quick hydration and healthy snack break',
          details: meal ? `${meal.portion} • ${meal.calories} kcal` : 'Keep your metabolism steady with fresh fruits or nuts.',
          badge: meal?.calories ? `${meal.calories} kcal` : 'Energy Boost',
          planTarget: 'diet'
        };
      }
      case 'lunch': {
        const meal = dietPlan?.meals?.lunch;
        return {
          title: 'Lunch Reminder 🥗',
          subtitle: meal?.name || meal?.title || 'Time for your balanced midday lunch',
          details: meal ? `${meal.portion} • ${meal.calories} kcal • ${meal.carbonKg} kg CO₂` : 'Enjoy a balanced plate with rich fiber and clean proteins.',
          badge: meal?.calories ? `${meal.calories} kcal` : 'Midday Power',
          planTarget: 'diet'
        };
      }
      case 'afternoon_snack': {
        const meal = dietPlan?.meals?.afternoonSnack;
        return {
          title: 'Afternoon Refresh 🍵',
          subtitle: meal?.name || meal?.title || 'Afternoon tea & energizing bite',
          details: meal ? `${meal.portion} • ${meal.calories} kcal` : 'Stay sharp and hydrated with green tea or seeds.',
          badge: meal?.calories ? `${meal.calories} kcal` : 'Refuel',
          planTarget: 'diet'
        };
      }
      case 'dinner': {
        const meal = dietPlan?.meals?.dinner;
        return {
          title: 'Dinner Reminder 🍲',
          subtitle: meal?.name || meal?.title || 'Wholesome evening dinner',
          details: meal ? `${meal.portion} • ${meal.calories} kcal • ${meal.carbonKg} kg CO₂` : 'Wind down with a light, nutrient-packed low-carbon dinner.',
          badge: meal?.calories ? `${meal.calories} kcal` : 'Evening Meal',
          planTarget: 'diet'
        };
      }
      case 'activity': {
        const scheduleToday = activityPlan?.schedule?.find(s => s.day.toLowerCase() === today.toLowerCase());
        const activityTitle = scheduleToday?.focusTitle || scheduleToday?.routine?.[0]?.name || 'Personalized Workout Session';
        const duration = scheduleToday?.totalDurationMinutes ? `${scheduleToday.totalDurationMinutes} mins` : '30-45 mins';
        const burn = scheduleToday?.estimatedCalorieBurn ? `~${scheduleToday.estimatedCalorieBurn} kcal` : '';

        return {
          title: 'Fitness Activity Alarm ⚡',
          subtitle: `${activityTitle} (${duration})`,
          details: `${today}'s Session: ${scheduleToday?.wellnessNote || 'Movement & body conditioning'} ${burn ? `• Estimated Burn: ${burn}` : ''}`,
          badge: scheduleToday?.day || today,
          planTarget: 'activity'
        };
      }
      default:
        return {
          title: 'Scheduled Earthly Reminder ⏰',
          subtitle: 'Stay on track with your eco & wellness goals',
          details: 'Check your personalized daily timeline.',
          planTarget: 'diet'
        };
    }
  }

  // Create an active reminder alert payload
  public createAlert(
    type: ReminderType,
    dietPlan?: DietPlan | null,
    activityPlan?: ActivityPlan | null
  ): ActiveReminderAlert {
    const details = this.getReminderDetails(type, dietPlan, activityPlan);
    return {
      id: `alert-${type}-${Date.now()}`,
      type,
      title: details.title,
      subtitle: details.subtitle,
      details: details.details,
      badge: details.badge,
      time: this.getCurrentTimeHHMM(),
      planTarget: details.planTarget,
      timestamp: Date.now()
    };
  }

  // Evaluate if any reminder needs to fire right now
  public checkDueReminders(
    settings: ReminderSettings | undefined | null,
    dietPlan?: DietPlan | null,
    activityPlan?: ActivityPlan | null
  ): { dueType: ReminderType; alert: ActiveReminderAlert } | null {
    if (!settings || !settings.globalEnabled) return null;

    const currentTime = this.getCurrentTimeHHMM(); // "13:00"
    const todayKey = this.getTodayDateKey(); // "2026-09-19"

    const [curH, curM] = currentTime.split(':').map(Number);
    const curTotalMinutes = curH * 60 + curM;

    const reminderList: ReminderConfig[] = Object.values(settings.reminders).filter(Boolean) as ReminderConfig[];

    for (const reminder of reminderList) {
      if (!reminder.enabled) continue;

      // If already fired today, check lastFiredMap or reminder.lastFiredDate
      const lastFired = settings.lastFiredMap?.[reminder.id] || reminder.lastFiredDate;
      if (lastFired === todayKey) continue;

      const [remH, remM] = reminder.time.split(':').map(Number);
      const remTotalMinutes = remH * 60 + remM;

      // Trigger if current time is within [remTotalMinutes, remTotalMinutes + 15]
      // This allows catching the reminder if the tab is opened within 15 minutes of the alarm
      if (curTotalMinutes >= remTotalMinutes && curTotalMinutes <= remTotalMinutes + 15) {
        const alert = this.createAlert(reminder.id, dietPlan, activityPlan);
        return {
          dueType: reminder.id,
          alert
        };
      }
    }

    return null;
  }
}

export const notificationService = new NotificationService();
