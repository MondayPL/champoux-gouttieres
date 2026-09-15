export function StatusBadge({
  statut,
  variant = "neutral",
}: {
  statut: string;
  variant?: "neutral" | "ok" | "warn" | "danger";
}) {
  const colors = {
    neutral: "bg-slate-100 text-slate-700",
    ok: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex max-w-xs items-center truncate rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[variant]}`}
      title={statut}
    >
      <span className="truncate">{statut}</span>
    </span>
  );
}
