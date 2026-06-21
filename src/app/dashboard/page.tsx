import { CalendarDays, FileDown, Flame, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cards = [
  { label: "Semana atual", value: "1", icon: CalendarDays },
  { label: "Meta calorica", value: "Aguardando anamnese", icon: Flame },
  { label: "Prioridades", value: "Geradas na trilha", icon: Target }
];

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard do participante">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
            Ponto de partida
          </p>
          <h2 className="mt-2 text-3xl font-bold">Bem-vindo a sua operacao.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-graphite">
            A plataforma vai organizar sua anamnese, calculos, plano indicado,
            trilha da operacao e avaliacoes. O proximo passo e concluir a
            anamnese para gerar uma direcao mais clara.
          </p>
          <Button className="mt-6" variant="secondary">
            Responder anamnese
          </Button>
        </Card>

        <Card>
          <FileDown className="h-8 w-8 text-cocoa" />
          <h2 className="mt-4 text-xl font-bold">Trilha da Operacao</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            A trilha em PDF sera liberada depois da anamnese e dos calculos.
          </p>
          <Button className="mt-5 w-full" disabled>
            Baixar trilha
          </Button>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {cards.map((item) => (
          <Card key={item.label}>
            <item.icon className="h-6 w-6 text-cocoa" />
            <p className="mt-4 text-sm text-graphite">{item.label}</p>
            <strong className="mt-1 block text-2xl">{item.value}</strong>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
