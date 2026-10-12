import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import FormSection from '../components/FormSection';
import logo from '../assets/Logo.png';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: (name: string, email: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (validate()) {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setIsSubmitting(false);
      if (error) {
        setAuthError(error.message || 'Invalid login credentials');
        return;
      }
      if (data.session) {
        const name = data.session.user.user_metadata?.name || email.split('@')[0];
        onLogin(name, email);
        navigate('/add-shift');
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

        <FormSection title="Welcome Back" subtitle="Log in to manage your shifts">
          <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            {authError && <p className="text-sm text-red-500 -mt-2 mb-3">{authError}</p>}
            <Button fullWidth type="submit" disabled={isSubmitting}>
              Log In
            </Button>
          </form>
        </FormSection>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}