import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 flex items-center justify-center pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 text-sm py-2.5 transition-all duration-200 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 placeholder-slate-500
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error ? 'border-red-500/80 focus:border-red-500/80 focus:ring-red-500/20' : ''}
            ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-slate-400 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
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

Input.displayName = 'Input';
