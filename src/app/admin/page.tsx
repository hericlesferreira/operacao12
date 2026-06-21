import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";

const metrics = [
  ["Participantes", "0"],
  ["Anamneses pendentes", "0"],
  ["Revisoes recomendadas", "0"],
  ["Pendentes Dietitian", "0"]
];

export default function AdminPage() {
  return (
    <AdminShell title="Painel administrativo">
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card className="bg-white/8 text-white shadow-none" key={label}>
            <p className="text-sm text-white/65">{label}</p>
            <strong className="mt-2 block text-4xl">{value}</strong>
          </Card>
        ))}
      </div>

      <Card className="mt-5 bg-white text-coal">
        <h2 className="text-xl font-bold">Base pronta para dados reais</h2>
        <p className="mt-2 max-w-3xl leading-7 text-graphite">
          Este painel ja separa a area administrativa da experiencia do
          participante. As proximas tarefas conectam autentificacao, roles,
          tabelas do Supabase, curadoria de planos e geracao da trilha.
        </p>
      </Card>
    </AdminShell>
  );
}
