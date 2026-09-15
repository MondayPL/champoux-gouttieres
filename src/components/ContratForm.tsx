"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ContratFormData = {
  id?: string;
  numContrat?: string | null;
  date?: string;
  nom?: string | null;
  prenom?: string | null;
  telephone?: string | null;
  civique?: string | null;
  rue?: string | null;
  villeNom?: string | null;
  gouttiere?: string | null;
  piedLinG?: number | null;
  descente?: string | null;
  piedLinD?: number | null;
  equip?: string | null;
  enlvExist?: boolean;
  friseIncl?: boolean;
  toitTole?: boolean;
  montant?: number | null;
  grille?: string | null;
  piedLinGr?: number | null;
  statut?: string | null;
  colonne2?: string | null;
};

const empty: ContratFormData = {
  numContrat: "",
  date: "",
  nom: "",
  prenom: "",
  telephone: "",
  civique: "",
  rue: "",
  villeNom: "",
  gouttiere: "",
  piedLinG: null,
  descente: "",
  piedLinD: null,
  equip: "",
  enlvExist: false,
  friseIncl: false,
  toitTole: false,
  montant: null,
  grille: "",
  piedLinGr: null,
  statut: "",
  colonne2: "",
};

export function ContratForm({
  initial,
  demoBanner,
}: {
  initial?: Partial<ContratFormData>;
  demoBanner?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ContratFormData>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(!!demoBanner);
  const [file, setFile] = useState<File | null>(null);

  function set<K extends keyof ContratFormData>(key: K, value: ContratFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function analyserImage() {
    if (!file) {
      setError("Choisissez une image de soumission manuscrite.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/contrats/analyser", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse échouée");
      setShowDemo(!!data.demo);
      setForm((f) => ({ ...f, ...data.fields }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'analyse");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/contrats/${form.id}` : "/api/contrats";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement échoué");
      router.push(`/suivi/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";
  const label = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {showDemo && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Mode démo</strong> — aucune clé OPENAI_API_KEY. Extraction fictive éditable.
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Analyse photo (devis manuscrit)
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className={label}>Image</label>
            <input type="file" accept="image/*" className={field}
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="button" onClick={analyserImage} disabled={analyzing}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
            {analyzing ? "Analyse…" : "Analyser l'image"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Contrat / suivi
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={label}># Contrat</label>
            <input className={field} value={form.numContrat || ""} onChange={(e) => set("numContrat", e.target.value)} />
          </div>
          <div>
            <label className={label}>Date</label>
            <input type="date" className={field} value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className={label}>Téléphone</label>
            <input className={field} value={form.telephone || ""} onChange={(e) => set("telephone", e.target.value)} />
          </div>
          <div>
            <label className={label}>Nom</label>
            <input className={field} value={form.nom || ""} onChange={(e) => set("nom", e.target.value)} />
          </div>
          <div>
            <label className={label}>Prénom</label>
            <input className={field} value={form.prenom || ""} onChange={(e) => set("prenom", e.target.value)} />
          </div>
          <div>
            <label className={label}>Ville</label>
            <input className={field} value={form.villeNom || ""} onChange={(e) => set("villeNom", e.target.value)}
              placeholder="Assigne le secteur 1–7" />
          </div>
          <div>
            <label className={label}># Civique</label>
            <input className={field} value={form.civique || ""} onChange={(e) => set("civique", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Rue</label>
            <input className={field} value={form.rue || ""} onChange={(e) => set("rue", e.target.value)} />
          </div>
          <div>
            <label className={label}>Gouttière</label>
            <input className={field} value={form.gouttiere || ""} onChange={(e) => set("gouttiere", e.target.value)} />
          </div>
          <div>
            <label className={label}>Pied lin. G</label>
            <input type="number" step="0.1" className={field} value={form.piedLinG ?? ""}
              onChange={(e) => set("piedLinG", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <label className={label}>Descente</label>
            <input className={field} value={form.descente || ""} onChange={(e) => set("descente", e.target.value)} />
          </div>
          <div>
            <label className={label}>Pied lin. D</label>
            <input type="number" step="0.1" className={field} value={form.piedLinD ?? ""}
              onChange={(e) => set("piedLinD", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <label className={label}>Équip. (nacelle)</label>
            <input className={field} value={form.equip || ""} onChange={(e) => set("equip", e.target.value)} />
          </div>
          <div>
            <label className={label}>Montant ($)</label>
            <input type="number" className={field} value={form.montant ?? ""}
              onChange={(e) => set("montant", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <label className={label}>Grille</label>
            <input className={field} value={form.grille || ""} onChange={(e) => set("grille", e.target.value)} />
          </div>
          <div>
            <label className={label}>Pied lin. Gr</label>
            <input type="number" step="0.1" className={field} value={form.piedLinGr ?? ""}
              onChange={(e) => set("piedLinGr", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div className="flex flex-wrap gap-4 pt-6 sm:col-span-2 lg:col-span-3">
            {([
              ["enlvExist", "Enlv. exist."],
              ["friseIncl", "Frise incl."],
              ["toitTole", "Toit tôle"],
            ] as const).map(([k, lab]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={!!form[k]}
                  onChange={(e) => set(k, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600" />
                {lab}
              </label>
            ))}
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={label}>Statut (notes libres)</label>
            <textarea rows={2} className={field} value={form.statut || ""}
              onChange={(e) => set("statut", e.target.value)} />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
          {saving ? "Enregistrement…" : form.id ? "Mettre à jour" : "Créer"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700">
          Annuler
        </button>
      </div>
    </form>
  );
}
