import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActivityEntry, WeeklyTarget, ActivityCategory, User, DietPlan, ActivityPlan, ReminderSettings, ActiveReminderAlert, ReminderType } from './types';
import { api } from './services/api';
import { notificationService } from './services/notificationService';
import { LoginPage } from './components/LoginPage';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DietPlanView } from './components/DietPlanView';
import { EditProfileModal } from './components/EditProfileModal';
import { HeaderBar } from './components/HeaderBar';
import { LogActivityCard } from './components/LogActivityCard';
import { UserProfileCard } from './components/UserProfileCard';
import { WeeklyDashboardPanel } from './components/WeeklyDashboardPanel';
import { Footer } from './components/Footer';
import { WeeklyTargetModal } from './components/WeeklyTargetModal';
import { DecisionsModal } from './components/DecisionsModal';
import { RemindersModal } from './components/RemindersModal';
import { InAppReminderAlert } from './components/InAppReminderAlert';
import { getWeekBounds } from './services/calculator';
import { CheckCircle2, Info } from 'lucide-react';

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  globalEnabled: true,
  soundEnabled: true,
  browserNotificationsEnabled: false,
  reminders: {
    breakfast: { id: 'breakfast', label: 'Breakfast Reminder', time: '08:00', enabled: true, icon: '🍳', description: 'Morning sustenance & hydration' },
    morning_snack: { id: 'morning_snack', label: 'Mid-Morning Snack', time: '10:30', enabled: true, icon: '🍏', description: 'Focus boost & healthy fats' },
    lunch: { id: 'lunch', label: 'Lunch Reminder', time: '13:00', enabled: true, icon: '🥗', description: 'Core midday metabolic fuel' },
    afternoon_snack: { id: 'afternoon_snack', label: 'Afternoon Snack', time: '16:30', enabled: true, icon: '🍵', description: 'Clean energy refuel' },
    dinner: { id: 'dinner', label: 'Dinner Reminder', time: '20:00', enabled: true, icon: '🍲', description: 'Restorative evening meal' },
    activity: { id: 'activity', label: 'Daily Fitness Activity', time: '18:30', enabled: true, icon: '⚡', description: 'Scheduled movement & exercise routine' }
  },
  lastFiredMap: {}
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'diet-plan'>('dashboard');
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [activityPlan, setActivityPlan] = useState<ActivityPlan | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [activeReminderAlert, setActiveReminderAlert] = useState<ActiveReminderAlert | null>(null);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState<WeeklyTarget>({
    targetKg: 50.0,
    weekStart: '',
    weekEnd: ''
  });
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isDecisionsModalOpen, setIsDecisionsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load user data once authenticated
  const loadUserData = useCallback(async (user?: User) => {
    try {
      const [fetchedTarget, fetchedActivities, fetchedDiet, fetchedActivity, fetchedReminders] = await Promise.all([
        api.getTarget(),
        api.getActivities(),
        api.getDietPlan(),
        api.getActivityPlan(),
        api.getReminderSettings()
      ]);
      setWeeklyTarget(fetchedTarget);
      setActivities(fetchedActivities);
      
      if (fetchedDiet.success && fetchedDiet.dietPlan) {
        setDietPlan(fetchedDiet.dietPlan);
      } else if (user?.dietPlan) {
        setDietPlan(user.dietPlan);
      }

      if (fetchedActivity.success && fetchedActivity.activityPlan) {
        setActivityPlan(fetchedActivity.activityPlan);
      } else if (user?.activityPlan) {
        setActivityPlan(user.activityPlan);
      }

      if (fetchedReminders.success && fetchedReminders.reminderSettings) {
        setReminderSettings(fetchedReminders.reminderSettings);
      } else if (user?.reminderSettings) {
        setReminderSettings(user.reminderSettings);
      }
    } catch (err) {
      console.error('Error loading user carbon/diet/activity data:', err);
    }
  }, []);

  // Check existing session on boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (user.dietPlan) setDietPlan(user.dietPlan);
          if (user.activityPlan) setActivityPlan(user.activityPlan);
          if (user.reminderSettings) setReminderSettings(user.reminderSettings);
          await loadUserData(user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    initAuth();
  }, [loadUserData]);

  // Automated background alarm check ticker (every 15 seconds)
  useEffect(() => {
    if (!currentUser || !reminderSettings || !reminderSettings.globalEnabled) return;

    const intervalId = setInterval(() => {
      const trigger = notificationService.checkDueReminders(reminderSettings, dietPlan, activityPlan);
      if (trigger) {
        const { dueType, alert } = trigger;

        // Play sound if enabled
        if (reminderSettings.soundEnabled) {
          notificationService.playAlarmChime();
        }

        // Send browser push if enabled
        if (reminderSettings.browserNotificationsEnabled) {
          notificationService.sendBrowserNotification(alert.title, alert.subtitle);
        }

        // Show in-app alert
        setActiveReminderAlert(alert);

        // Mark as fired today to prevent repeated triggers
        const todayKey = notificationService.getTodayDateKey();
        const updatedSettings: ReminderSettings = {
          ...reminderSettings,
          lastFiredMap: {
            ...reminderSettings.lastFiredMap,
            [dueType]: todayKey
          }
        };
        setReminderSettings(updatedSettings);
        api.updateReminderSettings(updatedSettings);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [currentUser, reminderSettings, dietPlan, activityPlan]);

  // Handle Save Reminders
  const handleSaveReminders = async (updated: ReminderSettings) => {
    setReminderSettings(updated);
    const res = await api.updateReminderSettings(updated);
    if (res.success && res.reminderSettings) {
      setReminderSettings(res.reminderSettings);
      if (currentUser) {
        setCurrentUser({ ...currentUser, reminderSettings: res.reminderSettings });
      }
      showToast('⏰ Reminder & alarm preferences saved!', 'success');
    }
  };

  // Handle Test Single Reminder
  const handleTestReminder = (type: ReminderType) => {
    if (reminderSettings.soundEnabled) {
      notificationService.playAlarmChime();
    }
    const alert = notificationService.createAlert(type, dietPlan, activityPlan);
    if (reminderSettings.browserNotificationsEnabled) {
      notificationService.sendBrowserNotification(alert.title, alert.subtitle);
    }
    setActiveReminderAlert(alert);
    showToast(`🔔 Tested ${alert.title} alert!`, 'info');
  };

  // Handle Snooze Reminder (10 minutes)
  const handleSnoozeReminder = (alert: ActiveReminderAlert) => {
    setActiveReminderAlert(null);
    showToast(`💤 Snoozed ${alert.title} for 10 minutes.`, 'info');
    setTimeout(() => {
      if (reminderSettings.soundEnabled) {
        notificationService.playAlarmChime();
      }
      if (reminderSettings.browserNotificationsEnabled) {
        notificationService.sendBrowserNotification(`[Snoozed] ${alert.title}`, alert.subtitle);
      }
      setActiveReminderAlert({
        ...alert,
        id: `snooze-${alert.type}-${Date.now()}`,
        badge: 'Snoozed (10m)'
      });
    }, 600000); // 10 minutes
  };

  // Handle View in Plan
  const handleViewReminderPlan = (_target: 'diet' | 'activity') => {
    setActiveView('diet-plan');
    setActiveReminderAlert(null);
  };

  // Handle successful login or auto-signup
  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    if (user.dietPlan) setDietPlan(user.dietPlan);
    if (user.activityPlan) setActivityPlan(user.activityPlan);
    if (user.reminderSettings) setReminderSettings(user.reminderSettings);
    await loadUserData(user);
    
    // Check if onboarding is needed
    if (!user.isProfileComplete || !user.heightCm || !user.weightKg) {
      showToast(`👋 Welcome, ${user.name}! Please complete your quick profile setup.`, 'info');
    } else {
      showToast(`🌱 Welcome back, ${user.name}! Your dashboard is ready.`, 'success');
    }
  };

  // Handle onboarding completion (generates both Diet Plan & Activity Plan)
  const handleOnboardingComplete = (updatedUser: User, generatedDietPlan: DietPlan, generatedActivityPlan?: ActivityPlan | null) => {
    setCurrentUser(updatedUser);
    setDietPlan(generatedDietPlan);
    if (generatedActivityPlan) {
      setActivityPlan(generatedActivityPlan);
    } else if (updatedUser.activityPlan) {
      setActivityPlan(updatedUser.activityPlan);
    }
    if (updatedUser.reminderSettings) {
      setReminderSettings(updatedUser.reminderSettings);
    }
    setActiveView('diet-plan');
    showToast(`✨ Personalized diet chart & fitness plan ready for ${updatedUser.name}!`, 'success');
  };

  // Handle edit & save profile (regenerates both Diet and Activity plans on weight/metric changes)
  const handleSaveProfile = async (payload: {
    name: string;
    heightCm: number;
    weightKg: number;
    heightUnit: 'cm' | 'ft_in';
    weightUnit: 'kg' | 'lb';
    dietPreference: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
    fitnessGoal: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  }) => {
    // 1. Update Profile
    const profileRes = await api.updateProfile(payload);
    if (!profileRes.success || !profileRes.user) {
      return { success: false, error: profileRes.error || 'Failed to update profile.' };
    }

    setCurrentUser(profileRes.user);

    // 2. Automatically regenerate diet chart and activity plan with updated body metrics
    const dietRes = await api.generateDietChart(payload);
    if (dietRes.success && dietRes.dietPlan) {
      setDietPlan(dietRes.dietPlan);
      if (dietRes.activityPlan) setActivityPlan(dietRes.activityPlan);
      if (dietRes.user) setCurrentUser(dietRes.user);
      showToast('✨ Profile updated & personalized diet and activity plans regenerated!', 'success');
      return { 
        success: true, 
        user: dietRes.user || profileRes.user, 
        dietPlan: dietRes.dietPlan,
        activityPlan: dietRes.activityPlan
      };
    }

    showToast('Profile saved successfully.', 'success');
    return { success: true, user: profileRes.user };
  };

  // Handle regenerate diet & activity plans
  const handleRegenerateDietPlan = async () => {
    if (!currentUser) return;
    const res = await api.generateDietChart({
      name: currentUser.name,
      heightCm: currentUser.heightCm,
      weightKg: currentUser.weightKg,
      dietPreference: currentUser.dietPreference,
      fitnessGoal: currentUser.fitnessGoal
    });
    if (res.success && res.dietPlan) {
      setDietPlan(res.dietPlan);
      if (res.activityPlan) setActivityPlan(res.activityPlan);
      if (res.user) setCurrentUser(res.user);
      showToast('🔄 Refreshed your personalized AI diet & activity plans!', 'success');
    } else {
      showToast(res.error || 'Failed to regenerate plans.', 'info');
    }
  };

  // Handle regenerate activity plan independently
  const handleRegenerateActivityPlan = async () => {
    if (!currentUser) return;
    const res = await api.generateActivityPlan({
      name: currentUser.name,
      heightCm: currentUser.heightCm,
      weightKg: currentUser.weightKg,
      fitnessGoal: currentUser.fitnessGoal
    });
    if (res.success && res.activityPlan) {
      setActivityPlan(res.activityPlan);
      if (res.user) setCurrentUser(res.user);
      showToast('🔄 Refreshed your personalized AI fitness activity plan!', 'success');
    } else {
      showToast(res.error || 'Failed to regenerate activity plan.', 'info');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setDietPlan(null);
    setActivityPlan(null);
    setActivities([]);
    setActiveView('dashboard');
    showToast('👋 You have been logged out.', 'info');
  };

  // Current ISO Monday-Sunday tracking week bounds
  const currentWeek = useMemo(() => getWeekBounds(new Date()), []);

  // Format date range string: e.g. "Sep 14 - Sep 20, 2026"
  const dateRangeLabel = useMemo(() => {
    const s = currentWeek.monday;
    const e = currentWeek.sunday;
    const startStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }, [currentWeek]);

  // Compute active week's total emissions
  const weeklyEmissionsKg = useMemo(() => {
    return activities
      .filter(a => a.date >= currentWeek.startStr && a.date <= currentWeek.endStr)
      .reduce((acc, a) => acc + a.emissionsKg, 0);
  }, [activities, currentWeek]);

  // Handle Log Activity (Feature 1)
  const handleLogActivity = async (payload: {
    category: ActivityCategory;
    quantity: number;
    date: string;
    notes?: string;
    warningFlag?: string;
  }) => {
    const newEntry = await api.logActivity(payload);
    setActivities(prev => [newEntry, ...prev]);
    showToast(`✅ Logged ${newEntry.quantity} ${newEntry.unit} (+${newEntry.emissionsKg.toFixed(2)} kg CO₂) successfully!`, 'success');
  };

  // Handle Delete Activity
  const handleDeleteActivity = async (id: string) => {
    await api.deleteActivity(id);
    setActivities(prev => prev.filter(a => a.id !== id));
    showToast('Activity removed from log.', 'info');
  };

  // Handle Update Weekly Target (Feature 3)
  const handleSaveTarget = async (targetKg: number) => {
    const updated = await api.updateTarget(targetKg);
    setWeeklyTarget(updated);
    if (currentUser) {
      setCurrentUser({ ...currentUser, weeklyTargetKg: targetKg });
    }
    showToast(`🎯 Weekly target updated to ${targetKg} kg CO₂/week.`, 'success');
  };

  // Handle Reset Demo Seed
  const handleResetSeed = async () => {
    await api.resetSeedData();
    await loadUserData(currentUser || undefined);
    showToast('🔄 Restored 14 sample demo activities.', 'success');
  };

  // Loading state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading Earthly...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render LoginPage
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onLogin={api.login}
      />
    );
  }

  // Post-Login Check: If profile is incomplete, render OnboardingScreen
  const isProfileIncomplete = !currentUser.isProfileComplete || !currentUser.heightCm || !currentUser.weightKg;
  if (isProfileIncomplete) {
    return (
      <OnboardingScreen 
        currentUser={currentUser}
        onComplete={handleOnboardingComplete}
        onGenerateDietChart={api.generateDietChart}
      />
    );
  }

  // If logged in & profile complete, render Main Application (Dashboard or Diet Plan)
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200 relative overflow-x-hidden">
      
      {/* Subtle Blurred Bokeh Glow Orbs Floating in Background */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px] pointer-events-none animate-float-slow" />
      <div className="fixed top-12 left-1/3 w-[30rem] h-[30rem] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none animate-float-reverse" />
      <div className="fixed bottom-10 right-0 w-[28rem] h-[28rem] bg-pink-600/15 rounded-full blur-[150px] pointer-events-none animate-float-slow" />
      <div className="fixed bottom-24 left-12 w-80 h-80 bg-emerald-600/15 rounded-full blur-[130px] pointer-events-none animate-float-reverse" />

      {/* Header Bar */}
      <HeaderBar 
        weeklyTarget={weeklyTarget}
        weeklyEmissionsKg={weeklyEmissionsKg}
        onOpenTargetModal={() => setIsTargetModalOpen(true)}
        onOpenDecisions={() => setIsDecisionsModalOpen(true)}
        onResetSeed={handleResetSeed}
        dateRangeLabel={dateRangeLabel}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenReminders={() => setIsRemindersModalOpen(true)}
      />

      {/* In-App Floating Reminder & Alarm Alert */}
      <InAppReminderAlert 
        alert={activeReminderAlert}
        onDismiss={() => setActiveReminderAlert(null)}
        onSnooze={handleSnoozeReminder}
        onViewPlan={handleViewReminderPlan}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 z-10">
        
        {activeView === 'diet-plan' && dietPlan ? (
          /* Diet & Activity Plan View */
          <DietPlanView 
            dietPlan={dietPlan}
            activityPlan={activityPlan || currentUser.activityPlan || null}
            currentUser={currentUser}
            onRegenerate={handleRegenerateDietPlan}
            onRegenerateActivityPlan={handleRegenerateActivityPlan}
            onBackToDashboard={() => setActiveView('dashboard')}
            onEditMetrics={() => setIsProfileModalOpen(true)}
            onOpenReminders={() => setIsRemindersModalOpen(true)}
          />
        ) : (
          /* Carbon Footprint Dashboard View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Log an Activity Card + User Profile Panel (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Log an Activity Card */}
              <LogActivityCard 
                onLogActivity={handleLogActivity}
              />

              {/* User Profile Panel with Diet Plan Shortcut & Edit Profile Trigger & Alarms */}
              <UserProfileCard 
                currentUser={currentUser}
                onLogout={handleLogout}
                onViewDietPlan={() => setActiveView('diet-plan')}
                onEditProfile={() => setIsProfileModalOpen(true)}
                onOpenReminders={() => setIsRemindersModalOpen(true)}
              />

            </div>

            {/* Right Column: Weekly Footprint Dashboard Panel (8 cols on lg) */}
            <div className="lg:col-span-8">
              <WeeklyDashboardPanel 
                activities={activities}
                weeklyTarget={weeklyTarget}
                onDeleteActivity={handleDeleteActivity}
                onOpenTargetModal={() => setIsTargetModalOpen(true)}
              />
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer 
        onOpenDecisions={() => setIsDecisionsModalOpen(true)}
        onResetSeed={handleResetSeed}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-card-dark text-white text-xs font-bold shadow-2xl animate-slide-up border border-teal-500/30">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <WeeklyTargetModal 
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        currentTarget={weeklyTarget}
        onSaveTarget={handleSaveTarget}
      />

      <DecisionsModal 
        isOpen={isDecisionsModalOpen}
        onClose={() => setIsDecisionsModalOpen(false)}
      />

      {/* Reminders & Alarms Modal */}
      <RemindersModal 
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminderSettings={reminderSettings}
        dietPlan={dietPlan}
        activityPlan={activityPlan || currentUser.activityPlan || null}
        onSave={handleSaveReminders}
        onTestReminder={handleTestReminder}
      />

      {/* Edit Profile & Metrics Modal */}
      {currentUser && (
        <EditProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onSaveProfile={handleSaveProfile}
        />
      )}

    </div>
  );
};

export default App;

