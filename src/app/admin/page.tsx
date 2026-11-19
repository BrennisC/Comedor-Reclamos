"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLoginView } from "@/components/AdminLoginView";
import { fetchAdminSession, logoutAdmin, queryKeys } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const adminSessionQuery = useQuery({
    queryKey: queryKeys.adminSession,
    queryFn: fetchAdminSession,
  });

  const session = adminSessionQuery.data;
  const isAuthenticated = Boolean(session?.authenticated);

  const handleLogout = async () => {
    await logoutAdmin();
    queryClient.removeQueries({ queryKey: ["complaints"] });
    queryClient.removeQueries({ queryKey: queryKeys.adminUsers });
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminSession });
  };

  if (isAuthenticated && session) {
    return (
      <AdminDashboard
        sessionState={session}
        onLogoutAdmin={() => {
          void handleLogout();
        }}
        onOpenStudentPortal={() => {
          router.push("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <AdminLoginView
        sessionState={session}
        isCheckingSession={adminSessionQuery.isPending}
        onLoginSuccess={() => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.adminSession,
          });
        }}
        onBackToStudentPortal={() => {
          router.push("/");
        }}
      />
    </div>
  );
}
