"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateParticipantForm } from "@/components/admin/create-participant-form";
import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";

type ParticipantRow = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  createdAt: string;
  hasAnamnese: boolean;
  planCode: string | null;
  reviewStatus: string | null;
};

export function ParticipantsList() {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadParticipants();
  }, []);

  async function loadParticipants() {
      if (!supabase) {
        setError("Supabase não está configurado.");
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, whatsapp, created_at")
        .eq("role", "participant")
        .order("created_at", { ascending: false });

      if (profilesError) {
        setError(profilesError.message);
        setLoading(false);
        return;
      }

      const ids = profiles.map((profile) => profile.id);

      const [{ data: anamneses }, { data: calculations }] = await Promise.all([
        ids.length
          ? supabase
              .from("anamneses")
              .select("user_id, created_at")
              .in("user_id", ids)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase
              .from("metabolic_calculations")
              .select("user_id, indicated_plan_code, review_status, created_at")
              .in("user_id", ids)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] })
      ]);

      const anamneseByUser = new Set((anamneses ?? []).map((item) => item.user_id));
      const calculationByUser = new Map<
        string,
        { indicated_plan_code: string | null; review_status: string | null }
      >();

      for (const calculation of calculations ?? []) {
        if (!calculationByUser.has(calculation.user_id)) {
          calculationByUser.set(calculation.user_id, calculation);
        }
      }

      setParticipants(
        profiles.map((profile) => ({
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          whatsapp: profile.whatsapp,
          createdAt: profile.created_at,
          hasAnamnese: anamneseByUser.has(profile.id),
          planCode: calculationByUser.get(profile.id)?.indicated_plan_code ?? null,
          reviewStatus: calculationByUser.get(profile.id)?.review_status ?? null
        }))
      );
      setLoading(false);
    }

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return participants;
    }

    return participants.filter((participant) =>
      [participant.fullName, participant.email, participant.whatsapp ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [participants, query]);

  return (
    <div className="grid gap-5">
      <Card className="bg-white text-coal">
        <h2 className="text-xl font-bold">Cadastrar participante</h2>
        <p className="mt-1 text-sm text-graphite">
          Crie o acesso e envie e-mail/senha inicial pelo WhatsApp.
        </p>
        <div className="mt-5">
          <CreateParticipantForm onCreated={loadParticipants} />
        </div>
      </Card>

      <Card className="bg-white text-coal">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Listagem de participantes</h2>
            <p className="mt-1 text-sm text-graphite">
              Veja anamnese, cálculo, plano indicado e avaliação física inicial.
            </p>
          </div>
          <div className="relative md:min-w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-graphite/60" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, e-mail ou WhatsApp"
              value={query}
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-lg border border-coal/10 p-8 text-center text-sm text-graphite">
            Carregando participantes...
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && !error && filteredParticipants.length === 0 ? (
          <div className="mt-6 rounded-lg border border-coal/10 p-8 text-center text-sm text-graphite">
            Nenhum participante encontrado.
          </div>
        ) : null}

        {!loading && !error && filteredParticipants.length > 0 ? (
          <div className="mt-6 grid gap-3 md:block md:overflow-hidden md:rounded-lg md:border md:border-coal/10">
            <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.8fr_48px] gap-3 bg-linen px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-graphite md:grid">
              <span>Participante</span>
              <span>WhatsApp</span>
              <span>Anamnese</span>
              <span>Plano</span>
              <span />
            </div>
          {filteredParticipants.map((participant) => {
            const plan =
              participant.planCode &&
              participant.planCode in operation12sMealPlans
                ? operation12sMealPlans[
                    participant.planCode as keyof typeof operation12sMealPlans
                  ]
                : null;

            return (
              <Link
                className="grid gap-3 rounded-lg border border-coal/10 bg-linen/40 px-4 py-4 text-sm transition hover:bg-linen/60 md:rounded-none md:border-0 md:border-t md:bg-transparent md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_48px] md:items-center"
                href={`/admin/participantes/${participant.id}`}
                key={participant.id}
              >
                <div>
                  <strong className="block text-coal">{participant.fullName}</strong>
                  <span className="text-graphite">{participant.email}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60 md:hidden">
                    WhatsApp
                  </span>
                  <span className="text-graphite">{participant.whatsapp ?? "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60 md:hidden">
                    Anamnese
                  </span>
                  <span
                    className={
                      participant.hasAnamnese ? "font-semibold text-coal" : "text-graphite"
                    }
                  >
                    {participant.hasAnamnese ? "Respondida" : "Pendente"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60 md:hidden">
                    Plano
                  </span>
                  <span className="text-graphite">{plan?.title ?? "-"}</span>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-graphite md:block" />
              </Link>
            );
          })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
