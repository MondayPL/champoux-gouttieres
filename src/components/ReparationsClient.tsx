"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, formatMoney, fullName, fullAddress } from "@/lib/format";

type Rep = {
  id: string;
  numContrat: string | null;
  date: string | null;
  nom: string | null;
  prenom: string | null;
  civique: string | null;
  rue: string | null;
  villeNom: string | null;
  travaux: string | null;
  montant: number | null;
  contratGouttiere: string | null;
  etat: string | null;
};

export function ReparationsClient({ initial }: { initial: Rep[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"tous" | "fait" | "à faire">("tous");
  const [busy, setBusy] = useState<string | null>(null);

  const list = initial.filter((r) =>
    filter === "tous" ? true : (r.etat || "") === filter
  );

  async function setEtat(id: string, etat: string) {
    setBusy(id);
    try {
      await fetch(`/api/reparations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etat }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-slate-300 p-0.5">
        {(["tous", "à faire", "fait"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${
              filter === f ? "bg-slate-800 text-white" : "text-slate-600"
            }`}>
            {f}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Aucune réparation dans ce filtre.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Adresse</th>
                <th className="px-3 py-3">Travaux</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-3 py-3">Contrat gouttière</th>
                <th className="px-3 py-3">État</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.numContrat || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-3 py-2 font-medium">{fullName(r.nom, r.prenom)}</td>
                  <td className="px-3 py-2 text-slate-600">{fullAddress(r.civique, r.rue, r.villeNom)}</td>
                  <td className="px-3 py-2">{r.travaux || "—"}</td>
                  <td className="px-3 py-2">{formatMoney(r.montant)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-sky-700">{r.contratGouttiere || "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      disabled={busy === r.id}
                      value={r.etat || ""}
                      onChange={(e) => setEtat(r.id, e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      <option value="à faire">à faire</option>
                      <option value="fait">fait</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
