import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Bus, 
  Plane, 
  Zap, 
  Utensils, 
  Salad, 
  Trash2, 
  Search, 
  Download, 
  Calendar
} from 'lucide-react';
import { ActivityEntry, ActivityCategory, CATEGORY_CONFIGS } from '../types';

interface LoggedActivitiesTableProps {
  activities: ActivityEntry[];
  onDeleteActivity: (id: string) => Promise<void>;
}

export const LoggedActivitiesTable: React.FC<LoggedActivitiesTableProps> = ({
  activities,
  onDeleteActivity
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Category icons helper
  const renderCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'car':
        return <Car className="w-3.5 h-3.5 text-orange-400" />;
      case 'bus':
        return <Bus className="w-3.5 h-3.5 text-cyan-400" />;
      case 'flight':
        return <Plane className="w-3.5 h-3.5 text-purple-400" />;
      case 'electricity':
        return <Zap className="w-3.5 h-3.5 text-sky-400" />;
      case 'veg_meal':
        return <Salad className="w-3.5 h-3.5 text-emerald-400" />;
      case 'non_veg_meal':
        return <Utensils className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  // Filtered & searched entries
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Category filter
      if (filterCategory === 'meals') {
        if (act.category !== 'veg_meal' && act.category !== 'non_veg_meal') return false;
      } else if (filterCategory !== 'all' && act.category !== filterCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const config = CATEGORY_CONFIGS[act.category];
        const matchName = config?.name.toLowerCase().includes(query);
        const matchNotes = act.notes?.toLowerCase().includes(query);
        const matchDate = act.date.includes(query);
        const matchQty = `${act.quantity} ${act.unit}`.toLowerCase().includes(query);
        return matchName || matchNotes || matchDate || matchQty;
      }

      return true;
    });
  }, [activities, filterCategory, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteActivity(id);
    } finally {
      setDeletingId(null);
    }
  };

  // CSV export handler
  const handleExportCSV = () => {
    if (activities.length === 0) return;
    const headers = ['Date', 'Category', 'Quantity', 'Unit', 'Emissions (kg CO2)', 'Notes'];
    const rows = activities.map(a => [
      a.date,
      CATEGORY_CONFIGS[a.category]?.name || a.category,
      a.quantity,
      a.unit,
      a.emissionsKg,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `earthly_logged_activities_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card-dark rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Logged Activities</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">Review and manage your daily emission records.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className="glass-input-dark rounded-xl pl-8 pr-3 py-1.5 text-xs w-36 sm:w-44 focus:ring-1 focus:ring-teal-400"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5 pb-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'car', label: 'Car' },
          { id: 'bus', label: 'Bus' },
          { id: 'flight', label: 'Flight' },
          { id: 'electricity', label: 'Electricity' },
          { id: 'meals', label: 'Meals' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filterCategory === cat.id
                ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border border-white/5 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950/50">
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3.5">Timestamp</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">kg CO₂</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No matching activity entries found.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const config = CATEGORY_CONFIGS[act.category];

                  return (
                    <tr 
                      key={act.id} 
                      className="hover:bg-slate-900/60 transition-colors group"
                    >
                      {/* Timestamp / Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{act.date}</span>
                        </div>
                        {act.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-xs mt-0.5">
                            {act.notes}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-[11px] font-medium text-slate-200">
                          {renderCategoryIcon(act.category)}
                          <span>{config?.name || act.category}</span>
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono text-slate-300">
                        {act.quantity} <span className="text-slate-500">{act.unit}</span>
                      </td>

                      {/* kg CO2 */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-white">
                        <span className="text-emerald-400">+{act.emissionsKg.toFixed(2)}</span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(act.id)}
                          disabled={deletingId === act.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
