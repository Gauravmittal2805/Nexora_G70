import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { calculatePasswordStrength } from '../../utils/validation';

const PasswordField = ({
  label = 'Password',
  id,
  name = 'password',
  value = '',
  onChange,
  onBlur,
  placeholder = '••••••••••••',
  error,
  required = false,
  autoComplete = 'current-password',
  showStrengthMeter = false,
  disabled = false,
  headerAction,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const strength = showStrengthMeter ? calculatePasswordStrength(value) : null;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {headerAction}
      </div>

      <div className="relative rounded-xl shadow-xs">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Lock className="h-4 w-4" />
        </div>

        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`block w-full pl-10 pr-11 py-2.5 sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
              : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white hover:border-slate-300'
          } ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Dynamic strength meter if enabled */}
      {showStrengthMeter && value && (
        <div className="mt-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 font-medium">Password strength:</span>
            <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${strength.color} ${strength.width}`}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Use at least 8 characters with uppercase, lowercase, numbers, and symbols.
          </p>
        </div>
      )}

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600 flex items-center animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0 inline" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default PasswordField;
