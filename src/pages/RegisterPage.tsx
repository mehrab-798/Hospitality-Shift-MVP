import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import Checkbox from '../components/Checkbox';
import FormSection from '../components/FormSection';
import logo from '../assets/Logo.png';
import { supabase } from '../lib/supabase';

interface RegisterPageProps {
  onRegister: (name: string, email: string) => void;
}

export default function RegisterPage({ onRegister }: RegisterPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    agreed?: string;
  }>({});
  const [authError, setAuthError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!agreed) {
      newErrors.agreed = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    setEmailSent(false);
    if (validate()) {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });
      setIsSubmitting(false);
      if (error) {
        setAuthError(error.message || 'Registration failed');
        return;
      }
      if (data.session) {
        onRegister(name.trim(), email.trim());
        navigate('/add-shift');
      } else {
        setEmailSent(true);
      }
    }
  }

  return (
    <div className="min-h-screen bg-peach flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <img
          src={logo}
          alt="Hospitality Shift"
          className="w-16 h-16 mx-auto mb-6 rounded-xl object-contain"
        />

        <FormSection title="Create Account" subtitle="Start tracking your shifts today">
          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Checkbox
              label="I agree to the terms and conditions"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            {errors.agreed && <p className="text-sm text-red-500 -mt-3 mb-3">{errors.agreed}</p>}
            {authError && <p className="text-sm text-red-500 -mt-2 mb-3">{authError}</p>}
            {emailSent && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-medium text-green-700">Registration successful!</p>
                <p className="text-sm text-green-600 mt-1">Please check your email to confirm your account before logging in.</p>
              </div>
            )}
            <Button fullWidth type="submit" disabled={isSubmitting}>
              Register & Start
            </Button>
          </form>
        </FormSection>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}