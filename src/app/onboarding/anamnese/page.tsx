import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AnamnesePage() {
  return (
    <AppShell title="Anamnese inicial">
      <Card className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Etapa 1 de 10
        </p>
        <h2 className="mt-2 text-2xl font-bold">Dados basicos</h2>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Este e o primeiro bloco visual do formulario. Na proxima fase entram
          React Hook Form, Zod, validacoes e salvamento no Supabase.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <Input placeholder="Nome completo" />
          <Input placeholder="Idade" type="number" />
          <Input placeholder="Peso atual (kg)" type="number" />
          <Input placeholder="Altura (cm)" type="number" />
          <div className="md:col-span-2">
            <Button>Continuar</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
