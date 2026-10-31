import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordChecklist, validatePasswordRules } from '@/components/forms/PasswordChecklist';
import { useToast } from '@/components/ui/Toast';
import { UserCheck, AlertCircle, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isValid: isPasswordValid, rules } = validatePasswordRules(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName || !trimmedEmail) {
      setErrorMessage('Full name and email address are required.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please satisfy all password complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await register({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
      });

      showToast({
        type: 'success',
        title: 'Account Registered',
        message: `Welcome, ${newUser.fullName}! Confirmation logged in your Local Outbox.`,
      });

      // Customers are routed directly to the customer portal
      navigate('/portal', { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please check your information.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-brand-primary items-center justify-center text-white font-bold text-xl shadow-md">
            LB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Customer Account
          </h1>
          <p className="text-xs text-brand-muted">
            Self-service onboarding for Brightloop Software subscriptions
          </p>
        </div>

        {/* Card */}
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
              label="Organization or Full Name"
              placeholder="e.g. Acme Corporation"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
            />

            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="billing@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Validated uniquely against backend records"
              disabled={isLoading}
              required
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              {password.length > 0 && <PasswordChecklist rules={rules} />}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full gap-2 mt-2"
              isLoading={isLoading}
            >
              <UserCheck className="h-4 w-4" />
              <span>Complete Registration</span>
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-brand-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-primary hover:text-brand-primary-hover"
          >
            Sign in
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Accounts provisioned strictly with CUSTOMER permissions</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

