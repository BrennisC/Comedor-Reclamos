"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus } from "lucide-react";
import { createAdminUser, fetchAdminUsers, queryKeys } from "@/lib/api";
import type { AdminBannerMessage } from "@/constants/admin";

interface AdminsSectionProps {
  onNotice: (message: AdminBannerMessage) => void;
}

export function AdminsSection({ onNotice }: AdminsSectionProps) {
  const queryClient = useQueryClient();

  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const adminUsersQuery = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: fetchAdminUsers,
  });

  const createAdminMutation = useMutation({
    mutationFn: async () =>
      createAdminUser({
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword,
      }),
    onSuccess: async (created) => {
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      onNotice({
        type: "ok",
        text: `Administrador agregado: ${created.name} (${created.email}).`,
      });
    },
    onError: (err) => {
      onNotice({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No se pudo agregar el administrador.",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Cuentas de administrador registradas
          </h2>
          <p className="text-xs text-slate-500">
            Personal autorizado para consultar reclamos y organizar respuestas
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {adminUsersQuery.isPending ? (
            <div className="p-6 text-sm text-slate-500">
              Cargando administradores...
            </div>
          ) : (adminUsersQuery.data?.length ?? 0) === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              Sesión activa mediante variables de entorno del servidor.
            </div>
          ) : (
            adminUsersQuery.data?.map((adm) => (
              <div
                key={adm.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {adm.name}
                  </p>
                  <p className="text-xs text-slate-500">{adm.email}</p>
                </div>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {adm.createdAt ? adm.createdAt.slice(0, 10) : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white lg:col-span-5">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
          <UserPlus className="h-4 w-4 text-emerald-700" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Agregar nuevo administrador
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="Nombre del encargado"
              className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="encargado@comedor.edu"
              className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Contraseña inicial (mín. 8 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createAdminMutation.isPending}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {createAdminMutation.isPending
              ? "Creando cuenta..."
              : "Registrar administrador"}
          </button>
        </form>
      </section>
    </div>
  );
}
