import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  X,
  Eye,
  EyeOff,
  Activity,
  Database,
  Layers,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

import Alert from '../components/common/Alert';
import NexoraLogo from '../components/common/NexoraLogo';
import { validateEmail, validatePassword } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
    rememberMe: true,
  });

  const [registeredNotice, setRegisteredNotice] = useState(
    location.state?.registeredSuccess
      ? 'Account created successfully! Please enter your password to sign in.'
      : ''
  );

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive showcase state for Login right panel
  const [activeTab, setActiveTab] = useState('engine');

  // Default redirect path is now the Landing Page ('/'), not the dashboard
  const redirectPath = location.state?.from?.pathname || '/';

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value, false);
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    if (serverError) setServerError('');

    if (touched[name]) {
      const error = validateField(name, fieldValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password, false);

    setErrors({ email: emailErr, password: passErr });
    setTouched({ email: true, password: true });

    return !emailErr && !passErr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      setSuccessMessage(
        response.message || 'Login successful! Redirecting to workspace...'
      );

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 700);
    } catch (err) {
      setServerError(
        err.message || 'Unable to sign in. Please verify your email and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrefillDemo = () => {
    setFormData({
      email: 'alex.developer@nexora.io',
      password: 'Password123!',
      rememberMe: true,
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

      {/* LEFT COLUMN: Login Form (lg:col-span-5) */}
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
          <div className="mt-3.5 mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to access your Nexora workspace
            </p>
          </div>

          {/* Registration success notice */}
          {registeredNotice && !serverError && (
            <Alert
              variant="success"
              title="Account Ready"
              message={registeredNotice}
              onDismiss={() => setRegisteredNotice('')}
              className="mb-2.5 text-xs py-2"
            />
          )}

          {/* Feedback Alerts */}
          {successMessage && (
            <Alert
              variant="success"
              title="Authenticated"
              message={successMessage}
              className="mb-2.5 text-xs py-2"
            />
          )}
          {serverError && (
            <Alert
              variant="error"
              title="Sign In Failed"
              message={serverError}
              onDismiss={() => setServerError('')}
              className="mb-2.5 text-xs py-2"
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* Email Address */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="alex.developer@nexora.io"
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
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-600"
                >
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions will be sent to your email.');
                  }}
                  className="text-xs font-medium text-amber-600 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
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

            {/* Interactive Toggle Switch for Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 font-medium select-none">
                Remember me on this browser
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, rememberMe: !prev.rememberMe }))
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.rememberMe ? 'bg-amber-400' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={formData.rememberMe}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.rememberMe ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2.5 py-3 px-6 rounded-2xl font-bold text-slate-950 bg-[#facc15] hover:bg-[#eab308] active:scale-[0.99] shadow-md shadow-amber-400/25 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
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
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-slate-800 hover:text-amber-600 hover:underline"
            >
              Sign up
            </Link>
          </div>
          <span className="flex items-center text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            256-bit SSL Secure
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Unique, Creative & Interactive Real-Time Workspace Showcase (lg:col-span-7) */}
      <div className="hidden lg:flex lg:col-span-7 p-3 sm:p-3.5 flex-col h-full overflow-hidden">
        <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-900 shadow-inner group">
          {/* Background Workspace Image */}
          <img
            src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80"
            alt="Modern AI Engineering Workspace"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-amber-400/5 mix-blend-overlay pointer-events-none" />

          {/* FLOATING WIDGET 1 (Top Left): Live Engine Status Card */}
          <div className="absolute top-5 left-5 z-20 bg-[#facc15] text-slate-950 px-4 py-2.5 rounded-2xl shadow-md shadow-black/20 backdrop-blur-md border border-amber-300/60">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <div>
                <p className="text-xs font-bold leading-tight">Nexora AI Engine</p>
                <p className="text-[10px] text-slate-800 font-medium">Live • 99.98% Model Health</p>
              </div>
            </div>
          </div>

          {/* FLOATING WIDGET 2 (Center Right): Active Collaborators Stack */}
          <div className="absolute top-1/4 right-6 z-20 flex flex-col items-center space-y-2 bg-white/15 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <span className="text-[9px] uppercase tracking-wider text-amber-200 font-bold">Online</span>
            {[
              {
                name: 'Marcus Vance',
                img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
              },
              {
                name: 'Samantha Wu',
                img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
              },
              {
                name: 'Tariq Al-Mansoor',
                img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
              },
            ].map((person, idx) => (
              <img
                key={idx}
                src={person.img}
                alt={person.name}
                title={person.name}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md object-cover hover:scale-115 transition-transform cursor-pointer"
              />
            ))}
          </div>

          {/* FLOATING WIDGET 3 (Interactive Tabbed Center Widget) */}
          <div className="absolute bottom-20 left-5 right-5 z-20 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3.5 shadow-xl text-white">
            {/* Tabs */}
            <div className="flex items-center space-x-1.5 border-b border-white/20 pb-2 mb-2.5">
              {[
                { id: 'engine', label: 'Engine', icon: Layers },
                { id: 'datasets', label: 'Datasets', icon: Database },
                { id: 'metrics', label: 'Health', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-sm scale-105'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Content based on activeTab */}
            <div className="text-xs">
              {activeTab === 'engine' && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
                    <span>Tabular_Stream_Engine</span>
                    <span className="bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
                      Operational
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full w-4/5 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-white/70">
                    Awaiting tabular dataset upload • Ready for real-time processing
                  </p>
                </div>
              )}

              {activeTab === 'datasets' && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
                    <span>Ingested Catalogs</span>
                    <span className="text-[10px] text-white/80">3 Active</span>
                  </div>
                  <p className="text-[10px] text-white/90">
                    • <span className="font-semibold">Telecom_Churn.csv</span> (2,500 rows, 8 cols)
                  </p>
                  <p className="text-[10px] text-white/90">
                    • <span className="font-semibold">User_Engagement.json</span> (14,200 events)
                  </p>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="grid grid-cols-3 gap-2 text-center animate-fade-in">
                  <div className="p-1.5 rounded-xl bg-white/10">
                    <div className="text-[9px] text-white/70">Latency</div>
                    <div className="text-xs font-bold text-amber-300">14 ms</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white/10">
                    <div className="text-[9px] text-white/70">Accuracy</div>
                    <div className="text-xs font-bold text-emerald-300">98.9%</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white/10">
                    <div className="text-[9px] text-white/70">Uptime</div>
                    <div className="text-xs font-bold text-sky-300">99.99%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FLOATING WIDGET 4 (Bottom Left): Real-Time Status Card */}
          <div className="absolute bottom-5 left-5 z-20 bg-white/95 text-slate-900 px-3.5 py-2 rounded-xl shadow-md backdrop-blur-md border border-white/60">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px]">
                NX
              </div>
              <div>
                <p className="text-[11px] font-bold leading-tight">Nexora Cloud Workspace</p>
                <p className="text-[9px] text-slate-500 font-medium">Session encrypted • TLS 1.3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
