#!/usr/bin/env python3
"""Parse data/champoux-gouttieres.xlsx → data/seed-data.json"""
from __future__ import annotations
import json, re, unicodedata
from datetime import datetime, date
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "-q"])
    import openpyxl

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "champoux-gouttieres.xlsx"
OUT = ROOT / "data" / "seed-data.json"

SECTEUR_COLORS = {
    1: "#2563EB",
    2: "#DC2626",
    3: "#16A34A",
    4: "#CA8A04",
    5: "#7C3AED",
    6: "#EA580C",
    7: "#0891B2",
}

# aliases for matching suivi villes → feuille Ville
ALIASES = {
    "VICTO": "VICTORIAVILLE",
    "VICTORIAVILLE": "VICTORIAVILLE",
    "BEAULAC-GARTHBY": "BEAULAC-GARTHBY",
    "WINDOSR": "WINDSOR",
    "WINDSOR": "WINDSOR",
    "ST-ANNE-DU-SAULT": "STE-ANNE-DU-SAULT",
    "LOURDE": "LOURDES",
    "DESCHAILLONS-SUR-ST-": "DESCHAILLONS",
    "ST-CHRISTOPHE-DARTHABASKA": "ST-CHRISTOPHE",
    "ST-CHRISTOPHE-D-ARTHABASKA": "ST-CHRISTOPHE",
    "SAINT-LOUIS-DE-BLANDFORD": "SAINT-LOUIS-BLANDFORD",
    "ST-LOUIS-DE-BLANDFORD": "SAINT-LOUIS-BLANDFORD",
    "ST-LOUIS-BLANDFORD": "SAINT-LOUIS-BLANDFORD",
    "STS-MARTYRS-CANADIENS": "ST-MARTYRS-CANADIENS",
    "ST-MARTYRS-CANADIEN": "ST-MARTYRS-CANADIENS",
    "SAINT-MARTYRS-CANADIENS": "ST-MARTYRS-CANADIENS",
}


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def norm_ville(s: str | None) -> str:
    if not s:
        return ""
    t = strip_accents(str(s)).upper().strip()
    t = t.replace("'", "").replace("'", "").replace("'", "")
    t = re.sub(r"\s+", " ", t)
    t = t.replace(" - ", "-").replace(" – ", "-")
    t = re.sub(r"^SAINT[E]?[\s\-]+", "ST-", t)
    t = re.sub(r"^STE[\s\-]+", "STE-", t)
    t = t.replace(" ", "-")
    t = re.sub(r"-+", "-", t)
    t = ALIASES.get(t, t)
    # common variants
    if t.startswith("VICTO"):
        t = "VICTORIAVILLE" if t in ("VICTO", "VICTORIAVILLE") else t
    return t


def cell_str(v) -> str | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    s = str(v).strip()
    return s if s else None


def cell_float(v) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(",", ".").replace("'", "").replace("′", "")
    m = re.search(r"[\d.]+", s)
    if not m:
        return None
    try:
        return float(m.group())
    except ValueError:
        return None


def cell_bool(v) -> bool:
    if v is None:
        return False
    s = str(v).strip().lower()
    return s in ("oui", "yes", "true", "1", "x", "o")


def cell_date(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day).isoformat()
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s[:10], fmt).isoformat()
        except ValueError:
            pass
    return None


def parse_secteurs_villes(wb):
    ws = wb["Ville"]
    # Two columns of lists: col A (1) and col E (5)
    # Headers like '1.', '2.', '3.', '4.', '5.', 6, '7.'
    secteurs: dict[int, list[str]] = {i: [] for i in range(1, 8)}
    current = {1: None, 5: None}  # col -> current secteur number

    def parse_header(val):
        if val is None:
            return None
        if isinstance(val, (int, float)):
            n = int(val)
            return n if 1 <= n <= 7 else None
        s = str(val).strip()
        m = re.match(r"^(\d+)\.?$", s)
        if m:
            n = int(m.group(1))
            return n if 1 <= n <= 7 else None
        return None

    for r in range(1, ws.max_row + 1):
        for col, slot in ((1, 1), (5, 5)):
            v = ws.cell(r, col).value
            if v is None or (isinstance(v, str) and not v.strip()):
                continue
            hdr = parse_header(v)
            if hdr is not None:
                current[slot] = hdr
                continue
            num = current[slot]
            if num is None:
                continue
            nom = str(v).strip()
            if nom:
                secteurs[num].append(nom)

    out_secteurs = []
    out_villes = []
    for num, names in secteurs.items():
        out_secteurs.append(
            {
                "numero": num,
                "nom": f"Secteur {num}",
                "couleur": SECTEUR_COLORS[num],
            }
        )
        seen = set()
        for nom in names:
            nn = norm_ville(nom)
            if not nn or nn in seen:
                continue
            seen.add(nn)
            # Prefer readable display name
            display = nom.strip().title() if nom.isupper() else nom.strip()
            # Keep known short forms
            if nn == "VICTORIAVILLE":
                display = "Victoriaville"
            out_villes.append(
                {"nom": display, "nomNorm": nn, "secteurNumero": num}
            )
    return out_secteurs, out_villes


def parse_couleurs(wb):
    ws = wb["Couleur"]
    couleurs = []
    ordre = 0
    for r in range(2, ws.max_row + 1):
        # Row may have FR on even structure: r2 FR names, r3 EN names under same cols
        # Looking at data: r2 = FR, r3 = EN for same columns, r4 = more FR, etc.
        # Simpler: take every non-empty cell as a color name; pair with cell below if looks English
        pass

    # Pair rows: for each data row, if next row has values in same cols, treat as EN
    r = 2
    while r <= ws.max_row:
        fr_row = [ws.cell(r, c).value for c in range(1, 6)]
        en_row = [ws.cell(r + 1, c).value for c in range(1, 6)] if r + 1 <= ws.max_row else [None] * 5
        # Heuristic: if any en cell looks like English counterpart (has letters and differs)
        has_fr = any(x and str(x).strip() for x in fr_row)
        if not has_fr:
            r += 1
            continue
        # Check if en_row is actually another FR block (e.g. empty then new colors)
        # Use en only if fr_row has content and en_row corresponding cells exist and look like translations
        use_en = False
        if any(x and str(x).strip() for x in en_row):
            # if en row has no secteur-like and seems paired (same columns filled)
            fr_cols = {c for c, x in enumerate(fr_row) if x and str(x).strip()}
            en_cols = {c for c, x in enumerate(en_row) if x and str(x).strip()}
            if fr_cols & en_cols:
                use_en = True

        for c, fr in enumerate(fr_row):
            if not fr or not str(fr).strip():
                continue
            if str(fr).strip().lower().startswith("charte"):
                continue
            en = None
            if use_en and en_row[c] and str(en_row[c]).strip():
                en = str(en_row[c]).strip()
            couleurs.append(
                {
                    "nomFr": str(fr).strip(),
                    "nomEn": en,
                    "colonne": c + 1,
                    "ordre": ordre,
                }
            )
            ordre += 1
        r += 2 if use_en else 1
    return couleurs


def parse_suivi(wb):
    ws = wb["Liste de suivi 2026"]
    rows = []
    for r in range(2, ws.max_row + 1):
        nom = cell_str(ws.cell(r, 3).value)
        prenom = cell_str(ws.cell(r, 4).value)
        ville = cell_str(ws.cell(r, 8).value)
        num = ws.cell(r, 1).value
        if not any([nom, prenom, ville, num]):
            continue
        num_s = None
        if num is not None and not isinstance(num, datetime):
            num_s = str(int(num)) if isinstance(num, float) and num == int(num) else str(num).strip()
            if num_s.endswith(".0"):
                num_s = num_s[:-2]

        tel = ws.cell(r, 5).value
        tel_s = None
        if tel is not None:
            if isinstance(tel, float):
                tel_s = str(int(tel))
            else:
                tel_s = str(tel).strip()

        civ = ws.cell(r, 6).value
        civ_s = None
        if civ is not None:
            civ_s = str(int(civ)) if isinstance(civ, float) and civ == int(civ) else str(civ).strip()

        rows.append(
            {
                "numContrat": num_s,
                "date": cell_date(ws.cell(r, 2).value),
                "nom": nom,
                "prenom": prenom,
                "telephone": tel_s,
                "civique": civ_s,
                "rue": cell_str(ws.cell(r, 7).value),
                "villeNom": ville,
                "gouttiere": cell_str(ws.cell(r, 9).value),
                "piedLinG": cell_float(ws.cell(r, 10).value),
                "descente": cell_str(ws.cell(r, 11).value),
                "piedLinD": cell_float(ws.cell(r, 12).value),
                "equip": cell_str(ws.cell(r, 13).value),
                "enlvExist": cell_bool(ws.cell(r, 14).value),
                "friseIncl": cell_bool(ws.cell(r, 15).value),
                "toitTole": cell_bool(ws.cell(r, 16).value),
                "montant": cell_float(ws.cell(r, 17).value),
                "grille": cell_str(ws.cell(r, 18).value),
                "piedLinGr": cell_float(ws.cell(r, 19).value),
                "statut": cell_str(ws.cell(r, 20).value),
                "colonne2": cell_str(ws.cell(r, 21).value),
                "villeNorm": norm_ville(ville),
            }
        )
    return rows


def parse_compte_rendu(wb):
    ws = wb["Compte rendu"]
    rows = []
    for r in range(2, ws.max_row + 1):
        nom = cell_str(ws.cell(r, 1).value)
        if not nom:
            continue
        rows.append(
            {
                "nom": nom,
                "montant": cell_float(ws.cell(r, 2).value),
                "dateFait": cell_date(ws.cell(r, 3).value),
            }
        )
    return rows


def parse_reparations(wb):
    # sheet name has (ced)
    name = [n for n in wb.sheetnames if n.lower().startswith("liste de réparation")][0]
    ws = wb[name]
    rows = []
    for r in range(2, ws.max_row + 1):
        nom = cell_str(ws.cell(r, 3).value)
        prenom = cell_str(ws.cell(r, 4).value)
        if not nom and not prenom and not ws.cell(r, 1).value:
            continue
        num = ws.cell(r, 1).value
        num_s = None
        if num is not None and not isinstance(num, datetime):
            num_s = str(int(num)) if isinstance(num, float) and num == int(num) else str(num).strip()

        civ = ws.cell(r, 5).value
        civ_s = None
        if civ is not None:
            civ_s = str(int(civ)) if isinstance(civ, float) and civ == int(civ) else str(civ).strip()

        etat = cell_str(ws.cell(r, 13).value)
        if etat:
            etat = etat.strip().lower()
            if etat.startswith("fait"):
                etat = "fait"
            elif "faire" in etat:
                etat = "à faire"

        rows.append(
            {
                "numContrat": num_s,
                "date": cell_date(ws.cell(r, 2).value),
                "nom": nom,
                "prenom": prenom,
                "civique": civ_s,
                "rue": cell_str(ws.cell(r, 6).value),
                "villeNom": cell_str(ws.cell(r, 7).value),
                "travaux": cell_str(ws.cell(r, 8).value),
                "montant": cell_float(ws.cell(r, 10).value),
                "contratGouttiere": cell_str(ws.cell(r, 11).value),
                "etat": etat,
            }
        )
    return rows


def main():
    if not XLSX.exists():
        raise SystemExit(f"Missing {XLSX}")
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    secteurs, villes = parse_secteurs_villes(wb)
    data = {
        "secteurs": secteurs,
        "villes": villes,
        "couleurs": parse_couleurs(wb),
        "contrats": parse_suivi(wb),
        "compteRendus": parse_compte_rendu(wb),
        "reparations": parse_reparations(wb),
        "installateurs": [
            {"nom": "Équipe A", "telephone": None},
            {"nom": "Équipe B", "telephone": None},
            {"nom": "Équipe C", "telephone": None},
        ],
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"Wrote {OUT.name}: "
        f"{len(data['secteurs'])} secteurs, {len(data['villes'])} villes, "
        f"{len(data['couleurs'])} couleurs, {len(data['contrats'])} contrats, "
        f"{len(data['compteRendus'])} comptes rendus, {len(data['reparations'])} réparations"
    )


if __name__ == "__main__":
    main()
