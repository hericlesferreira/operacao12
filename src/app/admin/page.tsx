import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
import { NutritionReviewPanel } from "@/components/admin/nutrition-review-panel";

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

      <NutritionReviewPanel />
    </AdminShell>
  );
}
