/** Normalisation villes pour matching feuille Ville ↔ contrats */
export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

const ALIASES: Record<string, string> = {
  VICTO: "VICTORIAVILLE",
  VICTORIAVILLE: "VICTORIAVILLE",
  "BEAULAC-GARTHBY": "BEAULAC-GARTHBY",
  WINDOSR: "WINDSOR",
  "ST-ANNE-DU-SAULT": "STE-ANNE-DU-SAULT",
  LOURDE: "LOURDES",
  "ST-CHRISTOPHE-DARTHABASKA": "ST-CHRISTOPHE",
  "ST-CHRISTOPHE-D-ARTHABASKA": "ST-CHRISTOPHE",
  "SAINT-LOUIS-DE-BLANDFORD": "SAINT-LOUIS-BLANDFORD",
  "ST-LOUIS-DE-BLANDFORD": "SAINT-LOUIS-BLANDFORD",
  "ST-LOUIS-BLANDFORD": "SAINT-LOUIS-BLANDFORD",
  "STS-MARTYRS-CANADIENS": "ST-MARTYRS-CANADIENS",
  "ST-MARTYRS-CANADIEN": "ST-MARTYRS-CANADIENS",
};

export function normVille(s: string | null | undefined): string {
  if (!s) return "";
  let t = stripAccents(String(s)).toUpperCase().trim();
  t = t.replace(/['']/g, "");
  t = t.replace(/\s+/g, " ");
  t = t.replace(/^SAINTE?[\s-]+/, "ST-");
  t = t.replace(/^STE[\s-]+/, "STE-");
  t = t.replace(/ /g, "-").replace(/-+/g, "-");
  if (t.startsWith("VICTO") && (t === "VICTO" || t === "VICTORIAVILLE")) {
    t = "VICTORIAVILLE";
  }
  return ALIASES[t] || t;
}
