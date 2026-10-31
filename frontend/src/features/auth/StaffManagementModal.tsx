import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordChecklist, validatePasswordRules } from '@/components/forms/PasswordChecklist';
import { useToast } from '@/components/ui/Toast';
import { UserPlus, ShieldAlert } from 'lucide-react';

export interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, createStaffAccount } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { isValid: isPasswordValid, rules } = validatePasswordRules(password);

  // Guard: Only ADMIN can create STAFF accounts
  if (user?.role !== 'ADMIN') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim()) {
      setFormError('Full Name and Email are required.');
      return;
    }

    if (!isPasswordValid) {
      setFormError('Please fulfill all password complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdStaff = await createStaffAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      showToast({
        type: 'success',
        title: 'Staff Member Provisioned',
        message: `Account created for ${createdStaff.fullName}. Staff invitation logged in Outbox.`,
      });

      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to provision staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision Staff Account"
      description="Create a privileged internal staff account for billing operations. Exclusive to ADMIN."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Input
          label="Full Name"
          placeholder="e.g. Rachel Adams"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="staff.member@brightloop.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Initial Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {password.length > 0 && <PasswordChecklist rules={rules} />}

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Provision Staff</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

