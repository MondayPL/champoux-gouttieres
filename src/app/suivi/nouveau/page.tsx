import { PageHeader } from "@/components/PageHeader";
import { ContratForm } from "@/components/ContratForm";

export default function NouveauContratPage() {
  return (
    <div>
      <PageHeader title="Nouveau contrat" subtitle="Saisie manuelle ou analyse photo" />
      <ContratForm />
    </div>
  );
}
