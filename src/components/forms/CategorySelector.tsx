import {
  COMPLAINT_CATEGORIES,
  type ComplaintCategory,
} from "../../types/complaint";

interface CategorySelectorProps {
  value: ComplaintCategory;
  onChange: (value: ComplaintCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-800">
        Categoría para reporte diario
      </span>
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPLAINT_CATEGORIES.map((cat) => {
          const active = value === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(cat.id)}
              className={`flex min-h-[64px] flex-col justify-center rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                active
                  ? "border-emerald-700 bg-emerald-50/70 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-semibold">{cat.label}</span>
              <span className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {cat.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
