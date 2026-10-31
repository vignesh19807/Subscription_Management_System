import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordChecklist, validatePasswordRules } from '@/components/forms/PasswordChecklist';
import { useToast } from '@/components/ui/Toast';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { isValid: isPasswordValid, rules } = validatePasswordRules(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setErrorMessage('A valid password reset token is required.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please satisfy all password complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        token: trimmedToken,
        newPassword,
      });

      setIsSuccess(true);
      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your account credentials have been successfully reset.',
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Password reset failed. The token may be expired or invalid.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-brand-primary items-center justify-center text-white font-bold text-xl shadow-md">
            LB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set New Password
          </h1>
          <p className="text-xs text-brand-muted">
            Choose a secure replacement password for your account
          </p>
        </div>

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

          {isSuccess ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-600">
                  You can now log in using your updated password.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  Proceed to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!tokenFromUrl && (
                <Input
                  label="Reset Token"
                  placeholder="Paste reset token from email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  required
                />
              )}

              <div className="space-y-1.5">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                {newPassword.length > 0 && <PasswordChecklist rules={rules} />}
              </div>

              <Input
                label="Confirm New Password"
                type="password"
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
                <KeyRound className="h-4 w-4" />
                <span>Update Password</span>
              </Button>
            </form>
          )}
        </div>

        <div className="text-center text-xs">
          <Link
            to="/login"
            className="font-medium text-brand-muted hover:text-slate-900 transition-colors"
          >
            Cancel and return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

