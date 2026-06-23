"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPostLoginRedirectPath } from "@/lib/auth/redirect";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

type TrailItem = {
  label: string;
  value: string;
};

type TrailMapAction = {
  label: string;
  href: string;
};

type TrailMapStep = {
  week: number;
  title: string;
  badge: string;
  description: string;
  actions: TrailMapAction[];
};

type TrailContent = {
  headline: string;
  summary: string;
  mapSteps: TrailMapStep[];
  startingPoint: TrailItem[];
  eatingStrategy: string[];
  priorities: string[];
  attentionPoints: string[];
  initialAssessment: TrailItem[];
};

type TrailViewState = {
  loading: boolean;
  content: TrailContent | null;
  generatedAt: string | null;
  curationStatus: string | null;
  approvedPlanCode: string | null;
};

export function TrailView() {
  const [state, setState] = useState<TrailViewState>({
    loading: true,
    content: null,
    generatedAt: null,
    curationStatus: null,
    approvedPlanCode: null
  });

  useEffect(() => {
    async function loadTrail() {
      if (!supabase) {
        setState({
          loading: false,
          content: null,
          generatedAt: null,
          curationStatus: null,
          approvedPlanCode: null
        });
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/auth/login");
        return;
      }

      const redirectPath = await getPostLoginRedirectPath(user.id);

      if (redirectPath === "/admin") {
        window.location.replace("/admin");
        return;
      }

      const [{ data: trail }, { data: curation }] = await Promise.all([
        supabase
          .from("operation_trails")
          .select("priorities, generated_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("plan_curations")
          .select("status, approved_plan_code")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      setState({
        loading: false,
        content: parseTrailContent(trail?.priorities ?? null),
        generatedAt: trail?.generated_at ?? trail?.created_at ?? null,
        curationStatus: curation?.status ?? null,
        approvedPlanCode: curation?.approved_plan_code ?? null
      });
    }

    void loadTrail();
  }, []);

  const isApproved = state.curationStatus === "aprovado" && Boolean(state.approvedPlanCode);
  const approvalMessage = isApproved
    ? "Plano e Mapa da Operação aprovados pelo nutri."
    : "Você já pode seguir este plano e este mapa, mas eles ainda podem sofrer alterações pois estão pendentes de aprovação do nutri.";

  if (state.loading) {
    return <Card>Carregando seu mapa...</Card>;
  }

  if (!state.content) {
    return (
      <Card className="max-w-3xl">
        <h2 className="text-2xl font-bold">Seu Mapa da Operação ainda está em preparo</h2>
        <p className="mt-3 leading-7 text-graphite">
          Depois do Questionário Operação 12S, seu Mapa da Operação será liberado aqui.
        </p>
        <Link href="/dashboard">
          <Button className="mt-6" variant="secondary">
            Voltar ao dashboard
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <Card className="bg-coal text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime">
          Mapa da Operação 12S
        </p>
        <h2 className="mt-3 max-w-4xl text-2xl font-bold sm:text-3xl">
          {state.content.headline}
        </h2>
        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white">
          {approvalMessage}
        </div>
        <p className="mt-3 max-w-3xl leading-7 text-white/78">{state.content.summary}</p>
        {state.generatedAt ? (
          <p className="mt-5 text-sm text-white/60">
            Gerada em {formatDateTime(state.generatedAt)}
          </p>
        ) : null}
      </Card>

      <OperationMap content={state.content} generatedAt={state.generatedAt} />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-cocoa" />
            <h3 className="text-xl font-bold">Ponto de partida</h3>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {state.content.startingPoint.map((item) => (
              <Info key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-cocoa" />
            <h3 className="text-xl font-bold">Estratégia alimentar</h3>
          </div>
          <NumberedList items={state.content.eatingStrategy} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="scroll-mt-24" id="prioridades">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-cocoa" />
            <h3 className="text-xl font-bold">Prioridades práticas</h3>
          </div>
          <NumberedList items={state.content.priorities} />
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-cocoa" />
            <h3 className="text-xl font-bold">Avaliação física inicial</h3>
          </div>
          {state.content.initialAssessment.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {state.content.initialAssessment.map((item) => (
                <Info key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-graphite">
              As medidas iniciais ainda não foram registradas.
            </p>
          )}
        </Card>
      </div>

      {state.content.attentionPoints.length ? (
        <Card className="border-cocoa/40 bg-linen">
          <h3 className="text-xl font-bold">Pontos de atenção</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-graphite">
            {state.content.attentionPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: TrailItem) {
  return (
    <div>
      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">
        {label}
      </span>
      <span className="mt-1 block text-coal">{value}</span>
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="mt-4 space-y-3 text-sm leading-6 text-graphite">
      {items.map((item, index) => (
        <li className="flex gap-3" key={item}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold text-coal">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function OperationMap({
  content,
  generatedAt
}: {
  content: TrailContent;
  generatedAt: string | null;
}) {
  const steps = content.mapSteps.length ? content.mapSteps : buildFallbackMapSteps(content);
  const activeIndex = getActiveStepIndex(steps, generatedAt);

  return (
    <Card className="overflow-hidden bg-white">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
        Mapa da Operação
      </p>
      <h3 className="mt-2 max-w-lg text-3xl font-black leading-tight sm:text-4xl">
        Este é o mapa da sua operação 12S
      </h3>

      <div className="mt-8 grid gap-0">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          const isLast = index === steps.length - 1;

          return (
            <div
              className="relative grid grid-cols-[76px_1fr] gap-5 pb-10 last:pb-0 sm:grid-cols-[96px_1fr] sm:gap-7"
              key={`${step.week}-${step.title}`}
            >
              {!isLast ? (
                <div className="absolute left-[37px] top-20 h-[calc(100%-5rem)] border-l-2 border-dashed border-coal/60 sm:left-[47px]" />
              ) : null}

              <div
                className={[
                  "relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-full text-center text-sm font-black shadow-sm sm:h-24 sm:w-24 sm:text-lg",
                  isActive
                    ? "bg-coal text-lime ring-4 ring-lime/70"
                    : isCompleted
                      ? "bg-lime text-coal"
                      : "bg-lime/70 text-coal"
                ].join(" ")}
              >
                {step.badge}
              </div>

              <div className="min-w-0 pt-1 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-2xl font-black leading-tight text-coal sm:text-3xl">
                    Semana {step.week} - {step.title}
                  </h4>
                  {isActive ? (
                    <span className="rounded-full bg-lime px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-coal">
                      Você está aqui
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs font-semibold text-graphite/70">
                  {formatMapStepDate(generatedAt, step.week)}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-5 text-coal sm:text-base sm:leading-6">
                  {step.description}
                </p>

                {step.actions.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.actions.map((action) => (
                      <Link
                        className="rounded-lg bg-lime px-3 py-2 text-xs font-black text-coal transition hover:bg-lime/80"
                        href={action.href}
                        key={`${step.week}-${action.label}`}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function buildFallbackMapSteps(content: TrailContent): TrailMapStep[] {
  return [
    {
      week: 1,
      title: "Dieta",
      badge: "Dieta",
      description:
        content.startingPoint.find((item) => item.label === "Plano alimentar")?.value ??
        "Comece pelo plano alimentar indicado para organizar o ponto de partida.",
      actions: [{ label: "Abrir plano alimentar", href: "/plano-alimentar" }]
    },
    {
      week: 2,
      title: "Rotina",
      badge: "Rotina",
      description: content.eatingStrategy[0] ?? "Transforme o plano em uma rotina simples de executar.",
      actions: [{ label: "Ver estratégia", href: "/trilha#prioridades" }]
    },
    {
      week: 3,
      title: "Foco",
      badge: "Foco",
      description: content.priorities[0] ?? "Priorize as ações mais importantes para manter consistência.",
      actions: [{ label: "Ver prioridades", href: "/trilha#prioridades" }]
    },
    {
      week: 4,
      title: "Evolução",
      badge: "Medidas",
      description:
        content.initialAssessment.length > 0
          ? "Use as medidas iniciais como referência para comparar progresso."
          : "Registre medidas para acompanhar progresso real.",
      actions: [{ label: "Ver avaliação física", href: "/avaliacoes" }]
    }
  ];
}

function getActiveStepIndex(steps: TrailMapStep[], generatedAt: string | null) {
  if (!steps.length || !generatedAt) {
    return 0;
  }

  const start = new Date(generatedAt);

  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;
  const activeIndex = steps.findIndex((step) => step.week >= currentWeek);

  return activeIndex === -1 ? steps.length - 1 : activeIndex;
}

function formatMapStepDate(generatedAt: string | null, week: number) {
  const start = generatedAt ? new Date(generatedAt) : new Date();

  if (Number.isNaN(start.getTime())) {
    return "-";
  }

  start.setDate(start.getDate() + (week - 1) * 7);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(start);
}

function parseTrailContent(value: Json | null): TrailContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, Json | undefined>;

  if (
    typeof candidate.headline !== "string" ||
    typeof candidate.summary !== "string" ||
    !isItemList(candidate.startingPoint) ||
    !isStringList(candidate.eatingStrategy) ||
    !isStringList(candidate.priorities) ||
    !isStringList(candidate.attentionPoints) ||
    !isItemList(candidate.initialAssessment)
  ) {
    return null;
  }

  return {
    headline: renameTrailText(candidate.headline),
    summary: renameTrailText(candidate.summary),
    mapSteps: isMapStepList(candidate.mapSteps)
      ? candidate.mapSteps.map(renameTrailMapStep)
      : [],
    startingPoint: candidate.startingPoint.map(renameTrailItem),
    eatingStrategy: candidate.eatingStrategy.map(renameTrailText),
    priorities: candidate.priorities.map(renameTrailText),
    attentionPoints: candidate.attentionPoints.map(renameTrailText),
    initialAssessment: candidate.initialAssessment
  };
}

function renameTrailMapStep(step: TrailMapStep) {
  return {
    ...step,
    title: renameTrailText(step.title),
    badge: renameTrailText(step.badge),
    description: renameTrailText(step.description),
    actions: step.actions.map((action) => ({
      ...action,
      label: renameTrailText(action.label)
    }))
  };
}

function renameTrailItem(item: TrailItem) {
  return {
    label: renameTrailText(item.label),
    value: renameTrailText(item.value)
  };
}

function renameTrailText(value: string) {
  return value
    .replaceAll("sua Trilha da Operação", "seu Mapa da Operação")
    .replaceAll("sua trilha da Operação", "seu Mapa da Operação")
    .replaceAll("Trilha da Operação", "Mapa da Operação")
    .replaceAll("trilha da Operação", "Mapa da Operação")
    .replaceAll("Esta trilha", "Este mapa")
    .replaceAll("esta trilha", "este mapa")
    .replaceAll("Sua trilha", "Seu mapa")
    .replaceAll("sua trilha", "seu mapa")
    .replaceAll("A trilha", "O mapa")
    .replaceAll("a trilha", "o mapa")
    .replaceAll("Trilha", "Mapa")
    .replaceAll("trilha", "mapa");
}

function isStringList(value: Json | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isItemList(value: Json | undefined): value is TrailItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.label === "string" &&
        typeof item.value === "string"
    )
  );
}

function isMapStepList(value: Json | undefined): value is TrailMapStep[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.week === "number" &&
        typeof item.title === "string" &&
        typeof item.badge === "string" &&
        typeof item.description === "string" &&
        isMapActionList(item.actions)
    )
  );
}

function isMapActionList(value: unknown): value is TrailMapAction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.label === "string" &&
        typeof item.href === "string"
    )
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
