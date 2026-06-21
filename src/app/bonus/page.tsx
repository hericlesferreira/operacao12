import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function BonusPage() {
  return (
    <AppShell title="Bonus recomendados">
      <Card className="max-w-3xl">
        <h2 className="text-2xl font-bold">Materiais do seu perfil</h2>
        <p className="mt-3 leading-7 text-graphite">
          Bonus como guia do sono, doces, rotina, treino inicial e estrategias
          para finais de semana serao liberados conforme a anamnese.
        </p>
      </Card>
    </AppShell>
  );
}
