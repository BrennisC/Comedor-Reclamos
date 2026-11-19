'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FileWarning,
  ImageOff,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';

export interface AffectedResourceItem {
  id: string;
  label: string;
  detail: string;
  kind: 'database' | 'image';
}

export type ConfirmSeverity = 'danger' | 'warning';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: ConfirmSeverity;
  isBusy?: boolean;
  requiresAcknowledgement?: boolean;
  acknowledgementLabel?: string;
  requireTypedPhrase?: string;
  typedPhraseHint?: string;
  affectedResources?: AffectedResourceItem[];
  warningNote?: string;
  targetReferenceId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SEVERITY_STYLES: Record<
  ConfirmSeverity,
  {
    iconBox: string;
    iconColor: string;
    confirmButton: string;
    focusRing: string;
    badgeLabel: string;
  }
> = {
  danger: {
    iconBox: 'border-red-200 bg-red-50',
    iconColor: 'text-red-700',
    confirmButton: 'bg-red-700 hover:bg-red-800 disabled:bg-red-300',
    focusRing: 'focus-visible:outline-red-700',
    badgeLabel: 'Acción irreversible',
  },
  warning: {
    iconBox: 'border-amber-200 bg-amber-50',
    iconColor: 'text-amber-700',
    confirmButton: 'bg-amber-700 hover:bg-amber-800 disabled:bg-amber-300',
    focusRing: 'focus-visible:outline-amber-700',
    badgeLabel: 'Requiere revisión',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar eliminación',
  cancelLabel = 'Cancelar',
  severity = 'danger',
  isBusy = false,
  requiresAcknowledgement = false,
  acknowledgementLabel = 'Confirmo que deseo eliminar permanentemente estos datos y su respaldo.',
  requireTypedPhrase,
  typedPhraseHint,
  affectedResources,
  warningNote,
  targetReferenceId,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const phraseInputId = useId();

  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogContainerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [acknowledged, setAcknowledged] = useState(false);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [openedTimestamp, setOpenedTimestamp] = useState<string>('');

  // Reset safety gates and capture opening timestamp when modal toggles.
  useEffect(() => {
    if (isOpen) {
      setOpenedTimestamp(
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } else {
      setAcknowledged(false);
      setTypedPhrase('');
      setCopiedRef(false);
    }
  }, [isOpen]);

  // Manage body scroll lock, capture previous focus, and focus safe Cancel button.
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timerId = window.setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(timerId);
      document.body.style.overflow = previousOverflow;
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  const normalizedRequiredPhrase = requireTypedPhrase?.trim() ?? '';
  const phraseSatisfied =
    normalizedRequiredPhrase.length === 0 ||
    typedPhrase.trim().toLowerCase() === normalizedRequiredPhrase.toLowerCase();

  const isConfirmDisabled =
    isBusy ||
    (requiresAcknowledgement && !acknowledged) ||
    !phraseSatisfied;

  // Trap Tab focus inside dialog and handle Escape / safe Enter confirmation.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (
        event.key === 'Enter' &&
        !isConfirmDisabled &&
        document.activeElement !== cancelButtonRef.current &&
        document.activeElement?.tagName !== 'BUTTON'
      ) {
        event.preventDefault();
        onConfirm();
        return;
      }

      if (event.key === 'Tab' && dialogContainerRef.current) {
        const focusable = dialogContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, isConfirmDisabled, isOpen, onCancel, onConfirm]);

  const resources = useMemo(() => affectedResources ?? [], [affectedResources]);

  const handleCopyReference = async () => {
    if (!targetReferenceId || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(targetReferenceId);
      setCopiedRef(true);
      window.setTimeout(() => setCopiedRef(false), 1800);
    } catch {
      // Clipboard write may be blocked in restricted contexts.
    }
  };

  if (!isOpen) return null;

  const palette = SEVERITY_STYLES[severity];

  const renderResourceIcon = (kind: AffectedResourceItem['kind']) => {
    switch (kind) {
      case 'image':
        return <ImageOff className="h-4 w-4 text-slate-600" />;
      case 'database':
      default:
        return <Database className="h-4 w-4 text-slate-600" />;
    }
  };

  const renderSeverityIcon = () => {
    if (severity === 'warning') {
      return <Info className={`h-5 w-5 ${palette.iconColor}`} />;
    }
    return <AlertTriangle className={`h-5 w-5 ${palette.iconColor}`} />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={() => {
        if (!isBusy) onCancel();
      }}
    >
      <div
        ref={dialogContainerRef}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${palette.iconBox}`}
            >
              {renderSeverityIcon()}
            </div>
            <div>
              <h3
                id={titleId}
                className="font-display text-base font-semibold text-slate-900"
              >
                {title}
              </h3>
              <p className="text-xs text-slate-500 tabular-nums">
                {palette.badgeLabel} · Solicitado a las {openedTimestamp || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Cerrar diálogo de confirmación"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          <p
            id={descriptionId}
            className="text-sm leading-relaxed text-slate-700"
          >
            {description}
          </p>

          {targetReferenceId && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs">
              <span className="text-slate-600">
                Referencia:{' '}
                <code className="font-mono font-medium text-slate-900">
                  {targetReferenceId}
                </code>
              </span>
              <button
                type="button"
                onClick={() => void handleCopyReference()}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200/70"
              >
                {copiedRef ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar ID
                  </>
                )}
              </button>
            </div>
          )}

          {/* Dynamic breakdown of affected resources */}
          {resources.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700">
                <span>Elementos afectados</span>
                <span className="font-normal text-slate-500 tabular-nums">
                  {resources.length} elemento(s)
                </span>
              </div>
              <ul className="divide-y divide-slate-200">
                {resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-start gap-3 px-3.5 py-2.5 text-xs"
                  >
                    <span className="mt-0.5 shrink-0">
                      {renderResourceIcon(resource.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{resource.label}</p>
                      <p className="mt-0.5 text-slate-500">{resource.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warningNote && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
              <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <span className="leading-relaxed">{warningNote}</span>
            </div>
          )}

          {normalizedRequiredPhrase.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3.5">
              <label
                htmlFor={phraseInputId}
                className="block text-xs font-medium text-slate-800"
              >
                {typedPhraseHint ||
                  `Escribe "${normalizedRequiredPhrase}" para habilitar la confirmación:`}
              </label>
              <div className="relative">
                <input
                  id={phraseInputId}
                  type="text"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  disabled={isBusy}
                  placeholder={normalizedRequiredPhrase}
                  className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {phraseSatisfied && (
                  <CheckCircle2 className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-emerald-700" />
                )}
              </div>
            </div>
          )}

          {requiresAcknowledgement && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-700 transition-colors hover:bg-slate-50">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={isBusy}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-700"
              />
              <span className="leading-relaxed">{acknowledgementLabel}</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            Presiona Esc para cancelar sin cambios
          </span>

          <div className="flex items-center gap-2.5">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 ${palette.confirmButton} ${palette.focusRing}`}
            >
              {isBusy ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
