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

type TrailContent = {
  headline: string;
  summary: string;
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
    ? "Plano e trilha aprovados pelo nutri."
    : "Você já pode seguir este plano e esta trilha, mas eles ainda podem sofrer alterações pois estão pendentes de aprovação do nutri.";

  if (state.loading) {
    return <Card>Carregando sua trilha...</Card>;
  }

  if (!state.content) {
    return (
      <Card className="max-w-3xl">
        <h2 className="text-2xl font-bold">Sua trilha ainda está em preparo</h2>
        <p className="mt-3 leading-7 text-graphite">
          Depois da anamnese, sua Trilha da Operação será liberada aqui.
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
          Trilha da Operação 12S
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
        <Card>
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
    headline: candidate.headline,
    summary: candidate.summary,
    startingPoint: candidate.startingPoint,
    eatingStrategy: candidate.eatingStrategy,
    priorities: candidate.priorities,
    attentionPoints: candidate.attentionPoints,
    initialAssessment: candidate.initialAssessment
  };
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
