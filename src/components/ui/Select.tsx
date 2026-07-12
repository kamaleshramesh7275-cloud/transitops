import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 text-sm py-2.5 pl-4 pr-10 transition-all duration-200 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30
            ${error ? 'border-red-500/80 focus:border-red-500/80 focus:ring-red-500/20' : ''}
            ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && (
        <span className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
