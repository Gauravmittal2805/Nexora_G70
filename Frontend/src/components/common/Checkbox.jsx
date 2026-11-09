import React from 'react';
import { AlertCircle } from 'lucide-react';

const Checkbox = ({
  id,
  name,
  checked,
  onChange,
  label,
  children,
  error,
  disabled = false,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="h-4 w-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
        />
        <label
          htmlFor={inputId}
          className="ml-2.5 block text-xs font-medium text-slate-600 leading-normal cursor-pointer select-none"
        >
          {label || children}
        </label>
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose-600 flex items-center animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0 inline" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default Checkbox;
