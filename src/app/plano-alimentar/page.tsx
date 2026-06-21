import { AppShell } from "@/components/layout/app-shell";
import { MealPlanContent } from "@/components/meal-plan/meal-plan-content";

export default function MealPlanPage() {
  return (
    <AppShell title="Plano alimentar">
      <MealPlanContent />
    </AppShell>
  );
}
