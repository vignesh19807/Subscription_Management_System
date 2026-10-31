import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Customer } from '@/types/customer';
import { Users, ShieldAlert } from 'lucide-react';

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'activeSubscriptionsCount' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>) => Promise<void>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setFormError('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        companyName: companyName.trim(),
        address: address.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setAddress('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create customer account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard Customer Account"
      description="Create a client profile for quotations, contracts, and recurring invoices."
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
          label="Contact Name"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Corporate Email Address"
          type="email"
          placeholder="john.doe@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Company Name"
            placeholder="Acme Enterprise Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <Input
          label="Billing Address"
          placeholder="Street, City, State, Country"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <Users className="h-4 w-4" />
            <span>Create Customer</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

