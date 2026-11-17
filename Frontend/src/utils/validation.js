/**
 * Validation utilities for Authentication forms
 */

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email address is required';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address (e.g. name@domain.com)';
  }
  return null;
};

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
};

export const validatePassword = (password, isRegistration = false) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (isRegistration) {
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z)';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter (a-z)';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number (0-9)';
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return 'Password must contain at least one special character';
    }
  }
  return null;
};

export const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }
  return null;
};

export const validateTerms = (agreeTerms) => {
  if (!agreeTerms) {
    return 'You must accept the Terms of Service to continue';
  }
  return null;
};

/**
 * Calculates password strength score (0 to 4)
 */
export const calculatePasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: 'Too Short',
      color: 'bg-slate-200',
      textColor: 'text-slate-400',
      width: 'w-0',
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 0.5;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  score = Math.min(4, Math.floor(score));

  switch (score) {
    case 1:
      return {
        score: 1,
        label: 'Weak',
        color: 'bg-rose-500',
        textColor: 'text-rose-500',
        width: 'w-1/4',
      };
    case 2:
      return {
        score: 2,
        label: 'Fair',
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        width: 'w-2/4',
      };
    case 3:
      return {
        score: 3,
        label: 'Good',
        color: 'bg-indigo-500',
        textColor: 'text-indigo-500',
        width: 'w-3/4',
      };
    case 4:
      return {
        score: 4,
        label: 'Strong',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        width: 'w-full',
      };
    default:
      return {
        score: 0,
        label: 'Too Weak',
        color: 'bg-slate-200',
        textColor: 'text-slate-400',
        width: 'w-1/12',
      };
  }
};
