import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  X,
  Eye,
  EyeOff,
  Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react';

import Alert from '../components/common/Alert';
import NexoraLogo from '../components/common/NexoraLogo';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateTerms,
} from '../utils/validation';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive calendar state
  const [activeDate, setActiveDate] = useState(24);

  const days = [
    { day: 'Sun', date: 22 },
    { day: 'Mon', date: 23 },
    { day: 'Tue', date: 24 },
    { day: 'Wed', date: 25 },
    { day: 'Thu', date: 26 },
    { day: 'Fri', date: 27 },
    { day: 'Sat', date: 28 },
  ];

  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value, true);
      case 'confirmPassword':
        return validateConfirmPassword(value, allValues.password);
      case 'agreeTerms':
        return validateTerms(value);
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const nextForm = { ...formData, [name]: fieldValue };
    setFormData(nextForm);
    if (serverError) setServerError('');

    if (touched[name]) {
      const error = validateField(name, fieldValue, nextForm);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === 'password' && touched.confirmPassword) {
      const confirmErr = validateConfirmPassword(nextForm.confirmPassword, fieldValue);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, fieldValue, formData);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const nameErr = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password, true);
    const confErr = validateConfirmPassword(formData.confirmPassword, formData.password);
    const termsErr = validateTerms(formData.agreeTerms);

    const newErrors = {
      name: nameErr,
      email: emailErr,
      password: passErr,
      confirmPassword: confErr,
      agreeTerms: termsErr,
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    return !nameErr && !emailErr && !passErr && !confErr && !termsErr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMessage(
        response.message || 'Account created successfully! Redirecting to sign in...'
      );

      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            email: formData.email.trim(),
            registeredSuccess: true,
          },
        });
      }, 700);
    } catch (err) {
      setServerError(
        err.message || 'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrefillDemo = () => {
    setFormData({
      name: 'Amélie Laurent',
      email: 'amelielaurent7622@gmail.com',
      password: 'Password123#',
      confirmPassword: 'Password123#',
      agreeTerms: true,
    });
    setErrors({});
    setTouched({});
    setServerError('');
  };

  return (
    <div className="relative w-full max-w-5xl h-[min(94vh,670px)] bg-white/95 rounded-[32px] sm:rounded-[38px] shadow-2xl shadow-slate-900/15 border border-white/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-fade-in transition-all">
      {/* Close button in top-right corner */}
      <Link
        to="/"
        className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 backdrop-blur-md flex items-center justify-center shadow-xs transition-all hover:scale-105"
        title="Return to home"
      >
        <X className="w-4 h-4" />
      </Link>

      {/* LEFT COLUMN: Signup Form (lg:col-span-5) */}
      <div className="lg:col-span-5 px-6 py-5 sm:px-8 sm:py-6 flex flex-col justify-between bg-gradient-to-b from-[#fafbfa] via-white to-[#fef9c3]/20 h-full overflow-hidden">
        <div>
          {/* Brand Pill Badge */}
          <Link
            to="/"
            className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-colors"
          >
            <NexoraLogo size="xs" theme="light" badgeText="AI" />
          </Link>

          {/* Heading & Subtitle - Larger & prominent */}
          <div className="mt-3 mb-3.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Create an account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign up and get 30 day free trial
            </p>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <Alert
              variant="success"
              title="Welcome!"
              message={successMessage}
              className="mb-2 text-xs py-2"
            />
          )}
          {serverError && (
            <Alert
              variant="error"
              title="Error"
              message={serverError}
              onDismiss={() => setServerError('')}
              className="mb-2 text-xs py-2"
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Amélie Laurent"
                className={`w-full px-4 py-2.5 text-sm rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 ${
                  touched.name && errors.name
                    ? 'border-rose-300 focus:ring-rose-400/20 text-rose-900 bg-rose-50/20'
                    : 'border-slate-200/90 text-slate-800 focus:border-amber-400 focus:ring-amber-400/20 hover:border-slate-300'
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-rose-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 inline" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="amelielaurent7622@gmail.com"
                className={`w-full px-4 py-2.5 text-sm rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 ${
                  touched.email && errors.email
                    ? 'border-rose-300 focus:ring-rose-400/20 text-rose-900 bg-rose-50/20'
                    : 'border-slate-200/90 text-slate-800 focus:border-amber-400 focus:ring-amber-400/20 hover:border-slate-300'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-rose-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 inline" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••••••"
                  className={`w-full pl-4 pr-10 py-2.5 text-sm rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 ${
                    touched.password && errors.password
                      ? 'border-rose-300 focus:ring-rose-400/20 text-rose-900 bg-rose-50/20'
                      : 'border-slate-200/90 text-slate-800 focus:border-amber-400 focus:ring-amber-400/20 hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-xs text-rose-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 inline" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••••••"
                  className={`w-full pl-4 pr-10 py-2.5 text-sm rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-rose-300 focus:ring-rose-400/20 text-rose-900 bg-rose-50/20'
                      : 'border-slate-200/90 text-slate-800 focus:border-amber-400 focus:ring-amber-400/20 hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 inline" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-6 rounded-2xl font-bold text-slate-950 bg-[#facc15] hover:bg-[#eab308] active:scale-[0.99] shadow-md shadow-amber-400/25 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrefillDemo}
                className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.64-.78 1.08-1.87.96-2.96-1 .04-2.17.65-2.82 1.42-.58.67-1.09 1.77-.96 2.82 1.13.09 2.18-.52 2.82-1.28z" />
                </svg>
                Apple
              </button>

              <button
                type="button"
                onClick={handlePrefillDemo}
                className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
            </div>
          </form>
        </div>

        {/* Footer row */}
        <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Already have account?{' '}
            <Link
              to="/login"
              className="font-bold text-slate-800 hover:text-amber-600 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Nexora Terms & Conditions: Enterprise Data Security & SOC-2 compliance.');
            }}
            className="hover:underline text-slate-400 hover:text-slate-600"
          >
            Terms & Conditions
          </a>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Visual Showcase (lg:col-span-7) */}
      <div className="hidden lg:flex lg:col-span-7 p-3 sm:p-3.5 flex-col h-full overflow-hidden">
        <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-900 shadow-inner group">
          {/* Background Team Collaboration Photo */}
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
            alt="Collaborative workspace"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-[1.02] group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          {/* Warm ambient gradient overlays matching reference image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay pointer-events-none" />

          {/* FLOATING WIDGET 1 (Top Left): Task Review Pill */}
          <div className="absolute top-5 left-5 z-20 bg-[#facc15] text-slate-950 px-4 py-2.5 rounded-2xl shadow-md shadow-black/20 backdrop-blur-md cursor-pointer hover:scale-105 transition-transform duration-200 border border-amber-300/60">
            <div className="flex items-center space-x-3">
              <div>
                <p className="text-xs font-bold leading-tight">Task Review With Team</p>
                <p className="text-[10px] text-slate-800 font-medium">9:00am - 10:00am</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
            </div>
          </div>

          {/* FLOATING WIDGET 2 (Center Right): Avatar Stack */}
          <div className="absolute top-1/4 right-6 z-20 flex flex-col space-y-2">
            {[
              {
                name: 'Elena Rostova',
                role: 'Data Lead',
                img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
              },
              {
                name: 'David Kim',
                role: 'ML Engineer',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
              },
              {
                name: 'Sarah Connor',
                role: 'Frontend Architect',
                img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
              },
            ].map((person, idx) => (
              <div
                key={idx}
                className="relative cursor-pointer"
                title={`${person.name} • ${person.role}`}
              >
                <img
                  src={person.img}
                  alt={person.name}
                  className="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover hover:scale-115 transition-transform"
                />
                <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              </div>
            ))}
          </div>

          {/* FLOATING WIDGET 3 (Center Bottom): Interactive Frosted Glass Calendar Strip */}
          <div className="absolute bottom-22 left-5 right-5 z-20 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-xl text-white">
            <div className="flex items-center justify-between text-[11px] mb-2 px-1 text-white/90 font-medium">
              <span className="flex items-center space-x-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Sprint Schedule • October</span>
              </span>
              <span className="text-[10px] text-amber-200">Interactive</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {days.map((item) => {
                const isSelected = activeDate === item.date;
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setActiveDate(item.date)}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm scale-105'
                        : 'hover:bg-white/15 text-white/80'
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-wider opacity-80">{item.day}</div>
                    <div className="text-xs font-bold leading-tight mt-0.5">{item.date}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FLOATING WIDGET 4 (Bottom Left): Daily Meeting Card */}
          <div className="absolute bottom-5 left-5 z-20 bg-white/95 text-slate-900 px-4 py-2.5 rounded-2xl shadow-md backdrop-blur-md border border-white/60">
            <div className="flex items-center justify-between space-x-5">
              <div>
                <p className="text-xs font-bold leading-tight">Daily Meeting</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">10:00am - 11:00am</p>
              </div>
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  AL
                </div>
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center border border-white">
                  SC
                </div>
                <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  DK
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  +4
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
