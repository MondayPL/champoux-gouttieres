import { formatMoyenneInstallee, moyenneInstalleeParJour, type TravailSemaine } from "./moyenneInstallee";

function travail(p: Partial<TravailSemaine> & Pick<TravailSemaine, "dateJour">): TravailSemaine {
  return { installEtat: null, piedLinG: null, piedLinD: null, ...p };
}

let failed = 0;
function ok(cond: boolean, name: string, detail?: string) {
  if (cond) {
    console.log(`ok  ${name}`);
  } else {
    failed++;
    console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

// 1. Exclusion des travaux non terminés (autres valeurs ou champ vide)
{
  const travaux: TravailSemaine[] = [
    travail({ dateJour: "2026-11-09", installEtat: "Terminée", piedLinG: 100, piedLinD: 20 }),
    travail({ dateJour: "2026-11-09", installEtat: "Non terminée", piedLinG: 999, piedLinD: 999 }),
    travail({ dateJour: "2026-11-10", installEtat: "Fait", piedLinG: 999, piedLinD: 999 }),
    travail({ dateJour: "2026-11-10", installEtat: "Complétée", piedLinG: 999, piedLinD: 999 }),
    travail({ dateJour: "2026-11-11", installEtat: null, piedLinG: 999, piedLinD: 999 }),
    travail({ dateJour: "2026-11-11", installEtat: "", piedLinG: 999, piedLinD: 999 }),
    travail({ dateJour: "2026-11-12", piedLinG: 999, piedLinD: 999 }),
  ];
  const m = moyenneInstalleeParJour(travaux);
  ok(m === 120, "exclut les non terminés (seul Terminée compte)", `obtenu ${m}`);
}

// 2. Plusieurs jobs le même jour : un seul jour au dénominateur, somme de tous les G+D
{
  const travaux: TravailSemaine[] = [
    travail({ dateJour: "2026-11-09", installEtat: "Terminée", piedLinG: 100, piedLinD: 20 }),
    travail({ dateJour: "2026-11-09", installEtat: "Terminée", piedLinG: 50, piedLinD: 10 }),
  ];
  const m = moyenneInstalleeParJour(travaux);
  ok(m === 180, "plusieurs jobs le même jour : (100+20+50+10) / 1", `obtenu ${m}`);
}

// 3. Zéro jour terminé : null (afficher « — »), pas de division par zéro
{
  const nonTermines = [travail({ dateJour: "2026-11-09", installEtat: "Non terminée", piedLinG: 40, piedLinD: 10 })];
  const sansDate: TravailSemaine[] = [{ installEtat: "Terminée", piedLinG: 40, piedLinD: 10, dateJour: "" }];
  ok(moyenneInstalleeParJour([]) === null, "liste vide → null");
  ok(moyenneInstalleeParJour(nonTermines) === null, "seulement non terminés → null");
  ok(moyenneInstalleeParJour(sansDate) === null, "Terminée sans dateJour → null");
  ok(formatMoyenneInstallee(null) === "\u2014", "format zéro jour : tiret cadratin");
}

// 4. Calcul G + D sur plusieurs jours
{
  const travaux: TravailSemaine[] = [
    travail({ dateJour: "2026-11-09", installEtat: "Terminée", piedLinG: 100, piedLinD: 20 }),
    travail({ dateJour: "2026-11-10", installEtat: "Terminée", piedLinG: 50, piedLinD: 30 }),
    travail({ dateJour: "2026-11-10", installEtat: "Non terminée", piedLinG: 8, piedLinD: 2 }),
    travail({ dateJour: "2026-11-11", installEtat: "Terminée", piedLinG: null, piedLinD: 40 }),
  ];
  // jours terminés : 09, 10, 11 (3) ; pi = 120 + 80 + 40 = 240 ; moyenne = 80
  const m = moyenneInstalleeParJour(travaux);
  ok(m === 80, "G+D sur 3 jours : (120+80+40) / 3 = 80", `obtenu ${m}`);
}

// format fr-CA se termine par « pi » pour un nombre
{
  const t = formatMoyenneInstallee(80);
  ok(t.endsWith(" pi") && t.includes("80"), "format fr-CA avec unité pi", `obtenu ${JSON.stringify(t)}`);
  const t2 = formatMoyenneInstallee(1500);
  ok(t2.endsWith(" pi"), "format milliers se termine par pi", `obtenu ${JSON.stringify(t2)}`);
}

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nTous les tests ont réussi.");
