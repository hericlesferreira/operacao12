import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
import { NutritionReviewPanel } from "@/components/admin/nutrition-review-panel";

const metrics = [
  ["Participantes", "0"],
  ["Questionários pendentes", "0"],
  ["Revisões recomendadas", "0"],
  ["Pendentes do nutri", "0"]
];

export default function AdminPage() {
  return (
    <AdminShell title="Painel administrativo">
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card className="bg-white text-coal shadow-none" key={label}>
            <p className="text-sm text-graphite">{label}</p>
            <strong className="mt-2 block text-4xl">{value}</strong>
          </Card>
        ))}
      </div>

      <NutritionReviewPanel />
    </AdminShell>
  );
}
