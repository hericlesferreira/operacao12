import { AppShell } from "@/components/layout/app-shell";
import { AnamneseForm } from "@/components/forms/anamnese-form";

export default function AnamnesePage() {
  return (
    <AppShell title="Anamnese inicial">
      <AnamneseForm />
    </AppShell>
  );
}
