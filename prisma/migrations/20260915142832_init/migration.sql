-- CreateTable
CREATE TABLE "Secteur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#3B82F6',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ville" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "nomNorm" TEXT NOT NULL,
    "secteurId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ville_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "Secteur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Couleur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomFr" TEXT NOT NULL,
    "nomEn" TEXT,
    "colonne" INTEGER NOT NULL DEFAULT 1,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numContrat" TEXT,
    "date" DATETIME,
    "nom" TEXT,
    "prenom" TEXT,
    "telephone" TEXT,
    "civique" TEXT,
    "rue" TEXT,
    "villeNom" TEXT,
    "gouttiere" TEXT,
    "piedLinG" REAL,
    "descente" TEXT,
    "piedLinD" REAL,
    "equip" TEXT,
    "enlvExist" BOOLEAN NOT NULL DEFAULT false,
    "friseIncl" BOOLEAN NOT NULL DEFAULT false,
    "toitTole" BOOLEAN NOT NULL DEFAULT false,
    "montant" REAL,
    "grille" TEXT,
    "piedLinGr" REAL,
    "statut" TEXT,
    "colonne2" TEXT,
    "secteurId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrat_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "Secteur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompteRendu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "montant" REAL,
    "dateFait" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Reparation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numContrat" TEXT,
    "date" DATETIME,
    "nom" TEXT,
    "prenom" TEXT,
    "civique" TEXT,
    "rue" TEXT,
    "villeNom" TEXT,
    "travaux" TEXT,
    "montant" REAL,
    "contratGouttiere" TEXT,
    "etat" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Installateur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semaine" INTEGER NOT NULL,
    "jourSemaine" INTEGER NOT NULL,
    "nom" TEXT,
    "notes" TEXT,
    "secteurId" TEXT,
    "installateurId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Route_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "Secteur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Route_installateurId_fkey" FOREIGN KEY ("installateurId") REFERENCES "Installateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RouteStop_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "Contrat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Secteur_numero_key" ON "Secteur"("numero");

-- CreateIndex
CREATE INDEX "Ville_secteurId_idx" ON "Ville"("secteurId");

-- CreateIndex
CREATE UNIQUE INDEX "Ville_nomNorm_key" ON "Ville"("nomNorm");

-- CreateIndex
CREATE INDEX "Contrat_villeNom_idx" ON "Contrat"("villeNom");

-- CreateIndex
CREATE INDEX "Contrat_numContrat_idx" ON "Contrat"("numContrat");

-- CreateIndex
CREATE INDEX "Contrat_secteurId_idx" ON "Contrat"("secteurId");

-- CreateIndex
CREATE INDEX "Contrat_date_idx" ON "Contrat"("date");

-- CreateIndex
CREATE INDEX "CompteRendu_dateFait_idx" ON "CompteRendu"("dateFait");

-- CreateIndex
CREATE INDEX "Reparation_etat_idx" ON "Reparation"("etat");

-- CreateIndex
CREATE INDEX "Route_semaine_idx" ON "Route"("semaine");

-- CreateIndex
CREATE UNIQUE INDEX "Route_semaine_jourSemaine_key" ON "Route"("semaine", "jourSemaine");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_contratId_key" ON "RouteStop"("routeId", "contratId");
