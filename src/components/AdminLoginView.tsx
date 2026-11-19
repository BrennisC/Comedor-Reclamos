"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Utensils,
  X,
} from "lucide-react";
import { ApiError, loginAdmin, queryKeys } from "@/lib/api";
import type { AdminSessionState } from "@/types/complaint";

interface AdminLoginViewProps {
  sessionState: AdminSessionState | undefined;
  isCheckingSession: boolean;
  onLoginSuccess: () => void;
  onBackToStudentPortal: () => void;
}

interface LoginValidationResult {
  isValid: boolean;
  emailError: string | null;
  passwordError: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(
  normalizedEmail: string,
  passwordValue: string,
): LoginValidationResult {
  let emailError: string | null = null;
  let passwordError: string | null = null;

  if (!normalizedEmail) {
    emailError = "Ingresa tu correo electrónico de administrador.";
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    emailError = "El formato del correo electrónico no es válido.";
  }

  if (!passwordValue) {
    passwordError = "Ingresa tu contraseña de administrador.";
  }

  return {
    isValid: !emailError && !passwordError,
    emailError,
    passwordError,
  };
}

export function AdminLoginView({
  sessionState: _sessionState,
  isCheckingSession,
  onLoginSuccess,
  onBackToStudentPortal,
}: AdminLoginViewProps) {
  const queryClient = useQueryClient();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capsLockActive, setCapsLockActive] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const validation = useMemo(
    () => validateCredentials(normalizedEmail, password),
    [normalizedEmail, password],
  );

  const isEmailFormatValid = useMemo(
    () => EMAIL_REGEX.test(normalizedEmail),
    [normalizedEmail],
  );

  const showEmailError =
    (emailTouched || submittedOnce) && Boolean(validation.emailError);
  const showPasswordError =
    (passwordTouched || submittedOnce) && Boolean(validation.passwordError);

  useEffect(() => {
    if (!isCheckingSession && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isCheckingSession]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      return await loginAdmin({
        email: normalizedEmail,
        password,
      });
    },
    onSuccess: async () => {
      setErrorMessage(null);
      setPassword("");
      setPasswordTouched(false);
      setSubmittedOnce(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminSession });
      onLoginSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("No se pudo verificar el acceso administrativo.");
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    },
  });

  const handlePasswordKeyCheck = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (typeof event.getModifierState === "function") {
        setCapsLockActive(event.getModifierState("CapsLock"));
      }
      if (event.key === "Escape" && errorMessage) {
        setErrorMessage(null);
      }
    },
    [errorMessage],
  );

  const handleClearFields = useCallback(() => {
    setEmail("");
    setPassword("");
    setEmailTouched(false);
    setPasswordTouched(false);
    setSubmittedOnce(false);
    setErrorMessage(null);
    setShowPassword(false);
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const handleRetrySessionCheck = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminSession });
  }, [queryClient]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmittedOnce(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setErrorMessage(null);

    if (!validation.isValid) {
      setErrorMessage(
        validation.emailError ||
          validation.passwordError ||
          "Completa tu correo y contraseña para continuar.",
      );
      if (validation.emailError && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (validation.passwordError && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    loginMutation.mutate();
  };

  const isBusy = loginMutation.isPending;

  return (
    <div className="mx-auto max-w-lg py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToStudentPortal}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Volver al formulario de reclamos
        </button>

        {isCheckingSession && (
          <button
            type="button"
            onClick={handleRetrySessionCheck}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            Reintentar
          </button>
        )}
      </div>

      <section
        aria-labelledby="admin-login-heading"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-200 px-6 py-6 sm:px-7">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-emerald-800">
                Panel Administrativo
              </p>
              <p className="text-xs text-slate-500">Comedor Universitario</p>
            </div>
          </div>

          <h1
            id="admin-login-heading"
            className="mt-4 font-display text-2xl font-bold text-slate-900"
          >
            Iniciar sesión
          </h1>
        </div>

        {isCheckingSession ? (
          <div
            role="status"
            aria-label="Verificando sesión"
            className="space-y-5 px-6 py-8 sm:px-7"
          >
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-slate-100" />
              <div className="h-11 w-full rounded-lg bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-11 w-full rounded-lg bg-slate-100" />
            </div>
            <div className="h-11 w-full rounded-lg bg-slate-100" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 px-6 py-6 sm:px-7"
          >
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  aria-label="Cerrar mensaje de error"
                  className="rounded p-0.5 text-red-700 transition-colors hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-slate-800"
                >
                  Correo electrónico
                </label>
                {isEmailFormatValid && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Válido
                  </span>
                )}
              </div>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={emailInputRef}
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="Ingresa tu correo electrónico"
                  aria-invalid={showEmailError}
                  aria-describedby={
                    showEmailError ? "admin-email-error" : undefined
                  }
                  required
                  className={`min-h-[44px] w-full rounded-lg border bg-white pr-10 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                    showEmailError
                      ? "border-red-400 focus:border-red-600"
                      : "border-slate-300 focus:border-emerald-700"
                  }`}
                />
                {email.length > 0 && !isBusy && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("");
                      setEmailTouched(false);
                      emailInputRef.current?.focus();
                    }}
                    aria-label="Borrar correo electrónico"
                    className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {showEmailError && (
                <p
                  id="admin-email-error"
                  className="mt-1.5 text-xs text-red-700"
                >
                  {validation.emailError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-slate-800"
                >
                  Contraseña
                </label>
                {capsLockActive && (
                  <span className="text-xs font-medium text-amber-700">
                    Bloq Mayús activado
                  </span>
                )}
              </div>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={passwordInputRef}
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  onKeyUp={handlePasswordKeyCheck}
                  onKeyDown={handlePasswordKeyCheck}
                  placeholder="Ingresa tu contraseña"
                  aria-invalid={showPasswordError}
                  aria-describedby={
                    showPasswordError ? "admin-password-error" : undefined
                  }
                  required
                  className={`min-h-[44px] w-full rounded-lg border bg-white pr-11 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                    showPasswordError
                      ? "border-red-400 focus:border-red-600"
                      : "border-slate-300 focus:border-emerald-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {showPasswordError && (
                <p
                  id="admin-password-error"
                  className="mt-1.5 text-xs text-red-700"
                >
                  {validation.passwordError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 whitespace-nowrap"
              >
                <Lock className="h-4 w-4 shrink-0" />
                {isBusy
                  ? "Verificando credenciales..."
                  : "Entrar al panel administrativo"}
              </button>

              {(email.length > 0 || password.length > 0) && !isBusy && (
                <button
                  type="button"
                  onClick={handleClearFields}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs text-slate-600 sm:px-7">
          <span className="inline-flex items-center gap-1.5">
            <Utensils className="h-3.5 w-3.5 text-slate-500" />
            ¿Necesitas registrar un reclamo?
          </span>
          <button
            type="button"
            onClick={onBackToStudentPortal}
            className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800 hover:underline"
          >
            Ir al portal de estudiantes
          </button>
        </div>
      </section>
    </div>
  );
}
