import React from 'react';

export const Trips: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-bold text-white">Trips & Dispatch</h2>
        <p className="text-slate-400 text-xs md:text-sm">Dispatch new journeys and monitor ongoing trip coordinates and weights.</p>
      </div>

      <div className="glassmorphism rounded-xl p-8 border border-slate-800/80 flex flex-col items-center justify-center text-center py-20 gap-3">
        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl font-bold">T</div>
        <div>
          <p className="text-sm font-bold text-slate-200">Trip Dispatch Panel</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">Multi-step dispatch form wizard and transaction validations are scheduled for Phase 3 implementation.</p>
        </div>
      </div>
    </div>
  );
};
