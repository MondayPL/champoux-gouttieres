"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Ville = { id: string; nom: string; nomNorm: string; secteurId: string };
type Secteur = {
  id: string;
  numero: number;
  nom: string;
  couleur: string;
  villes: Ville[];
  _count: { contrats: number };
};

export function VillesManager({ initialSecteurs }: { initialSecteurs: Secteur[] }) {
  const router = useRouter();
  const [secteurs, setSecteurs] = useState(initialSecteurs);
  const [newVille, setNewVille] = useState({ nom: "", secteurId: "" });
  const [lookup, setLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/secteurs");
    setSecteurs(await res.json());
    router.refresh();
  }

  async function createVille(e: React.FormEvent) {
    e.preventDefault();
    if (!newVille.secteurId) {
      setError("Choisissez un secteur (1–7).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/villes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVille),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewVille({ nom: "", secteurId: newVille.secteurId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function deleteVille(id: string) {
    if (!confirm("Supprimer cette ville ?")) return;
    await fetch(`/api/villes/${id}`, { method: "DELETE" });
    await refresh();
  }

  function doLookup(e: React.FormEvent) {
    e.preventDefault();
    const q = lookup.trim().toLowerCase();
    for (const s of secteurs) {
      const v = s.villes.find((x) => x.nom.toLowerCase() === q || x.nomNorm.toLowerCase() === q.replace(/\s+/g, "-"));
      if (v) {
        setLookupResult(`${v.nom} → ${s.nom} (#${s.numero})`);
        return;
      }
    }
    setLookupResult(`Aucune ville trouvée pour « ${lookup} »`);
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Recherche ville → secteur</h2>
        <form onSubmit={doLookup} className="flex flex-col gap-2 sm:flex-row">
          <input className={field} placeholder="Ex. Victoriaville" value={lookup} onChange={(e) => setLookup(e.target.value)} />
          <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white">Chercher</button>
        </form>
        {lookupResult && <p className="mt-3 text-sm font-medium">{lookupResult}</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Nouvelle ville</h2>
        <form onSubmit={createVille} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-500">Ville</label>
            <input required className={field} value={newVille.nom} onChange={(e) => setNewVille((v) => ({ ...v, nom: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-500">Secteur</label>
            <select required className={field} value={newVille.secteurId}
              onChange={(e) => setNewVille((v) => ({ ...v, secteurId: e.target.value }))}>
              <option value="">— 1 à 7 —</option>
              {secteurs.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={busy} className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50">Ajouter</button>
        </form>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {secteurs.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full" style={{ background: s.couleur }} />
                <div>
                  <div className="text-lg font-semibold">{s.nom}</div>
                  <div className="text-xs text-slate-500">
                    {s.villes.length} ville(s) ·{" "}
                    <Link href={`/suivi?secteur=${s.id}`} className="text-sky-700 hover:underline">
                      {s._count.contrats} contrat(s)
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2">
              {s.villes.map((v) => (
                <li key={v.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                  {v.nom}
                  <button type="button" onClick={() => deleteVille(v.id)} className="text-slate-400 hover:text-red-600">×</button>
                </li>
              ))}
              {s.villes.length === 0 && <li className="text-sm text-slate-400">Aucune ville.</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
