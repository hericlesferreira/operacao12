import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function LessonsPage() {
  return (
    <AppShell title="Aulas semanais">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((week) => (
          <Card key={week}>
            <p className="text-sm font-semibold text-cocoa">Semana {week}</p>
            <h2 className="mt-2 text-xl font-bold">
              Aula {week === 1 ? "liberada apos a anamnese" : "bloqueada"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-graphite">
              Conteudo liberado conforme a data de inicio da operacao.
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
