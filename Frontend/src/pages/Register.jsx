import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, UserPlus, ArrowRight, Sparkles } from 'lucide-react';

// Reusable Components
import InputField from '../components/common/InputField';
import PasswordField from '../components/common/PasswordField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Checkbox from '../components/common/Checkbox';

// Validations
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
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field-level validation dispatcher
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

    const nextForm = {
      ...formData,
      [name]: fieldValue,
    };
    setFormData(nextForm);

    if (serverError) setServerError('');

    // If field or related field was touched, validate dynamically
    if (touched[name]) {
      const error = validateField(name, fieldValue, nextForm);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Revalidate confirmPassword if password changes
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateConfirmPassword(nextForm.confirmPassword, fieldValue);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, fieldValue, formData);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate entire form before submit
  const validateForm = () => {
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password, true);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    const termsError = validateTerms(formData.agreeTerms);

    const newErrors = {
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      agreeTerms: termsError,
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    return !nameError && !emailError && !passwordError && !confirmPasswordError && !termsError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Connect to POST /api/auth/register via AuthContext & Axios service
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMessage(
        response.message || 'Account created successfully! Redirecting to dashboard...'
      );

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 800);
    } catch (err) {
      setServerError(
        err.message || 'Registration failed. Please check your information and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prefill demo data for rapid evaluation
  const handlePrefillDemo = () => {
    setFormData({
      name: 'Sarah Connor',
      email: 'sarah.engineer@nexora.io',
      password: 'Password123#',
      confirmPassword: 'Password123#',
      agreeTerms: true,
    });
    setErrors({});
    setTouched({});
    setServerError('');
  };

  return (
    <div className="w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 transition-all">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Join thousands of developers and teams building with Nexora.
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <Alert
          variant="success"
          title="Account Created"
          message={successMessage}
          className="mb-5"
        />
      )}

      {/* Server error banner */}
      {serverError && (
        <Alert
          variant="error"
          title="Registration failed"
          message={serverError}
          onDismiss={() => setServerError('')}
          className="mb-5"
        />
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <InputField
          label="Full Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. Alex Johnson"
          icon={User}
          error={touched.name ? errors.name : null}
          autoComplete="name"
          required
        />

        {/* Email Address */}
        <InputField
          label="Work Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="you@company.com"
          icon={Mail}
          error={touched.email ? errors.email : null}
          autoComplete="email"
          required
        />

        {/* Password */}
        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="At least 8 characters"
          error={touched.password ? errors.password : null}
          showStrengthMeter={true}
          autoComplete="new-password"
          required
        />

        {/* Confirm Password */}
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Re-enter your password"
          error={touched.confirmPassword ? errors.confirmPassword : null}
          autoComplete="new-password"
          required
        />

        {/* Terms Agreement */}
        <div className="pt-1">
          <Checkbox
            id="agreeTerms"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            error={touched.agreeTerms ? errors.agreeTerms : null}
          >
            I agree to the{' '}
            <a href="#" className="font-semibold text-indigo-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-semibold text-indigo-600 hover:underline">
              Privacy Policy
            </a>
            .
          </Checkbox>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Creating account..."
          icon={UserPlus}
          className="mt-2"
        >
          Get Started Free
        </Button>

        {/* Demo filler for rapid testing */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          onClick={handlePrefillDemo}
          icon={Sparkles}
          className="text-xs text-slate-500 hover:text-slate-700 border-slate-200"
        >
          Fill Demo Registration
        </Button>
      </form>

      {/* Social Divider */}
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

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handlePrefillDemo}
          className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
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
          onClick={handlePrefillDemo}
          className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
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

      {/* Switch to Sign In */}
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
