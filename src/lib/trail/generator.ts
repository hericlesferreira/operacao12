import { operation12sMealPlans } from "../calculations/metabolic";
import type { Database } from "../../types/database";

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

type TrailSignals = {
  activityDescription: string | null;
  hasAnxiety: boolean;
  hasEatingOutChallenge: boolean;
  hasFoodAllergies: boolean;
  hasGrazingChallenge: boolean;
  hasHealthCondition: boolean;
  hasLowMotivation: boolean;
  hasNightHunger: boolean;
  hasRoutineChallenge: boolean;
  hasSocialChallenge: boolean;
  hasSweetsChallenge: boolean;
  hasWeekendChallenge: boolean;
  isSedentary: boolean;
  sleepNeedsAttention: boolean;
  text: string;
};

type FocusRecommendation = {
  id: string;
  title: string;
  badge: string;
  description: string;
  priority: string;
  actions?: Array<{ label: string; href: string }>;
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
  const signals = buildTrailSignals(anamnese);
  const focusSteps = buildFocusRecommendations(signals);
  const activityTitle = signals.isSedentary ? "Movimento" : "Treino";
  const activityDescription = signals.isSedentary
    ? "Com o plano alimentar encaminhado, comece com uma rotina simples de movimento para ajudar o metabolismo sem depender de perfeição."
    : signals.activityDescription
      ? `Alimentação encaminhada. Agora vamos encaixar ${signals.activityDescription} com consistência para acelerar o processo.`
      : "Alimentação encaminhada. Agora vamos encaixar sua atividade física de forma consistente para acelerar o processo.";

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
      title: signals.sleepNeedsAttention ? "Sono" : "Rotina",
      badge: signals.sleepNeedsAttention ? "Sono" : "Rotina",
      description: signals.sleepNeedsAttention
        ? "Um sono ruim atrasa seus resultados. Ajuste horários, fome à noite e rotina para melhorar adesão ao plano."
        : "Com alimentação e movimento encaminhados, vamos proteger sua rotina para manter constância nos dias corridos.",
      actions: [{ label: signals.sleepNeedsAttention ? "Ver foco do sono" : "Ver estratégia", href: "/trilha#prioridades" }]
    },
    ...focusSteps.slice(0, 4).map((step, index) => ({
      week: index + 4,
      title: step.title,
      badge: step.badge,
      description: step.description,
      actions: step.actions ?? [{ label: "Ver prioridades", href: "/trilha#prioridades" }]
    })),
    {
      week: 8,
      title: "Medidas",
      badge: "Medidas",
      description: "Metade da operação pede checagem. Compare as medidas iniciais com a evolução e ajuste o foco sem depender só da balança.",
      actions: [{ label: "Ver avaliação física", href: "/avaliacoes" }]
    },
    {
      week: 9,
      title: "Ajuste fino",
      badge: "Ajuste",
      description: "Com dados de execução, refine horários, escolhas e porções. A meta é tirar atritos do plano, não aumentar cobrança.",
      actions: [{ label: "Ver estratégia", href: "/trilha#prioridades" }]
    },
    {
      week: 10,
      title: signals.hasSocialChallenge || signals.hasEatingOutChallenge ? "Vida real" : "Ambiente",
      badge: signals.hasSocialChallenge || signals.hasEatingOutChallenge ? "Social" : "Ambiente",
      description: signals.hasSocialChallenge || signals.hasEatingOutChallenge
        ? "Treine escolhas em restaurante, eventos e compromissos sociais para manter direção mesmo fora da rotina."
        : "Organize ambiente, compras e refeições-chave para facilitar as decisões quando a semana apertar.",
      actions: [{ label: "Rever plano", href: "/plano-alimentar" }]
    },
    {
      week: 11,
      title: "Autonomia",
      badge: "Autonomia",
      description: "Nesta fase, você começa a dominar repetições, substituições e retomadas. O plano vira ferramenta, não prisão.",
      actions: [{ label: "Ver mapa", href: "/trilha" }]
    },
    {
      week: 12,
      title: "Consolidação",
      badge: "12S",
      description: "Feche a operação revisando medidas, aprendizados e pontos que precisam continuar no próximo ciclo.",
      actions: [{ label: "Ver avaliação final", href: "/avaliacoes" }]
    }
  ];
}

function buildTrailSignals(anamnese: Anamnese): TrailSignals {
  const weekendDifficulty = getBehavioralAnswer(anamnese.behavioral_answers, "weekendDifficulty");
  const sweetsDifficulty = getBehavioralAnswer(anamnese.behavioral_answers, "sweetsDifficulty");
  const nightHunger = getBehavioralAnswer(anamnese.behavioral_answers, "nightHunger");
  const activityDescription = getBehavioralAnswer(anamnese.behavioral_answers, "activityDescription");
  const foodAllergies = getBehavioralList(anamnese.behavioral_answers, "foodAllergies");
  const text = normalizeText([
    anamnese.main_goal,
    anamnese.main_difficulty,
    anamnese.food_preference,
    anamnese.sleep_hours,
    anamnese.sleep_quality,
    anamnese.weight_loss_history,
    anamnese.health_conditions.join(" "),
    weekendDifficulty,
    getBehavioralAnswer(anamnese.behavioral_answers, "weekendDifficultyReason"),
    sweetsDifficulty,
    nightHunger,
    getBehavioralAnswer(anamnese.behavioral_answers, "dislikedFoods"),
    foodAllergies.join(" ")
  ]);

  return {
    activityDescription,
    hasAnxiety: text.includes("ansiedade"),
    hasEatingOutChallenge: text.includes("comer fora"),
    hasFoodAllergies: foodAllergies.length > 0,
    hasGrazingChallenge: text.includes("beliscar"),
    hasHealthCondition: hasHealthCondition(anamnese.health_conditions),
    hasLowMotivation: anamnese.motivation <= 5,
    hasNightHunger: nightHunger === "sim" || text.includes("noite"),
    hasRoutineChallenge:
      text.includes("rotina") ||
      text.includes("abandono") ||
      text.includes("comeco bem") ||
      text.includes("comeco"),
    hasSocialChallenge:
      text.includes("evento") ||
      text.includes("festa") ||
      text.includes("aniversario"),
    hasSweetsChallenge: sweetsDifficulty === "sim" || text.includes("doce"),
    hasWeekendChallenge:
      weekendDifficulty === "sim" ||
      text.includes("final de semana") ||
      text.includes("finais de semana"),
    isSedentary: anamnese.activity_level === "sedentario",
    sleepNeedsAttention:
      anamnese.sleep_quality === "regular" ||
      anamnese.sleep_quality === "ruim" ||
      (anamnese.sleep_hours?.includes("5") ?? false) ||
      (anamnese.sleep_hours?.includes("6") ?? false),
    text
  };
}

function buildFocusRecommendations(signals: TrailSignals): FocusRecommendation[] {
  const recommendations: FocusRecommendation[] = [];

  if (signals.hasLowMotivation) {
    recommendations.push({
      id: "low-motivation",
      title: "Começo possível",
      badge: "Início",
      description: "Como a motivação está mais baixa, a regra é simplificar: execute o mínimo bem feito antes de tentar uma rotina perfeita.",
      priority: "Começar com uma versão mínima do plano em vez de tentar mudar tudo de uma vez."
    });
  }

  if (signals.hasNightHunger) {
    recommendations.push({
      id: "night-hunger",
      title: "Noite",
      badge: "Noite",
      description: "O foco é reduzir fome ou vontade de comer à noite, ajustando distribuição alimentar e rotina do fim do dia.",
      priority: "Ajustar rotina alimentar do fim do dia para reduzir fome ou beliscos à noite."
    });
  }

  if (signals.hasSweetsChallenge) {
    recommendations.push({
      id: "sweets",
      title: "Doces",
      badge: "Doces",
      description: "Vamos criar uma estratégia para vontade de doces, mantendo previsibilidade e evitando o ciclo de restrição e exagero.",
      priority: "Planejar uma alternativa para vontade de doces, sem transformar isso em abandono."
    });
  }

  if (signals.hasWeekendChallenge || signals.hasSocialChallenge) {
    recommendations.push({
      id: "weekend-social",
      title: signals.hasSocialChallenge ? "Eventos" : "Fim de semana",
      badge: "Social",
      description: "Agora o foco é atravessar finais de semana e eventos sociais sem transformar uma refeição fora da rota em abandono.",
      priority: "Criar uma estratégia específica para finais de semana e eventos sociais."
    });
  }

  if (signals.hasEatingOutChallenge) {
    recommendations.push({
      id: "eating-out",
      title: "Comer fora",
      badge: "Fora",
      description: "Treine escolhas fora de casa: prato possível, porção clara e retomada na próxima refeição sem compensações extremas.",
      priority: "Definir uma regra simples para restaurantes, lanches e dias fora da rotina."
    });
  }

  if (signals.hasGrazingChallenge) {
    recommendations.push({
      id: "grazing",
      title: "Beliscos",
      badge: "Belisco",
      description: "Beliscar costuma ser sinal de ambiente, fome mal distribuída ou emoção. Vamos organizar gatilhos e horários.",
      priority: "Reduzir beliscos criando horários e opções previsíveis entre as refeições."
    });
  }

  if (signals.hasAnxiety) {
    recommendations.push({
      id: "anxiety",
      title: "Ansiedade",
      badge: "Mente",
      description: "Quando a ansiedade aparece, o objetivo é ter uma resposta planejada antes de buscar comida como escape automático.",
      priority: "Criar uma resposta prática para ansiedade antes de decidir comer."
    });
  }

  if (signals.hasRoutineChallenge) {
    recommendations.push({
      id: "routine",
      title: "Rotina",
      badge: "Rotina",
      description: "A rotina precisa ficar executável nos dias comuns. Planeje compras, refeições-chave e o horário mais frágil do dia.",
      priority: "Definir um plano simples para refeições principais dos dias corridos."
    });
  }

  if (signals.hasHealthCondition || signals.hasFoodAllergies) {
    recommendations.push({
      id: "safety",
      title: "Cuidados",
      badge: "Saúde",
      description: "A estratégia precisa respeitar alergias, intolerâncias e condições de saúde relatadas, sem improvisar trocas inseguras.",
      priority: "Respeitar condições de saúde, alergias e intolerâncias nas escolhas do plano."
    });
  }

  recommendations.push(
    {
      id: "consistency",
      title: "Consistência",
      badge: "Foco",
      description: "Esta etapa consolida o básico: repetir o que funcionou, reduzir atritos e manter execução possível na vida real.",
      priority: "Repetir o básico bem feito antes de buscar novas estratégias."
    },
    {
      id: "planning",
      title: "Planejamento",
      badge: "Plano",
      description: "Organize compras, refeições principais e opções de emergência para não depender de força de vontade todos os dias.",
      priority: "Ter opções de emergência para quando a rotina sair do ideal."
    }
  );

  return uniqueById(recommendations);
}

function buildPriorities(anamnese: Anamnese) {
  const signals = buildTrailSignals(anamnese);
  const priorities = [
    "Seguir o plano alimentar aprovado em pelo menos 80% da semana.",
    "Registrar medidas nas datas combinadas para acompanhar evolução real.",
    signals.isSedentary
      ? "Começar com movimento simples e progressivo, sem depender de treinos longos."
      : "Manter a atividade física encaixada na semana como parte da estratégia, não como compensação."
  ];

  if (signals.sleepNeedsAttention) {
    priorities.push("Proteger sono e rotina noturna para melhorar adesão ao plano.");
  }

  priorities.push(...buildFocusRecommendations(signals).map((item) => item.priority));

  return uniqueText(priorities).slice(0, 7);
}

function buildAttentionPoints(
  anamnese: Anamnese,
  calculation: Calculation | null,
  curation: PlanCuration | null
) {
  const points = [
    "A Operação 12S não substitui acompanhamento médico ou nutricional individualizado."
  ];

  if (hasHealthCondition(anamnese.health_conditions)) {
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

function getBehavioralAnswer(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const answer = (value as Record<string, unknown>)[key];

  return typeof answer === "string" && answer.trim() ? answer.trim() : null;
}

function getBehavioralList(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const answer = (value as Record<string, unknown>)[key];

  return Array.isArray(answer)
    ? answer.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function hasHealthCondition(conditions: string[]) {
  return conditions.some((condition) => normalizeText(condition) !== "nenhuma");
}

function normalizeText(value: string | Array<string | null | undefined> | null | undefined) {
  const text = Array.isArray(value) ? value.filter(Boolean).join(" ") : value ?? "";

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function uniqueById(items: FocusRecommendation[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function uniqueText(items: string[]) {
  return Array.from(new Set(items));
}

function formatMeasure(value: number | null, suffix: string) {
  return value ? `${value} ${suffix}` : "-";
}
