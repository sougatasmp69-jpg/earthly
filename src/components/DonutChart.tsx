import React from 'react';
import { ActivityCategory } from '../types';

interface CategoryEmissionItem {
  category: ActivityCategory;
  name: string;
  totalQuantity: number;
  unit: string;
  totalEmissionsKg: number;
  percentage: number;
  entryCount: number;
}

interface DonutChartProps {
  categories: CategoryEmissionItem[];
  totalWeekEmissionsKg: number;
}

const CATEGORY_COLORS: Record<ActivityCategory, { stroke: string; fillBg: string; text: string }> = {
  car: { stroke: '#f97316', fillBg: 'rgba(249, 115, 22, 0.15)', text: 'text-orange-400' },
  electricity: { stroke: '#38bdf8', fillBg: 'rgba(56, 189, 248, 0.15)', text: 'text-sky-400' },
  flight: { stroke: '#a855f7', fillBg: 'rgba(168, 85, 247, 0.15)', text: 'text-purple-400' },
  non_veg_meal: { stroke: '#f43f5e', fillBg: 'rgba(244, 63, 94, 0.15)', text: 'text-rose-400' },
  veg_meal: { stroke: '#10b981', fillBg: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400' },
  bus: { stroke: '#06b6d4', fillBg: 'rgba(6, 182, 212, 0.15)', text: 'text-cyan-400' }
};

export const DonutChart: React.FC<DonutChartProps> = ({
  categories,
  totalWeekEmissionsKg
}) => {
  const activeSlices = categories.filter(c => c.totalEmissionsKg > 0);

  // SVG parameters
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
      
      {/* SVG Donut Chart */}
      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Active Slices */}
          {activeSlices.length === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
          ) : (
            activeSlices.map((slice) => {
              const slicePercent = slice.percentage / 100;
              const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += slicePercent;
              const colorInfo = CATEGORY_COLORS[slice.category] || { stroke: '#38bdf8' };

              return (
                <circle
                  key={slice.category}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={colorInfo.stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-700 hover:opacity-80"
                  style={{
                    filter: `drop-shadow(0 0 4px ${colorInfo.stroke}88)`
                  }}
                />
              );
            })
          )}
        </svg>

        {/* Centered Donut Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Emission Sources
          </span>
          <span className="text-xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
            {totalWeekEmissionsKg.toFixed(1)}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">kg CO₂ total</span>
        </div>
      </div>

      {/* Legend & Breakdown Chips */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-white/10 text-slate-400 font-medium">
          <span>Emission Breakdown</span>
          <span>Share</span>
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {categories.map((item) => {
            const colorInfo = CATEGORY_COLORS[item.category] || { stroke: '#94a3b8', text: 'text-slate-400' };
            const isZero = item.totalEmissionsKg === 0;

            return (
              <div 
                key={item.category}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors ${
                  isZero ? 'opacity-40' : 'bg-slate-900/60 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: colorInfo.stroke }}
                  />
                  <span className="text-slate-200 font-medium truncate max-w-[120px]">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {item.totalEmissionsKg.toFixed(1)} kg
                  </span>
                  <span className={`font-bold font-mono text-[11px] w-10 text-right ${colorInfo.text}`}>
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
