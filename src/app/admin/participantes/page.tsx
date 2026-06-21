import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminParticipantsPage() {
  return (
    <AdminShell title="Participantes">
      <Card className="bg-white text-coal">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Listagem de participantes</h2>
            <p className="mt-1 text-sm text-graphite">
              Filtros e dados reais entram depois da conexao com Supabase.
            </p>
          </div>
          <Input className="md:max-w-xs" placeholder="Buscar por nome ou e-mail" />
        </div>
        <div className="mt-6 rounded-lg border border-coal/10 p-8 text-center text-sm text-graphite">
          Nenhum participante cadastrado ainda.
        </div>
      </Card>
    </AdminShell>
  );
}
