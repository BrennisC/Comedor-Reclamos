"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, queryKeys } from "../lib/api";
import type { ConvertedWebpImage } from "../lib/webp";
import type {
  ComplaintCategory,
  ComplaintRecord,
  MealPeriod,
  QuotaStatus,
} from "../types/complaint";

export interface ComplaintInput {
  description: string;
  mealPeriod: MealPeriod;
  category: ComplaintCategory;
  incidentDate: string;
  image: ConvertedWebpImage | null;
}

interface UseSubmitComplaintOptions {
  onSuccess: (complaint: ComplaintRecord) => void;
  onError: (message: string) => void;
}

export function useSubmitComplaint({
  onSuccess,
  onError,
}: UseSubmitComplaintOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ComplaintInput) => {
      const { image, description, ...rest } = input;

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          description: description.trim(),
          imageBase64: image?.dataUrl,
          imageFileName: image?.fileName,
          originalSizeBytes: image?.originalSizeBytes,
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        complaint?: ComplaintRecord;
        quota?: QuotaStatus;
      };

      if (!res.ok || !payload.complaint || !payload.quota) {
        throw new ApiError(
          payload.error || "No se pudo registrar el reclamo.",
          res.status,
        );
      }

      return { complaint: payload.complaint, quota: payload.quota };
    },
    onSuccess: async ({ complaint, quota }) => {
      queryClient.setQueryData(queryKeys.quota, quota);
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onSuccess(complaint);
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 429) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.quota });
      }
      onError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar tu reclamo.",
      );
    },
  });
}
