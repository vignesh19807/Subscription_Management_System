import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick preset helper for hackathon demo convenience
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('LoopBill#2026!');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const authenticatedUser = await login({
        email: trimmedEmail,
        password,
      });

      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${authenticatedUser.fullName} (${authenticatedUser.role}).`,
      });

      // Role-based redirection
      const destination =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        (authenticatedUser.role === 'CUSTOMER' ? '/portal' : '/');

      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-brand-primary items-center justify-center text-white font-bold text-xl shadow-md">
            LB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to LoopBill
          </h1>
          <p className="text-xs text-brand-muted">
            Brightloop Software Subscription &amp; Recurring Billing
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-brand-border bg-white p-7 shadow-sm space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-primary hover:text-brand-primary-hover"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full gap-2 mt-2"
              isLoading={isLoading}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          </form>

          {/* Quick Role Fill for Hackathon Reviewers */}
          <div className="pt-4 border-t border-brand-border space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted block">
              Quick Role Sign-In (Demo Presets):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@brightloop.io')}
                className="px-2 py-1.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff@brightloop.io')}
                className="px-2 py-1.5 rounded border border-sky-200 bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('customer@brightloop.io')}
                className="px-2 py-1.5 rounded border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
              >
                Customer
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-brand-muted">
          New customer?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-primary hover:text-brand-primary-hover"
          >
            Create Customer Account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Sessions secured via HTTP-only cookies</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

