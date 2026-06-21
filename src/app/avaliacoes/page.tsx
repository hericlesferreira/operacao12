import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function AssessmentsPage() {
  return (
    <AppShell title="Avaliacoes fisicas">
      <Card className="max-w-3xl">
        <h2 className="text-2xl font-bold">Proximas avaliacoes</h2>
        <p className="mt-3 leading-7 text-graphite">
          As avaliacoes serao programadas para as semanas 0, 4, 8 e 12, com
          historico de medidas e progresso.
        </p>
      </Card>
    </AppShell>
  );
}
