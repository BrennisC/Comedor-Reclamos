type PortalFooterProps = {
  onRegister: () => void;
};

export function PortalFooter({ onRegister }: PortalFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-slate-500">
        <span>Comedor Universitario · Portal de Reclamos</span>
        <button
          type="button"
          onClick={onRegister}
          className="hover:text-slate-900"
        >
          Registrar reclamo
        </button>
      </div>
    </footer>
  );
}
