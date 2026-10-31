import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please provide your registered account email.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({ email: trimmedEmail });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to initiate password reset request.'
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
            Recover Account Password
          </h1>
          <p className="text-xs text-brand-muted">
            Enter your email to receive recovery instructions
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
                  Recovery Instructions Dispatched
                </h3>
                <p className="text-xs text-slate-600">
                  A password recovery token has been logged for <span className="font-semibold text-slate-800">{email}</span>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left">
                <p className="font-semibold text-slate-800 mb-1">Local Testing Tip:</p>
                <p>
                  Because this platform operates in offline/local-first mode, open the <strong>Email Outbox</strong> drawer to inspect the generated reset token and link.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                <Mail className="h-4 w-4" />
                <span>Send Recovery Instructions</span>
              </Button>
            </form>
          )}
        </div>

        <div className="text-center text-xs">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-brand-muted hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
