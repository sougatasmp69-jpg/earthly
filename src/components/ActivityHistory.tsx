import React, { useState, useMemo } from 'react';
import { ActivityEntry, ActivityCategory, CATEGORY_CONFIGS } from '../types';
import { 
  History, 
  Trash2, 
  Search, 
  Calendar, 
  Car, 
  Bus, 
  Plane, 
  Zap, 
  Salad, 
  Utensils, 
  PlusCircle, 
  Download
} from 'lucide-react';

interface ActivityHistoryProps {
  activities: ActivityEntry[];
  onDeleteActivity: (id: string) => Promise<void>;
  onNavigateToLog: () => void;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  onDeleteActivity,
  onNavigateToLog
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const catName = CATEGORY_CONFIGS[a.category]?.name.toLowerCase() || '';
        const notes = a.notes?.toLowerCase() || '';
        if (!catName.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    });
  }, [activities, selectedCategory, startDate, endDate, searchQuery]);

  const totalFilteredEmissions = useMemo(() => {
    return Math.round(filteredActivities.reduce((acc, a) => acc + a.emissionsKg, 0) * 100) / 100;
  }, [filteredActivities]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) return;
    setDeletingId(id);
    try {
      await onDeleteActivity(id);
    } finally {
      setDeletingId(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Category', 'Quantity', 'Unit', 'Emissions (kg CO2)', 'Notes'];
    const rows = filteredActivities.map(a => [
      a.date,
      CATEGORY_CONFIGS[a.category]?.name || a.category,
      a.quantity,
      a.unit,
      a.emissionsKg,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `earthly_carbon_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (cat: ActivityCategory) => {
    switch (cat) {
      case 'car': return <Car className="w-4 h-4 text-orange-600" />;
      case 'bus': return <Bus className="w-4 h-4 text-sky-600" />;
      case 'flight': return <Plane className="w-4 h-4 text-purple-600" />;
      case 'electricity': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'veg_meal': return <Salad className="w-4 h-4 text-emerald-600" />;
      case 'non_veg_meal': return <Utensils className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-earthly-100 text-earthly-800 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5 text-earthly-600" />
            <span>Feature 4 · Carbon Activity Log & History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Activity History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your daily logged actions, calculate emissions drivers, and export logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredActivities.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToLog}
            className="px-5 py-2.5 text-xs font-black text-white bg-earthly-700 hover:bg-earthly-800 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-earthly-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="car">Car travel (0.20 kg/km)</option>
              <option value="bus">Bus travel (0.08 kg/km)</option>
              <option value="flight">Flight (0.25 kg/km)</option>
              <option value="electricity">Electricity (0.80 kg/kWh)</option>
              <option value="veg_meal">Veg meal (0.50 kg/meal)</option>
              <option value="non_veg_meal">Non-veg meal (2.00 kg/meal)</option>
            </select>
          </div>

          {/* Search Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Notes
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-earthly-500"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-earthly-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-earthly-500"
            />
          </div>

        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong>{filteredActivities.length}</strong> of {activities.length} total entries</span>
            <span>•</span>
            <span className="font-bold text-slate-900">Total Filtered CO₂: {totalFilteredEmissions} kg</span>
          </div>

          {(selectedCategory !== 'all' || searchQuery || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-earthly-700 font-bold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Activities Table / List */}
      {filteredActivities.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((entry) => {
              const cfg = CATEGORY_CONFIGS[entry.category];

              return (
                <div 
                  key={entry.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Category Icon & Details */}
                  <div className="flex items-start gap-3.5">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg?.bgColor || '#f1f5f9', color: cfg?.color || '#334155' }}
                    >
                      {getCategoryIcon(entry.category)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">
                          {cfg?.name || entry.category}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {entry.quantity} {entry.unit}
                        </span>
                        {entry.warningFlag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                            ⚠️ {entry.warningFlag}
                          </span>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-slate-600 leading-snug">
                          {entry.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {entry.date}
                        </span>
                        <span>•</span>
                        <span>Factor: {cfg?.factor} kg/{entry.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Calculated Emissions & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-slate-900">
                        +{entry.emissionsKg.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1">
                        kg CO₂
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Delete activity entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-earthly-50 text-earthly-700 flex items-center justify-center mx-auto text-xl font-bold">
            🌱
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No activity logs found
          </h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search filters or log a new carbon activity.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToLog}
              className="px-5 py-2.5 text-xs font-bold text-white bg-earthly-700 hover:bg-earthly-800 rounded-xl transition-all"
            >
              Log your first activity
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
