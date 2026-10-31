import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { outboxApi } from '@/api/outboxApi';
import { EmailOutboxItem, EmailStatus } from '@/types/outbox';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Mail, X, Clock, ArrowLeft, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface OutboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutboxDrawer: React.FC<OutboxDrawerProps> = ({ isOpen, onClose }) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailOutboxItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'ALL'>('ALL');

  const {
    data: emails = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['outbox'],
    queryFn: () => outboxApi.getOutboxEmails(),
    enabled: isOpen,
    staleTime: 1000 * 30, // 30 seconds
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        if (selectedEmail) {
          setSelectedEmail(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedEmail, onClose]);

  if (!isOpen) return null;

  const filteredEmails = emails.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Local Email Outbox Drawer"
    >
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-brand-border">
        {/* Header */}
        <div className="h-16 px-6 border-b border-brand-border flex items-center justify-between bg-slate-50/75 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-brand-primary flex items-center justify-center">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Local Email Outbox
              </h3>
              <p className="text-[11px] text-brand-muted">
                Offline simulation drawer. Zero SMTP relay dependency.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/80 transition-colors"
              title="Refresh outbox"
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin text-brand-primary')} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition-colors"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto">
          {selectedEmail ? (
            /* Email Detail View */
            <div className="p-6 space-y-5 animate-in slide-in-from-right-4 duration-150">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-primary-hover"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to list</span>
              </button>

              <div className="space-y-3 pb-4 border-b border-brand-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-brand-muted">
                    ID: {selectedEmail.id}
                  </span>
                  <StatusBadge status={selectedEmail.status} />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {selectedEmail.subject}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-semibold block text-slate-700">Recipient:</span>
                    <span className="font-mono">{selectedEmail.recipientEmail}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-700">Type:</span>
                    <span>{selectedEmail.emailType}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-700">Created:</span>
                    <span>{new Date(selectedEmail.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-700">Delivery Status:</span>
                    <span className="text-slate-500 italic">
                      {selectedEmail.status === 'SENT' ? 'Simulated Local Outbox' : selectedEmail.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Content Body */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-2">
                  Message Content:
                </span>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 selection:bg-indigo-100">
                  {selectedEmail.bodyContent}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Notice: Real external email delivery requires backend SMTP configuration. In development, records are preserved locally in this outbox for auditing.
                </span>
              </div>
            </div>
          ) : (
            /* Email List View */
            <div className="p-6 space-y-4">
              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 border-b border-brand-border pb-3">
                {(['ALL', 'SENT', 'QUEUED', 'FAILED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                      statusFilter === status
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-muted space-y-1">
                  <Send className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">Outbox is empty</p>
                  <p>Trigger actions (registration, password reset) to generate outbox entries.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEmails.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEmail(item)}
                      className="p-3.5 rounded-lg border border-brand-border bg-white hover:border-brand-primary/50 hover:shadow-sm cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                          {item.recipientEmail}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} />
                          <span className="text-[10px] text-brand-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {item.subject}
                      </p>
                      <p className="text-[11px] text-brand-muted line-clamp-1">
                        {item.bodyContent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-border bg-slate-50 text-[11px] text-brand-muted flex items-center justify-between flex-shrink-0">
          <span>Total Queued/Sent: {emails.length}</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </div>
    </div>
  );
};
