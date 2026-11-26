'use client';

import { formatFileBytes } from '../../lib/webp';
import {
  getCategoryLabel,
  getMealPeriodLabel,
  type ComplaintRecord,
} from '../../types/complaint';
import { ConfirmDialog } from '../ConfirmDialog';

interface DeleteComplaintDialogProps {
  item: ComplaintRecord | null;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteComplaintDialog({
  item,
  isBusy,
  onCancel,
  onConfirm,
}: DeleteComplaintDialogProps) {
  return (
    <ConfirmDialog
      isOpen={item !== null}
      title="¿Eliminar este reclamo?"
      description={`Esta acción eliminará permanentemente el reclamo${item ? ` (${item.incidentDate})` : ''}${item?.imageUrl ? ' y su fotografía WebP almacenada en Neon' : ''}. Esta operación no se puede deshacer.`}
      confirmLabel="Sí, eliminar reclamo"
      requiresAcknowledgement={Boolean(item?.imageUrl)}
      acknowledgementLabel="Entiendo que el reclamo y su evidencia se eliminarán permanentemente."
      affectedResources={
        item
          ? [
              {
                id: 'neon-row',
                label: `Registro ${item.id}`,
                detail: `${getMealPeriodLabel(item.mealPeriod)} · ${getCategoryLabel(item.category)} (${item.incidentDate})`,
                kind: 'database' as const,
              },
              ...(item.imageUrl
                ? [
                    {
                      id: 'webp-storage',
                      label: item.imageFileName || 'Evidencia WebP',
                      detail: `Archivo optimizado (${formatFileBytes(item.imageSizeBytes)})`,
                      kind: 'image' as const,
                    },
                  ]
                : []),
            ]
          : undefined
      }
      isBusy={isBusy}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
