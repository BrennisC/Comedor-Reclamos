"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchComplaints, queryKeys, type ComplaintFilters } from "../lib/api";
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  MealPeriod,
} from "../types/complaint";
import { EMPTY_SUMMARY } from "../constants/admin";

export interface DailyMatrixRow {
  date: string;
  desayuno: number;
  almuerzo: number;
  cena: number;
  pendiente: number;
  resuelto: number;
  total: number;
}

/**
 * Owns the complaint filter state and the server query.
 * Extracted from AdminDashboard so the shell only coordinates sections.
 */
export function useAdminComplaints() {
  const [filterDate, setFilterDate] = useState("");
  const [filterMealPeriod, setFilterMealPeriod] = useState<MealPeriod | "">("");
  const [filterCategory, setFilterCategory] = useState<ComplaintCategory | "">(
    "",
  );
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "">("");
  const [filterPriority, setFilterPriority] = useState<ComplaintPriority | "">(
    "",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo<ComplaintFilters>(
    () => ({
      date: filterDate,
      mealPeriod: filterMealPeriod,
      category: filterCategory,
      status: filterStatus,
      priority: filterPriority,
      q: searchQuery,
    }),
    [
      filterDate,
      filterMealPeriod,
      filterCategory,
      filterStatus,
      filterPriority,
      searchQuery,
    ],
  );

  const complaintsQuery = useQuery({
    queryKey: queryKeys.complaints(filters),
    queryFn: () => fetchComplaints(filters),
  });

  const complaints = complaintsQuery.data?.complaints ?? [];
  const summary = complaintsQuery.data?.summary ?? EMPTY_SUMMARY;

  const urgentQueue = useMemo(
    () =>
      complaints
        .filter(
          (item) =>
            item.status === "pendiente" || item.status === "en_revision",
        )
        .sort((a, b) => {
          const priorityRank: Record<ComplaintPriority, number> = {
            alta: 0,
            media: 1,
            baja: 2,
          };
          if (priorityRank[a.priority] !== priorityRank[b.priority]) {
            return priorityRank[a.priority] - priorityRank[b.priority];
          }
          return b.createdAt.localeCompare(a.createdAt);
        })
        .slice(0, 6),
    [complaints],
  );

  const dailyMatrix = useMemo<DailyMatrixRow[]>(() => {
    const grouped = new Map<string, DailyMatrixRow>();

    for (const item of complaints) {
      const entry = grouped.get(item.incidentDate) ?? {
        date: item.incidentDate,
        desayuno: 0,
        almuerzo: 0,
        cena: 0,
        pendiente: 0,
        resuelto: 0,
        total: 0,
      };
      entry[item.mealPeriod] += 1;
      if (item.status === "resuelto" || item.status === "archivado") {
        entry.resuelto += 1;
      } else {
        entry.pendiente += 1;
      }
      entry.total += 1;
      grouped.set(item.incidentDate, entry);
    }

    return Array.from(grouped.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [complaints]);

  const hasActiveFilters = Boolean(
    filterDate ||
    filterMealPeriod ||
    filterCategory ||
    filterStatus ||
    filterPriority ||
    searchQuery,
  );

  const resetFilters = () => {
    setFilterDate("");
    setFilterMealPeriod("");
    setFilterCategory("");
    setFilterStatus("");
    setFilterPriority("");
    setSearchQuery("");
  };

  return {
    filterDate,
    setFilterDate,
    filterMealPeriod,
    setFilterMealPeriod,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
    complaintsQuery,
    complaints,
    summary,
    urgentQueue,
    dailyMatrix,
    hasActiveFilters,
    resetFilters,
  };
}

export type AdminComplaintsController = ReturnType<typeof useAdminComplaints>;
