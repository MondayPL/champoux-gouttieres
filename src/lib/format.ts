import { format, parseISO } from "date-fns";
import { frCA } from "date-fns/locale";

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "d MMM yyyy", { locale: frCA });
}

export function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "d MMM", { locale: frCA });
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPiLin(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-CA")} pi.lin`;
}

/** Affiche gouttières + descentes, ex. « G: 120 pi.lin · D: 40 pi.lin » */
export function formatPiLinGD(
  g: number | null | undefined,
  d: number | null | undefined
): string | null {
  const parts: string[] = [];
  if (g != null && g > 0) parts.push(`G: ${g.toLocaleString("fr-CA")} pi.lin`);
  if (d != null && d > 0) parts.push(`D: ${d.toLocaleString("fr-CA")} pi.lin`);
  if (parts.length === 0) {
    if ((g != null && g === 0) || (d != null && d === 0)) {
      return "G: 0 pi.lin · D: 0 pi.lin";
    }
    return null;
  }
  return parts.join(" · ");
}

export function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function fullName(nom?: string | null, prenom?: string | null): string {
  return [prenom, nom].filter(Boolean).join(" ").trim() || "—";
}

export function fullAddress(
  civique?: string | null,
  rue?: string | null,
  ville?: string | null
): string {
  const street = [civique, rue].filter(Boolean).join(" ").trim();
  return [street, ville].filter(Boolean).join(", ") || "—";
}
