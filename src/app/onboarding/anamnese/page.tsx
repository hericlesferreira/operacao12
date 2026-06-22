import { AppShell } from "@/components/layout/app-shell";
import { AnamneseForm } from "@/components/forms/anamnese-form";

export default function AnamnesePage() {
  return (
    <AppShell title="Questionário Operação 12S">
      <AnamneseForm />
    </AppShell>
  );
}
