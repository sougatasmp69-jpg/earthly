import React, { useState, useEffect } from 'react';
import { ReminderSettings, ReminderConfig, ReminderType, DietPlan, ActivityPlan } from '../types';
import { notificationService } from '../services/notificationService';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderSettings: ReminderSettings;
  dietPlan?: DietPlan | null;
  activityPlan?: ActivityPlan | null;
  onSave: (settings: ReminderSettings) => Promise<void>;
  onTestReminder: (type: ReminderType) => void;
}

const DEFAULT_TIMES: Record<ReminderType, string> = {
  breakfast: '08:00',
  morning_snack: '10:30',
  lunch: '13:00',
  afternoon_snack: '16:30',
  dinner: '20:00',
  activity: '18:30'
};

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  reminderSettings,
  dietPlan,
  activityPlan,
  onSave,
  onTestReminder
}) => {
  const [localSettings, setLocalSettings] = useState<ReminderSettings>(reminderSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  useEffect(() => {
    setLocalSettings(reminderSettings);
  }, [reminderSettings, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setNotificationPermission(notificationService.getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleGlobal = (globalEnabled: boolean) => {
    setLocalSettings(prev => ({ ...prev, globalEnabled }));
  };

  const handleToggleSound = (soundEnabled: boolean) => {
    setLocalSettings(prev => ({ ...prev, soundEnabled }));
  };

  const handleTogglePush = (browserNotificationsEnabled: boolean) => {
    setLocalSettings(prev => ({ ...prev, browserNotificationsEnabled }));
  };

  const handleToggleReminder = (type: ReminderType, enabled: boolean) => {
    setLocalSettings(prev => {
      const currentConfig = prev.reminders[type];
      if (!currentConfig) return prev;
      return {
        ...prev,
        reminders: {
          ...prev.reminders,
          [type]: {
            ...currentConfig,
            enabled
          }
        }
      };
    });
  };

  const handleTimeChange = (type: ReminderType, time: string) => {
    setLocalSettings(prev => {
      const currentConfig = prev.reminders[type];
      if (!currentConfig) return prev;
      return {
        ...prev,
        reminders: {
          ...prev.reminders,
          [type]: {
            ...currentConfig,
            time
          }
        }
      };
    });
  };

  const handleResetDefaults = () => {
    setLocalSettings(prev => {
      const updatedReminders = { ...prev.reminders };
      (Object.keys(updatedReminders) as ReminderType[]).forEach(k => {
        if (updatedReminders[k]) {
          updatedReminders[k] = {
            ...updatedReminders[k]!,
            time: DEFAULT_TIMES[k] || updatedReminders[k]!.time,
            enabled: true
          };
        }
      });
      return {
        ...prev,
        globalEnabled: true,
        soundEnabled: true,
        reminders: updatedReminders
      };
    });
  };

  const handleRequestPermission = async () => {
    const res = await notificationService.requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      setLocalSettings(prev => ({ ...prev, browserNotificationsEnabled: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get dynamic meal/workout preview info
  const getContextualInfo = (reminder: ReminderConfig) => {
    const details = notificationService.getReminderDetails(reminder.id, dietPlan, activityPlan);
    return details;
  };

  const reminderList: ReminderConfig[] = Object.values(localSettings.reminders).filter(Boolean) as ReminderConfig[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden my-8">
        {/* Glow ambient background highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              ⏰
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Meal & Activity Reminders
              </h2>
              <p className="text-xs text-slate-400">
                Automated schedule synced with your AI Diet & Fitness Routine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Master Controls Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Master Switch */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">All Reminders</p>
                <p className="text-[11px] text-slate-400">Master on/off switch</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.globalEnabled}
                  onChange={e => handleToggleGlobal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Sound Chime Switch */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Chime Sound</p>
                <p className="text-[11px] text-slate-400">Audio alarm tone</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.soundEnabled}
                  onChange={e => handleToggleSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Browser Push Switch */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Browser Push</p>
                <p className="text-[11px] text-slate-400">System notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.browserNotificationsEnabled}
                  onChange={e => handleTogglePush(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Browser Notification Banner if not granted */}
          {notificationPermission !== 'granted' && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔔</span>
                <div>
                  <p className="text-xs font-semibold text-cyan-200">
                    Enable System Push Notifications
                  </p>
                  <p className="text-[11px] text-cyan-300/70">
                    Receive alarms even when this tab is minimized or in the background.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-enable-browser-push"
                onClick={handleRequestPermission}
                className="py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Allow Notifications
              </button>
            </div>
          )}

          {/* Individual Reminders Schedule List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Daily Schedule & Times (24h / Local Time)
              </h3>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
              >
                Reset Default Times
              </button>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {reminderList.map(reminder => {
                const info = getContextualInfo(reminder);
                const isFitness = reminder.id === 'activity';

                return (
                  <div
                    key={reminder.id}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all border ${
                      reminder.enabled
                        ? isFitness
                          ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-800/30 border-slate-800 opacity-60'
                    } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
                  >
                    {/* Left: Icon & Label */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={reminder.enabled}
                          onChange={e => handleToggleReminder(reminder.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>

                      <div className="w-9 h-9 rounded-xl bg-slate-700/60 border border-slate-600 flex items-center justify-center text-base flex-shrink-0">
                        {reminder.icon || (isFitness ? '⚡' : '🥗')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {reminder.label}
                          </span>
                          {info.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                              {info.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {info.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: Time Input & Test Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <div className="relative">
                        <input
                          type="time"
                          value={reminder.time}
                          disabled={!reminder.enabled}
                          onChange={e => handleTimeChange(reminder.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-white text-sm font-mono font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-40"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onTestReminder(reminder.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-700/70 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-semibold border border-slate-600/60 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Simulate this alarm right now"
                      >
                        <span>🔔</span>
                        <span className="hidden sm:inline">Test</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={() => onTestReminder('breakfast')}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              🔔 Test Chime Sound
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="btn-save-reminders"
                disabled={isSaving}
                className="py-2 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  '✓ Saved!'
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
