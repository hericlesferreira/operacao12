import { AppShell } from "@/components/layout/app-shell";
import { TrailView } from "@/components/trail/trail-view";

export default function TrailPage() {
  return (
    <AppShell title="Mapa da Operação">
      <TrailView />
    </AppShell>
  );
}
