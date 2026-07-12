import React from 'react';

export const Drivers: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-bold text-white">Driver Profiles</h2>
        <p className="text-slate-400 text-xs md:text-sm">Manage driver license logs, contact details, status, and assignments.</p>
      </div>

      <div className="glassmorphism rounded-xl p-8 border border-slate-800/80 flex flex-col items-center justify-center text-center py-20 gap-3">
        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl font-bold font-mono">D</div>
        <div>
          <p className="text-sm font-bold text-slate-200">Driver Management Console</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">License warning triggers, profile editors, and default vehicle assignments are scheduled for Phase 2 implementation.</p>
        </div>
      </div>
    </div>
  );
};
