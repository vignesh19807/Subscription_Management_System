import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PasswordRule {
  id: string;
  label: string;
  isValid: boolean;
}

export interface PasswordChecklistProps {
  rules: PasswordRule[];
  className?: string;
}

export function validatePasswordRules(password: string): {
  isValid: boolean;
  rules: PasswordRule[];
} {
  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'Minimum 9 characters (more than 8)',
      isValid: password.length > 8,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      isValid: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a-z)',
      isValid: /[a-z]/.test(password),
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%^&*)',
      isValid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
    },
  ];

  const isValid = rules.every((r) => r.isValid);
  return { isValid, rules };
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  rules,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border border-brand-border bg-slate-50/70 space-y-1.5 text-xs',
        className
      )}
      aria-label="Password complexity requirements"
    >
      <span className="font-semibold text-slate-700 block mb-1">
        Password Requirements:
      </span>
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={cn(
            'flex items-center gap-2 transition-colors',
            rule.isValid ? 'text-emerald-700 font-medium' : 'text-slate-500'
          )}
        >
          {rule.isValid ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
          ) : (
            <X className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          )}
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
};

