import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (score === 3) return { score, label: 'Good', color: 'bg-indigo-500', width: 'w-3/4' };
    return { score, label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await register(formData.name, formData.email, formData.password);
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setFormData({
      name: 'Sarah Connor',
      email: 'sarah.engineer@nexora.io',
      password: 'NexoraSecure#2026',
      confirmPassword: 'NexoraSecure#2026',
      agreeTerms: true,
    });
    setErrors({});
  };

  return (
    <div className="w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 transition-all">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Join thousands of developers and teams building with Nexora.
        </p>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="mb-6 flex items-center p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 mr-2.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Server error banner */}
      {serverError && (
        <div className="mb-6 flex items-center p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 mr-2.5 text-rose-600 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alex Johnson"
              className={`block w-full pl-10 pr-3.5 py-2.5 sm:text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white'
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 inline" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className={`block w-full pl-10 pr-3.5 py-2.5 sm:text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 inline" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className={`block w-full pl-10 pr-10 py-2.5 sm:text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Dynamic password strength meter */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Strength:</span>
                <span className="font-semibold text-slate-700">{strength.label}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}
                />
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 inline" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`block w-full pl-10 pr-10 py-2.5 sm:text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 inline" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms agreement */}
        <div className="pt-1">
          <div className="flex items-start">
            <input
              id="agreeTerms"
              name="agreeTerms"
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="h-4 w-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="ml-2.5 block text-xs text-slate-600 leading-normal cursor-pointer">
              I agree to the{' '}
              <a href="#" className="font-semibold text-indigo-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-semibold text-indigo-600 hover:underline">
                Privacy Policy
              </a>.
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="mt-1 text-xs text-rose-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 inline" />
              {errors.agreeTerms}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-600/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Get Started Free</span>
            </>
          )}
        </button>

        {/* Demo fill button for testing */}
        <button
          type="button"
          onClick={handleDemoFill}
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 border border-slate-200/70 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Fill Demo Registration</span>
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
            Or sign up with
          </span>
        </div>
      </div>

      {/* Social options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            register('Google User', 'google.user@nexora.io', 'GoogleAuth#2026');
            navigate('/dashboard');
          }}
          className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </button>

        <button
          type="button"
          onClick={() => {
            register('GitHub User', 'github.user@nexora.io', 'GitHubAuth#2026');
            navigate('/dashboard');
          }}
          className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
        >
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          GitHub
        </button>
      </div>

      {/* Footer link to login */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center"
          >
            Sign in
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
