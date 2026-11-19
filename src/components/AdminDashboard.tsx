"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  deleteComplaint,
  queryKeys,
  updateComplaintWorkflow,
} from "../lib/api";
import {
  getCategoryLabel,
  getMealPeriodLabel,
  getPriorityLabel,
  getStatusLabel,
  type AdminSessionState,
  type ComplaintPriority,
  type ComplaintRecord,
  type ComplaintStatus,
} from "../types/complaint";
import type { AdminBannerMessage, AdminSection } from "../constants/admin";
import { useAdminComplaints } from "../hooks/useAdminComplaints";
import {
  downloadReportPdf,
  type ReportInput,
} from "../lib/report";
import { AdminSidebar } from "./admin/AdminSidebar";
import { AdminTopBar } from "./admin/AdminTopBar";
import { SummarySection } from "./admin/SummarySection";
import { InboxSection } from "./admin/InboxSection";
import { ReportsSection } from "./admin/ReportsSection";
import { StorageGallerySection } from "./admin/StorageGallerySection";
import { AdminsSection } from "./admin/AdminsSection";
import { ComplaintDrawer } from "./admin/ComplaintDrawer";
import { ImageLightbox } from "./admin/ImageLightbox";
import { DeleteComplaintDialog } from "./admin/DeleteComplaintDialog";

interface AdminDashboardProps {
  sessionState: AdminSessionState;
  onLogoutAdmin: () => void;
  onOpenStudentPortal: () => void;
}

const SECTION_LABELS: Record<AdminSection, string> = {
  resumen: "Resumen General",
  bandeja: "Bandeja y Gestión",
  reportes: "Reportes por Día y Turno",
  storage: "Evidencias",
  admins: "Administradores",
};

export function AdminDashboard({
  sessionState,
  onLogoutAdmin,
  onOpenStudentPortal,
}: AdminDashboardProps) {
  const queryClient = useQueryClient();
  const complaintsState = useAdminComplaints();
  const { complaints, summary } = complaintsState;

  const [activeSection, setActiveSection] = useState<AdminSection>("resumen");
  const [bannerMessage, setBannerMessage] = useState<AdminBannerMessage | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [inspectingItem, setInspectingItem] = useState<ComplaintRecord | null>(
    null,
  );
  const [draftStatus, setDraftStatus] = useState<ComplaintStatus>("pendiente");
  const [draftPriority, setDraftPriority] =
    useState<ComplaintPriority>("media");
  const [draftNote, setDraftNote] = useState("");

  const [previewLightbox, setPreviewLightbox] =
    useState<ComplaintRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ComplaintRecord | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);

  const openInspector = (item: ComplaintRecord) => {
    setInspectingItem(item);
    setDraftStatus(item.status);
    setDraftPriority(item.priority);
    setDraftNote(item.adminNote ?? "");
  };

  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (!inspectingItem) throw new Error("No hay reclamo seleccionado.");
      return await updateComplaintWorkflow({
        id: inspectingItem.id,
        status: draftStatus,
        priority: draftPriority,
        adminNote: draftNote,
      });
    },
    onSuccess: async (updated) => {
      setInspectingItem(updated);
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setBannerMessage({
        type: "ok",
        text: `Reclamo ${updated.id} actualizado a "${getStatusLabel(updated.status)}" (prioridad ${getPriorityLabel(updated.priority)}).`,
      });
    },
    onError: (err) => {
      setBannerMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el reclamo.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (target: ComplaintRecord) => {
      await deleteComplaint(target.id);
      return target;
    },
    onSuccess: async (target) => {
      setInspectingItem((current) =>
        current?.id === target.id ? null : current,
      );
      setPendingDelete(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["complaints"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.quota }),
        queryClient.invalidateQueries({ queryKey: queryKeys.storageImages }),
      ]);
      setBannerMessage({
        type: "ok",
        text: "Reclamo eliminado permanentemente.",
      });
    },
    onError: (err) => {
      setBannerMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No se pudo eliminar el reclamo.",
      });
    },
  });

  const describeFilters = (): string => {
    const parts: string[] = [];
    if (complaintsState.filterDate) {
      parts.push(
        `Fecha ${complaintsState.filterDate.split("-").reverse().join("/")}`,
      );
    }
    if (complaintsState.filterMealPeriod) {
      parts.push(getMealPeriodLabel(complaintsState.filterMealPeriod));
    }
    if (complaintsState.filterCategory) {
      parts.push(getCategoryLabel(complaintsState.filterCategory));
    }
    if (complaintsState.filterStatus) {
      parts.push(getStatusLabel(complaintsState.filterStatus));
    }
    if (complaintsState.filterPriority) {
      parts.push(
        `Prioridad ${getPriorityLabel(complaintsState.filterPriority)}`,
      );
    }
    if (complaintsState.searchQuery.trim()) {
      parts.push(`Búsqueda "${complaintsState.searchQuery.trim()}"`);
    }
    return parts.length > 0
      ? parts.join(" · ")
      : "Todos los reclamos registrados";
  };

  const buildReportInput = (): ReportInput => ({
    complaints,
    summary,
    filtersLabel: describeFilters(),
  });

  const runReportExport = async () => {
    try {
      setIsExporting(true);
      await downloadReportPdf(buildReportInput());
      setBannerMessage({
        type: "ok",
        text: "Reporte PDF generado con el diseño institucional.",
      });
    } catch (error) {
      setBannerMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo generar el reporte.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    void runReportExport();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 lg:items-start">
      <AdminSidebar
        activeSection={activeSection}
        pendingCount={summary.byStatus.pendiente}
        adminName={sessionState.admin?.name ?? ""}
        adminEmail={sessionState.admin?.email ?? ""}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectSection={setActiveSection}
        onOpenStudentPortal={onOpenStudentPortal}
        onLogoutAdmin={onLogoutAdmin}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          sectionTitle={SECTION_LABELS[activeSection]}
          canExport={complaints.length > 0}
          isExporting={isExporting}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onExportPdf={handleExportPdf}
          onLogoutAdmin={onLogoutAdmin}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-4 sm:px-6 sm:py-6">
          {bannerMessage && (
            <div
              role="status"
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                bannerMessage.type === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
              }`}
            >
              <div className="flex items-center gap-2">
                {bannerMessage.type === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                )}
                <span>{bannerMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                aria-label="Cerrar notificación"
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {activeSection === "resumen" && (
            <SummarySection
              summary={summary}
              urgentQueue={complaintsState.urgentQueue}
              isPending={complaintsState.complaintsQuery.isPending}
              onOpenInbox={() => setActiveSection("bandeja")}
              onOpenInspector={openInspector}
            />
          )}

          {activeSection === "bandeja" && (
            <InboxSection
              controller={complaintsState}
              onOpenInspector={openInspector}
              onRequestDelete={setPendingDelete}
              onPreviewImage={setPreviewLightbox}
              onNotice={setBannerMessage}
            />
          )}

          {activeSection === "reportes" && (
            <ReportsSection
              dailyMatrix={complaintsState.dailyMatrix}
              complaintsCount={complaints.length}
              isExporting={isExporting}
              onExportPdf={handleExportPdf}
            />
          )}

          {activeSection === "storage" && <StorageGallerySection />}

          {activeSection === "admins" && (
            <AdminsSection onNotice={setBannerMessage} />
          )}
        </main>
      </div>

      {inspectingItem && (
        <ComplaintDrawer
          item={inspectingItem}
          draftStatus={draftStatus}
          draftPriority={draftPriority}
          draftNote={draftNote}
          isSaving={saveWorkflowMutation.isPending}
          onChangeStatus={setDraftStatus}
          onChangePriority={setDraftPriority}
          onChangeNote={setDraftNote}
          onSave={() => saveWorkflowMutation.mutate()}
          onDelete={() => setPendingDelete(inspectingItem)}
          onClose={() => setInspectingItem(null)}
        />
      )}

      {previewLightbox && (
        <ImageLightbox
          item={previewLightbox}
          onClose={() => setPreviewLightbox(null)}
        />
      )}

      <DeleteComplaintDialog
        item={pendingDelete}
        isBusy={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
        }}
      />
    </div>
  );
}
