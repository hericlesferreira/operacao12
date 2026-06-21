import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MealPlanPage() {
  return (
    <AppShell title="Plano alimentar">
      <Card className="max-w-3xl">
        <h2 className="text-2xl font-bold">Plano indicado</h2>
        <p className="mt-3 leading-7 text-graphite">
          O plano alimentar sera indicado depois da anamnese, dos calculos
          metabolicos e da curadoria conforme o perfil do participante.
        </p>
        <Button className="mt-6" disabled>
          Baixar PDF do plano
        </Button>
      </Card>
    </AppShell>
  );
}
