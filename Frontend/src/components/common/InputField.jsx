import React from 'react';
import { AlertCircle } from 'lucide-react';

const InputField = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  icon: Icon,
  rightElement,
  helperText,
  required = false,
  autoComplete,
  disabled = false,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`block w-full py-2.5 sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
              : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white hover:border-slate-300'
          } ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}`}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600 flex items-center animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0 inline" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default InputField;
