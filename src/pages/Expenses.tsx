import React from 'react';

export const Expenses: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-bold text-white">Expense Approvals</h2>
        <p className="text-slate-400 text-xs md:text-sm">Approve or reject fleet operational expenses and invoice logs.</p>
      </div>

      <div className="glassmorphism rounded-xl p-8 border border-slate-800/80 flex flex-col items-center justify-center text-center py-20 gap-3">
        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl font-bold">$</div>
        <div>
          <p className="text-sm font-bold text-slate-200">Expense Audit Panel</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">Expense approvals and category filters are scheduled for Phase 4 implementation.</p>
        </div>
      </div>
    </div>
  );
};
