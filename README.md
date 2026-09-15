# Champoux Gouttières — Ops MVP

Application interne alignée sur le classeur Excel Champoux (Québec).

Interface **fr-CA**. Source de données : `data/champoux-gouttieres.xlsx`.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (`prisma/dev.db`)
- Import Excel → JSON → seed
- Analyse photo OpenAI Vision (optionnelle)

## Démarrage

```bash
cd /workspace/champoux-gouttieres
npm install
python3 scripts/import-excel.py          # régénère data/seed-data.json
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:./dev.db` |
| `OPENAI_API_KEY` | Optionnel — extraction IA des devis manuscrits |

Sans clé OpenAI, `/api/contrats/analyser` retourne une extraction **démo**.

## Onglets (= feuilles Excel + calendrier)

| Route | Feuille / module |
|-------|------------------|
| `/suivi` | Liste de suivi 2026 |
| `/compte-rendu` | Compte rendu |
| `/couleurs` | Charte des couleurs |
| `/reparations` | Liste de réparation 2026 |
| `/villes` | Ville → secteurs **1–7** |
| `/calendrier` | Tournées (semaines fictives) |

## Calendrier / optimisation

Semaines **fictives** (`Semaine 1`, `2`…) — **lun–ven seulement**, pas de dates calendrier.

Règles par défaut du planificateur :

1. Cible **> 5 000 $** / jour si possible
2. Idéalement **4–5 emplois** / jour
3. **Un secteur** (1–7) par jour (cluster km)
4. Chaque secteur visité **≥ 1× par mois** (~4 semaines)

Mode **Ajustement manuel** : réordonner, déplacer entre jours, ajouter des contrats libres.

## Réimport Excel

```bash
# Remplacer data/champoux-gouttieres.xlsx puis :
npm run import:excel
npx prisma db seed
```

## Scripts

```bash
npm run import:excel
npm run db:seed
npm run db:reset
npm run build
```
