"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatPiLinGD, fullAddress, fullName } from "@/lib/format";
import { JOURS_SEMAINE } from "@/lib/optimizer";
import { CAPACITE_JOURNEE } from "@/lib/constants";

type ContratFields = {
  id: string;
  numContrat: string | null;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  civique: string | null;
  rue: string | null;
  villeNom: string | null;
  montant: number | null;
  piedLinG: number | null;
  piedLinD: number | null;
  equip: string | null;
  statut: string | null;
};

type Stop = {
  id: string;
  ordre: number;
  contrat: ContratFields;
};

type Route = {
  id: string;
  semaine: number;
  jourSemaine: number;
  nom: string | null;
  secteur: { id: string; nom: string; numero: number; couleur: string } | null;
  installateur: { id: string; nom: string } | null;
  stops: Stop[];
};

type ContratLibre = {
  id: string;
  numContrat: string | null;
  nom: string | null;
  prenom: string | null;
  telephone?: string | null;
  civique: string | null;
  rue: string | null;
  villeNom: string | null;
  montant: number | null;
  piedLinG?: number | null;
  piedLinD?: number | null;
  equip?: string | null;
  statut?: string | null;
  secteurId: string | null;
  secteur: { id: string; nom: string; numero: number; couleur: string } | null;
};

const JOUR_LABEL: Record<number, string> = Object.fromEntries(
  JOURS_SEMAINE.map((j) => [j.n, j.label])
);

function normalizeStopContrat(c: Partial<ContratFields> & { id: string }): ContratFields {
  return {
    id: c.id,
    numContrat: c.numContrat ?? null,
    nom: c.nom ?? null,
    prenom: c.prenom ?? null,
    telephone: c.telephone ?? null,
    civique: c.civique ?? null,
    rue: c.rue ?? null,
    villeNom: c.villeNom ?? null,
    montant: c.montant ?? null,
    piedLinG: c.piedLinG ?? null,
    piedLinD: c.piedLinD ?? null,
    equip: c.equip ?? null,
    statut: c.statut ?? null,
  };
}

function mapApiRoutes(data: Route[]): Route[] {
  return data.map((r) => ({
    ...r,
    stops: (r.stops || []).map((s) => ({
      ...s,
      contrat: normalizeStopContrat(s.contrat),
    })),
  }));
}

function EquipBadge({ equip }: { equip: string | null | undefined }) {
  if (!equip?.trim()) return null;
  const isNacelle = /nacelle/i.test(equip);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isNacelle
          ? "bg-orange-100 text-orange-800"
          : "bg-sky-100 text-sky-800"
      }`}
      title={equip}
    >
      {isNacelle ? "🏗️ Nacelle" : `⚙️ ${equip}`}
    </span>
  );
}

function StatutNote({ statut }: { statut: string | null | undefined }) {
  if (!statut?.trim()) return null;
  return (
    <div className="mt-1 text-xs text-amber-800/90" title={statut}>
      <span className="font-medium text-amber-900">Notes :</span> {statut}
    </div>
  );
}

export function CalendrierClient({
  initialRoutes,
  contratsLibres: initialLibres,
  maxSemaine,
}: {
  initialRoutes: Route[];
  contratsLibres: ContratLibre[];
  maxSemaine: number;
}) {
  const router = useRouter();
  const [routes, setRoutes] = useState(() => mapApiRoutes(initialRoutes));
  const [libres, setLibres] = useState(initialLibres);
  const [semaine, setSemaine] = useState(
    initialRoutes[0]?.semaine ?? 1
  );
  const [mode, setMode] = useState<"voir" | "manuel" | "ia" | "installateurs">(
    "voir"
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(
    initialRoutes.find((r) => r.semaine === (initialRoutes[0]?.semaine ?? 1))?.id ?? null
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [nbSemainesOpt, setNbSemainesOpt] = useState(4);
  const [showMontants, setShowMontants] = useState(true);
  const [printScope, setPrintScope] = useState<"semaine" | "jour">("semaine");

  useEffect(() => {
    setRoutes(mapApiRoutes(initialRoutes));
  }, [initialRoutes]);

  useEffect(() => {
    setLibres(initialLibres);
  }, [initialLibres]);

  const selected = routes.find((r) => r.id === selectedRouteId) || null;

  const weekRoutes = useMemo(
    () => routes.filter((r) => r.semaine === semaine),
    [routes, semaine]
  );

  const byJour = useMemo(() => {
    const m = new Map<number, Route | undefined>();
    for (const j of JOURS_SEMAINE) m.set(j.n, undefined);
    for (const r of weekRoutes) m.set(r.jourSemaine, r);
    return m;
  }, [weekRoutes]);

  const maxS = Math.max(maxSemaine, ...routes.map((r) => r.semaine), 1);

  function feedback(ok: boolean, text: string) {
    setMessageOk(ok);
    setMessage(text);
  }

  async function refresh() {
    const res = await fetch("/api/routes");
    const data = await res.json();
    setRoutes(mapApiRoutes(data));
    router.refresh();
  }

  async function optimiseIA() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/routes/optimiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startSemaine: 1,
          semaines: nbSemainesOpt,
          replaceExisting: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimisation échouée");
      const excluded =
        data.excludedUnready != null && data.excludedUnready > 0
          ? ` · ${data.excludedUnready} non prêt(s) exclu(s)`
          : "";
      feedback(
        true,
        data.message ||
          `Plan généré : ${data.created} journée(s), ${data.stops} emploi(s), ` +
            `semaines 1–${data.endSemaine}` +
            (data.underTarget != null ? ` · ${data.underTarget} jour(s) sous cible` : "") +
            excluded +
            `. Cibles ${CAPACITE_JOURNEE.montantMin}–${CAPACITE_JOURNEE.montantMax}$ · max ${CAPACITE_JOURNEE.jobsAiMax} jobs/jour · 1 secteur.`
      );
      await refresh();
      setSemaine(1);
      if (data.routes?.[0]?.id) setSelectedRouteId(data.routes[0].id);
      setMode("voir");
    } catch (e) {
      feedback(false, e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function reorder(routeId: string, orderedStopIds: string[]) {
    setBusy(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/stops`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedStopIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
      feedback(true, "Ordre des arrêts mis à jour.");
    } catch (e) {
      feedback(false, e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function moveUp(route: Route, index: number) {
    if (index <= 0 || busy) return;
    const ids = route.stops.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorder(route.id, ids);
  }

  function moveDown(route: Route, index: number) {
    if (index >= route.stops.length - 1 || busy) return;
    const ids = route.stops.map((s) => s.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorder(route.id, ids);
  }

  async function moveToDay(stopId: string, fromRouteId: string, toJour: number) {
    setBusy(true);
    try {
      let target = routes.find(
        (r) => r.semaine === semaine && r.jourSemaine === toJour
      );
      if (!target) {
        const res = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            semaine,
            jourSemaine: toJour,
            nom: `Semaine ${semaine} — ${JOUR_LABEL[toJour]}`,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Création de journée échouée");
        target = await res.json();
      }
      const res = await fetch(`/api/routes/${fromRouteId}/stops`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, toRouteId: target!.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
      setSelectedRouteId(target!.id);
      feedback(true, `Arrêt déplacé vers ${JOUR_LABEL[toJour]}.`);
    } catch (e) {
      feedback(false, e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function removeStop(routeId: string, stopId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/stops`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
      feedback(true, "Arrêt retiré de la tournée.");
    } catch (e) {
      feedback(false, e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function addLibre(contratId: string, routeId: string) {
    const route = routes.find((r) => r.id === routeId);
    if (route && route.stops.length >= CAPACITE_JOURNEE.jobsManualMax) {
      feedback(
        false,
        `Maximum soft atteint (${CAPACITE_JOURNEE.jobsManualMax} arrêts). Retirez un arrêt avant d’en ajouter.`
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contratId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLibres((prev) => prev.filter((c) => c.id !== contratId));
      await refresh();
      feedback(true, "Contrat ajouté à la tournée.");
    } catch (e) {
      feedback(false, e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function dayTotals(r?: Route) {
    if (!r) return { n: 0, $: 0 };
    return {
      n: r.stops.length,
      $: r.stops.reduce((s, x) => s + (x.contrat.montant || 0), 0),
    };
  }

  function printInstaller(scope: "semaine" | "jour") {
    setPrintScope(scope);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  const installerDays =
    printScope === "jour" && selected
      ? [selected]
      : JOURS_SEMAINE.map((j) => byJour.get(j.n)).filter(Boolean) as Route[];

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={semaine <= 1}
            onClick={() => setSemaine((s) => Math.max(1, s - 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">←</button>
          <span className="text-sm font-bold text-slate-900">Semaine {semaine}</span>
          <button type="button"
            onClick={() => setSemaine((s) => s + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">→</button>
          <span className="text-xs text-slate-500">(fictive · lun–ven · max connue {maxS})</span>
        </div>
        <div className="inline-flex flex-wrap rounded-lg border border-slate-300 p-0.5">
          {([
            ["voir", "Voir"],
            ["manuel", "Ajustement manuel"],
            ["ia", "Optimisé par IA"],
            ["installateurs", "Vue installateurs"],
          ] as const).map(([m, label]) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                mode === m ? "bg-violet-600 text-white" : "text-slate-600"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {mode === "ia" && (
        <div className="no-print rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          <p className="mb-2 font-semibold">Optimisé par IA (heuristique locale)</p>
          <ul className="mb-3 list-disc space-y-1 pl-5 text-violet-900">
            <li>Semaines fictives Semaine 1, 2… — lun–ven uniquement (plusieurs semaines)</li>
            <li>IA : max {CAPACITE_JOURNEE.jobsAiMax} emplois / jour (cap dur)</li>
            <li>Cible {CAPACITE_JOURNEE.montantMin.toLocaleString("fr-CA")}–{CAPACITE_JOURNEE.montantMax.toLocaleString("fr-CA")} $ / jour</li>
            <li>Exactement 1 secteur / jour (pas d&apos;emprunt)</li>
            <li>Priorité date (plus ancien d&apos;abord), puis montant</li>
            <li>Ordre des arrêts : ville / rue / centroïdes (moins de km)</li>
            <li>Chaque secteur visité ≥ 1× par mois (~4 semaines)</li>
            <li>Exclut les jobs non prêts (pas prêt, en commande, correction, annul…)</li>
            <li>Ajout manuel possible au-delà de 2 (jusqu&apos;à {CAPACITE_JOURNEE.jobsManualMax})</li>
          </ul>
          <p className="mb-3">Contrats libres (non planifiés) : <strong>{libres.length}</strong></p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">
              Nb semaines{" "}
              <input type="number" min={1} max={12} value={nbSemainesOpt}
                onChange={(e) => setNbSemainesOpt(Number(e.target.value) || 4)}
                className="ml-1 w-16 rounded border border-violet-300 px-2 py-1" />
            </label>
            <button type="button" disabled={busy || libres.length === 0}
              onClick={optimiseIA}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {busy ? "Génération…" : "Générer le plan"}
            </button>
          </div>
        </div>
      )}

      {mode === "manuel" && (
        <div className="no-print rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Ajustement manuel — Semaine {semaine}</p>
          <p className="mt-1 text-amber-800">
            Utilisez ▲▼ pour réordonner, « Déplacer vers… » pour changer de jour,
            « Retirer » pour libérer un contrat, et « Ajouter » depuis la liste des contrats libres.
            L&apos;IA plafonne à {CAPACITE_JOURNEE.jobsAiMax} jobs ; en manuel vous pouvez en ajouter jusqu&apos;à {CAPACITE_JOURNEE.jobsManualMax}.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`no-print rounded-lg border px-4 py-3 text-sm ${
            messageOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {message}
        </div>
      )}

      {/* ——— Vue installateurs ——— */}
      {mode === "installateurs" && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <span className="font-semibold text-emerald-900">Vue installateurs</span>
            <label className="inline-flex items-center gap-2 text-emerald-900">
              <input
                type="checkbox"
                checked={showMontants}
                onChange={(e) => setShowMontants(e.target.checked)}
              />
              Afficher montants
            </label>
            <button
              type="button"
              onClick={() => printInstaller("semaine")}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
            >
              Imprimer la semaine
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => printInstaller("jour")}
              className="rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-40"
            >
              Imprimer le jour
            </button>
          </div>

          <div className="installer-screen space-y-6">
            {JOURS_SEMAINE.map((j) => {
              const r = byJour.get(j.n);
              if (!r) {
                return (
                  <div key={j.n} className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                    {j.label} — aucun trajet
                  </div>
                );
              }
              return (
                <InstallerDayCard
                  key={r.id}
                  route={r}
                  showMontants={showMontants}
                  highlight={selectedRouteId === r.id}
                  onSelect={() => setSelectedRouteId(r.id)}
                />
              );
            })}
          </div>

          <div className="installer-print hidden print:block">
            <h1 className="mb-4 text-xl font-bold">
              Champoux Gouttières — Semaine {semaine}
              {printScope === "jour" && selected
                ? ` · ${JOUR_LABEL[selected.jourSemaine]}`
                : ""}
            </h1>
            {installerDays.map((r) => (
              <InstallerDayCard
                key={`print-${r.id}`}
                route={r}
                showMontants={showMontants}
                print
              />
            ))}
          </div>
        </div>
      )}

      {/* Week grid Mon–Fri — office modes */}
      {mode !== "installateurs" && (
        <>
          <div className="no-print grid gap-2 sm:grid-cols-5">
            {JOURS_SEMAINE.map((j) => {
              const r = byJour.get(j.n);
              const t = dayTotals(r);
              const ok =
                t.n > 0 &&
                t.$ >= CAPACITE_JOURNEE.montantMin &&
                t.$ <= CAPACITE_JOURNEE.montantMax;
              return (
                <button
                  key={j.n}
                  type="button"
                  onClick={() => r && setSelectedRouteId(r.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedRouteId === r?.id
                      ? "border-sky-400 ring-2 ring-sky-200"
                      : "border-slate-200 hover:border-slate-300"
                  } ${r ? "bg-white" : "bg-slate-50"}`}
                  style={
                    r?.secteur
                      ? { borderLeftWidth: 4, borderLeftColor: r.secteur.couleur }
                      : undefined
                  }
                >
                  <div className="text-xs font-semibold uppercase text-slate-500">{j.label}</div>
                  {r ? (
                    <>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {r.secteur ? `Secteur ${r.secteur.numero}` : r.nom || "Tournée"}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {t.n} job{t.n > 1 ? "s" : ""} · {formatMoney(t.$)}
                      </div>
                      <div className={`mt-1 text-[10px] font-medium ${ok ? "text-emerald-600" : "text-amber-600"}`}>
                        {ok ? "Cible OK" : "Sous cible"}
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400">Aucun trajet</div>
                  )}
                </button>
              );
            })}
          </div>

          <section className="no-print rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Détail de la tournée</h2>
            {!selected ? (
              <p className="text-sm text-slate-500">Sélectionnez un jour de la Semaine {semaine}.</p>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold">
                    Semaine {selected.semaine} — {JOUR_LABEL[selected.jourSemaine]}
                  </span>
                  {selected.secteur && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: `${selected.secteur.couleur}22` }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: selected.secteur.couleur }} />
                      Secteur {selected.secteur.numero}
                    </span>
                  )}
                  <span className="text-slate-600">
                    {formatMoney(dayTotals(selected).$)} · {selected.stops.length} arrêts
                  </span>
                </div>
                {selected.stops.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun arrêt.</p>
                ) : (
                  <ol className="space-y-2">
                    {selected.stops
                      .slice()
                      .sort((a, b) => a.ordre - b.ordre)
                      .map((stop, idx) => (
                        <li key={stop.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">
                                {fullName(stop.contrat.nom, stop.contrat.prenom)}
                              </span>
                              {stop.contrat.numContrat && (
                                <span className="font-mono text-xs text-slate-400">
                                  #{stop.contrat.numContrat}
                                </span>
                              )}
                              <EquipBadge equip={stop.contrat.equip} />
                            </div>
                            <div className="text-sm text-slate-600">
                              {fullAddress(stop.contrat.civique, stop.contrat.rue, stop.contrat.villeNom)}
                            </div>
                            {stop.contrat.telephone && (
                              <div className="text-xs font-medium text-slate-700">
                                ☎ {stop.contrat.telephone}
                              </div>
                            )}
                            {formatPiLinGD(stop.contrat.piedLinG, stop.contrat.piedLinD) && (
                              <div className="text-xs font-medium text-slate-700">
                                {formatPiLinGD(stop.contrat.piedLinG, stop.contrat.piedLinD)}
                              </div>
                            )}
                            <div className="text-xs text-slate-500">
                              {formatMoney(stop.contrat.montant)}
                            </div>
                            <StatutNote statut={stop.contrat.statut} />
                          </div>
                          {mode === "manuel" && (
                            <div className="flex shrink-0 flex-col gap-1.5">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={busy || idx === 0}
                                  onClick={() => moveUp(selected, idx)}
                                  title="Monter"
                                  className="rounded border border-slate-300 px-2 py-1 text-xs font-bold disabled:opacity-40"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={busy || idx >= selected.stops.length - 1}
                                  onClick={() => moveDown(selected, idx)}
                                  title="Descendre"
                                  className="rounded border border-slate-300 px-2 py-1 text-xs font-bold disabled:opacity-40"
                                >
                                  ▼
                                </button>
                              </div>
                              <label className="block text-[10px] font-medium text-slate-500">
                                Déplacer vers…
                                <select
                                  disabled={busy}
                                  className="mt-0.5 block w-full rounded border border-slate-300 px-1.5 py-1 text-xs"
                                  defaultValue=""
                                  onChange={(e) => {
                                    const j = Number(e.target.value);
                                    if (j) moveToDay(stop.id, selected.id, j);
                                    e.target.value = "";
                                  }}
                                >
                                  <option value="">Choisir un jour</option>
                                  {JOURS_SEMAINE.filter((x) => x.n !== selected.jourSemaine).map((x) => (
                                    <option key={x.n} value={x.n}>{x.label}</option>
                                  ))}
                                </select>
                              </label>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => removeStop(selected.id, stop.id)}
                                className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-40"
                              >
                                Retirer
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                  </ol>
                )}

                {mode === "manuel" && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="mb-2 text-sm font-semibold">
                      Contrats libres — Ajouter à cette tournée
                    </h3>
                    {libres.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucun contrat libre.</p>
                    ) : (
                      <ul className="max-h-64 space-y-1 overflow-y-auto">
                        {libres.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 truncate">
                                <span>
                                  {fullName(c.nom, c.prenom)} · {c.villeNom} · {formatMoney(c.montant)}
                                </span>
                                <EquipBadge equip={c.equip} />
                              </div>
                              {c.statut && (
                                <div className="truncate text-[11px] text-amber-800">{c.statut}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={
                                busy ||
                                selected.stops.length >= CAPACITE_JOURNEE.jobsManualMax
                              }
                              onClick={() => addLibre(c.id, selected.id)}
                              className="shrink-0 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                              title={
                                selected.stops.length >= CAPACITE_JOURNEE.jobsManualMax
                                  ? `Max soft ${CAPACITE_JOURNEE.jobsManualMax} arrêts`
                                  : undefined
                              }
                            >
                              Ajouter
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function InstallerDayCard({
  route,
  showMontants,
  highlight,
  onSelect,
  print,
}: {
  route: Route;
  showMontants: boolean;
  highlight?: boolean;
  onSelect?: () => void;
  print?: boolean;
}) {
  const stops = route.stops.slice().sort((a, b) => a.ordre - b.ordre);
  const className = `w-full rounded-xl border bg-white p-4 text-left shadow-sm ${
    highlight ? "border-sky-400 ring-2 ring-sky-200" : "border-slate-200"
  } ${print ? "mb-6 break-inside-avoid" : ""}`;
  const style = route.secteur
    ? { borderLeftWidth: 6, borderLeftColor: route.secteur.couleur }
    : undefined;

  const inner = (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold text-slate-900">
          {JOUR_LABEL[route.jourSemaine]}
        </span>
        <span className="text-sm text-slate-500">Semaine {route.semaine}</span>
        {route.secteur && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              background: `${route.secteur.couleur}22`,
              color: route.secteur.couleur,
            }}
          >
            Secteur {route.secteur.numero}
          </span>
        )}
        <span className="text-xs text-slate-500">
          {stops.length} arrêt{stops.length > 1 ? "s" : ""}
        </span>
      </div>
      <ol className="space-y-3">
        {stops.map((stop, idx) => (
          <li key={stop.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-slate-900">
                  {fullName(stop.contrat.nom, stop.contrat.prenom)}
                </span>
                {stop.contrat.numContrat && (
                  <span className="font-mono text-xs font-normal text-slate-400">
                    #{stop.contrat.numContrat}
                  </span>
                )}
                <EquipBadge equip={stop.contrat.equip} />
              </div>
              <div className="text-sm text-slate-700">
                {fullAddress(stop.contrat.civique, stop.contrat.rue, stop.contrat.villeNom)}
              </div>
              {stop.contrat.telephone && (
                <div className="mt-0.5 text-sm font-medium text-slate-800">
                  ☎ {stop.contrat.telephone}
                </div>
              )}
              {formatPiLinGD(stop.contrat.piedLinG, stop.contrat.piedLinD) && (
                <div className="mt-0.5 text-sm font-medium text-slate-800">
                  {formatPiLinGD(stop.contrat.piedLinG, stop.contrat.piedLinD)}
                </div>
              )}
              {showMontants && stop.contrat.montant != null && (
                <div className="mt-0.5 text-xs text-slate-500">
                  {formatMoney(stop.contrat.montant)}
                </div>
              )}
              <StatutNote statut={stop.contrat.statut} />
            </div>
          </li>
        ))}
      </ol>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className} style={style}>
        {inner}
      </button>
    );
  }
  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}
