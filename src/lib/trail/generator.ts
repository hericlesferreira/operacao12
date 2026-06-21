import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import type { Database } from "@/types/database";

type Anamnese = Database["public"]["Tables"]["anamneses"]["Row"];
type Calculation = Database["public"]["Tables"]["metabolic_calculations"]["Row"];
type Assessment = Database["public"]["Tables"]["physical_assessments"]["Row"];
type PlanCuration = Database["public"]["Tables"]["plan_curations"]["Row"];

export type TrailContent = {
  headline: string;
  summary: string;
  startingPoint: Array<{ label: string; value: string }>;
  eatingStrategy: string[];
  priorities: string[];
  attentionPoints: string[];
  initialAssessment: Array<{ label: string; value: string }>;
};

export function generateTrailContent({
  anamnese,
  assessment,
  calculation,
  curation
}: {
  anamnese: Anamnese;
  assessment: Assessment | null;
  calculation: Calculation | null;
  curation: PlanCuration | null;
}): TrailContent {
  const selectedPlanCode =
    curation?.approved_plan_code ?? calculation?.indicated_plan_code ?? null;
  const plan =
    selectedPlanCode && selectedPlanCode in operation12sMealPlans
      ? operation12sMealPlans[selectedPlanCode as keyof typeof operation12sMealPlans]
      : null;

  return {
    headline: `Trilha da Operação 12S de ${anamnese.full_name}`,
    summary:
      "Esta trilha organiza seu ponto de partida, sua estratégia alimentar inicial e as prioridades práticas para as próximas 12 semanas.",
    startingPoint: [
      { label: "Objetivos", value: anamnese.main_goal },
      { label: "O que mais atrapalha", value: anamnese.main_difficulty ?? "-" },
      { label: "Idade", value: `${anamnese.age} anos` },
      { label: "Altura", value: `${anamnese.height_cm} cm` },
      {
        label: "Meta calórica calculada",
        value: calculation?.cut_target_calories
          ? `${calculation.cut_target_calories} kcal`
          : "Em análise"
      },
      {
        label: "Plano alimentar",
        value: plan ? `${plan.title} (${plan.calories} kcal)` : "Em curadoria"
      }
    ],
    eatingStrategy: [
      "Use o plano aprovado como referência principal, sem buscar perfeição absoluta.",
      "Priorize consistência semanal: a meta é conseguir executar bem a maior parte dos dias.",
      "Organize compras e refeições principais antes dos dias mais corridos.",
      "Se houver exagero, retome no próximo horário alimentar sem compensações extremas."
    ],
    priorities: buildPriorities(anamnese),
    attentionPoints: buildAttentionPoints(anamnese, calculation, curation),
    initialAssessment: assessment
      ? [
          { label: "Peso", value: formatMeasure(assessment.weight_kg, "kg") },
          { label: "Pescoço", value: formatMeasure(assessment.neck_cm, "cm") },
          { label: "Braço", value: formatMeasure(assessment.arm_cm, "cm") },
          { label: "Cintura", value: formatMeasure(assessment.waist_cm, "cm") },
          { label: "Abdômen", value: formatMeasure(assessment.abdomen_cm, "cm") },
          { label: "Coxa", value: formatMeasure(assessment.thigh_cm, "cm") },
          { label: "Panturrilha", value: formatMeasure(assessment.calf_cm, "cm") }
        ]
      : []
  };
}

function buildPriorities(anamnese: Anamnese) {
  const text = `${anamnese.main_difficulty ?? ""} ${JSON.stringify(
    anamnese.behavioral_answers
  )}`.toLowerCase();
  const priorities = [
    "Seguir o plano alimentar aprovado em pelo menos 80% da semana.",
    "Registrar medidas nas datas combinadas para acompanhar evolução real.",
    "Ter um plano simples para refeições principais dos dias corridos."
  ];

  if (text.includes("final") || text.includes("evento")) {
    priorities.push("Criar uma estratégia específica para finais de semana e eventos sociais.");
  }

  if (text.includes("doce")) {
    priorities.push("Planejar uma alternativa para vontade de doces, sem transformar isso em abandono.");
  }

  if (text.includes("noite")) {
    priorities.push("Ajustar rotina alimentar do fim do dia para reduzir fome ou beliscos à noite.");
  }

  return priorities.slice(0, 5);
}

function buildAttentionPoints(
  anamnese: Anamnese,
  calculation: Calculation | null,
  curation: PlanCuration | null
) {
  const points = [
    "A Operação 12S não substitui acompanhamento médico ou nutricional individualizado."
  ];

  if (anamnese.health_conditions.length && !anamnese.health_conditions.includes("Nenhuma")) {
    points.push("Há condições de saúde relatadas. Mantenha acompanhamento profissional regular.");
  }

  if (calculation?.review_reasons.length) {
    points.push(...calculation.review_reasons);
  }

  if (curation?.status === "revisar") {
    points.push("A equipe marcou esta trilha para revisão manual antes da entrega final.");
  }

  return points;
}

function formatMeasure(value: number | null, suffix: string) {
  return value ? `${value} ${suffix}` : "-";
}
