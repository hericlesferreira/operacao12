import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import type { Database } from "@/types/database";

type Anamnese = Database["public"]["Tables"]["anamneses"]["Row"];
type Calculation = Database["public"]["Tables"]["metabolic_calculations"]["Row"];
type Assessment = Database["public"]["Tables"]["physical_assessments"]["Row"];
type PlanCuration = Database["public"]["Tables"]["plan_curations"]["Row"];

export type TrailContent = {
  headline: string;
  summary: string;
  mapSteps: TrailMapStep[];
  startingPoint: Array<{ label: string; value: string }>;
  eatingStrategy: string[];
  priorities: string[];
  attentionPoints: string[];
  initialAssessment: Array<{ label: string; value: string }>;
};

export type TrailMapStep = {
  week: number;
  title: string;
  badge: string;
  description: string;
  actions: Array<{ label: string; href: string }>;
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
    headline: `Mapa da Operação 12S de ${anamnese.full_name}`,
    summary:
      "Este mapa organiza seu ponto de partida, sua estratégia alimentar inicial e as prioridades práticas para as próximas 12 semanas.",
    mapSteps: buildMapSteps(anamnese, plan?.title ?? null),
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

function buildMapSteps(anamnese: Anamnese, planTitle: string | null): TrailMapStep[] {
  const text = `${anamnese.main_difficulty ?? ""} ${JSON.stringify(
    anamnese.behavioral_answers
  )}`.toLowerCase();
  const activityTitle = anamnese.activity_level === "sedentario" ? "Movimento" : "Treino";
  const activityDescription =
    anamnese.activity_level === "sedentario"
      ? "Com o plano alimentar encaminhado, comece com uma rotina simples de movimento para ajudar o metabolismo sem depender de perfeição."
      : "Alimentação encaminhada. Agora vamos encaixar sua atividade física de forma consistente para acelerar o processo.";
  const sleepNeedsAttention =
    anamnese.sleep_quality === "regular" ||
    anamnese.sleep_quality === "ruim" ||
    (anamnese.sleep_hours?.includes("5") ?? false) ||
    (anamnese.sleep_hours?.includes("6") ?? false);
  const behaviorTitle = text.includes("final") || text.includes("evento")
    ? "Fim de semana"
    : text.includes("doce")
      ? "Doces"
      : text.includes("noite")
        ? "Noite"
        : "Consistência";
  const behaviorDescription = buildBehaviorDescription(text);

  return [
    {
      week: 1,
      title: "Dieta",
      badge: "Dieta",
      description: `Este é o momento de ajustar o que mais te trava na alimentação. ${planTitle ? `Use o ${planTitle} como guia inicial` : "Use o plano alimentar como guia inicial"} por 7 dias.`,
      actions: [{ label: "Abrir plano alimentar", href: "/plano-alimentar" }]
    },
    {
      week: 2,
      title: activityTitle,
      badge: activityTitle,
      description: activityDescription,
      actions: [{ label: "Ver prioridades", href: "/trilha#prioridades" }]
    },
    {
      week: 3,
      title: sleepNeedsAttention ? "Sono" : "Rotina",
      badge: sleepNeedsAttention ? "Sono" : "Rotina",
      description: sleepNeedsAttention
        ? "Um sono ruim atrasa seus resultados. Ajuste horários, fome à noite e rotina para melhorar adesão ao plano."
        : "Com alimentação e movimento encaminhados, vamos proteger sua rotina para manter constância nos dias corridos.",
      actions: [{ label: sleepNeedsAttention ? "Ver foco do sono" : "Ver estratégia", href: "/trilha#prioridades" }]
    },
    {
      week: 4,
      title: behaviorTitle,
      badge: "Foco",
      description: behaviorDescription,
      actions: [{ label: "Ver avaliação física", href: "/avaliacoes" }]
    }
  ];
}

function buildBehaviorDescription(text: string) {
  if (text.includes("final") || text.includes("evento")) {
    return "Agora o foco é atravessar finais de semana e eventos sociais sem transformar uma refeição fora da rota em abandono.";
  }

  if (text.includes("doce")) {
    return "Vamos criar uma estratégia para vontade de doces, mantendo previsibilidade e evitando o ciclo de restrição e exagero.";
  }

  if (text.includes("noite")) {
    return "O foco é reduzir fome ou vontade de comer à noite, ajustando distribuição alimentar e rotina do fim do dia.";
  }

  return "Esta etapa consolida o básico: repetir o que funcionou, reduzir atritos e manter execução possível na vida real.";
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
    points.push("A equipe marcou este mapa para revisão manual antes da entrega final.");
  }

  return points;
}

function formatMeasure(value: number | null, suffix: string) {
  return value ? `${value} ${suffix}` : "-";
}
