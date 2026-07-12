import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
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
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 text-sm py-2.5 px-4 transition-all duration-200 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 appearance-none cursor-pointer
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
        {/* Custom Chevron Indicator */}
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
