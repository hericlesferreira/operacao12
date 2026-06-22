import { AppShell } from "@/components/layout/app-shell";
import { AssessmentsContent } from "@/components/assessments/assessments-content";

export default function AssessmentsPage() {
  return (
    <AppShell title="Avaliações físicas">
      <AssessmentsContent />
    </AppShell>
  );
}
