import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const Alert = ({
  variant = 'info',
  title,
  message,
  children,
  onDismiss,
  className = '',
}) => {
  const config = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      icon: Info,
      iconColor: 'text-indigo-600',
    },
  };

  const current = config[variant] || config.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start p-4 border rounded-xl text-sm transition-all animate-fade-in ${current.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${current.iconColor}`} />

      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 leading-snug">{title}</h5>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-95">
          {message || children}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 p-1 rounded-lg hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
