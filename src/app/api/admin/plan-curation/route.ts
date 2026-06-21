import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateTrailContent } from "@/lib/trail/generator";
import type { Json } from "@/types/database";

type PlanCurationPayload = {
  userId?: string;
  calculationId?: string | null;
  suggestedPlanCode?: string | null;
  approvedPlanCode?: string | null;
  status?: "pendente" | "aprovado" | "revisar";
  adminObservation?: string | null;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const {
      data: { user },
      error: userError
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso restrito a administradores." },
        { status: 403 }
      );
    }

    const payload = (await request.json()) as PlanCurationPayload;

    if (!payload.userId || !payload.status) {
      return NextResponse.json(
        { error: "Informe participante e status da curadoria." },
        { status: 400 }
      );
    }

    const { data: curation, error } = await supabaseAdmin
      .from("plan_curations")
      .upsert(
        {
          user_id: payload.userId,
          calculation_id: payload.calculationId ?? null,
          suggested_plan_code: payload.suggestedPlanCode ?? null,
          approved_plan_code: payload.approvedPlanCode ?? null,
          status: payload.status,
          admin_observation: payload.adminObservation ?? null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error || !curation) {
      return NextResponse.json(
        { error: error?.message ?? "Não foi possível salvar a curadoria." },
        { status: 400 }
      );
    }

    const [{ data: anamneses }, { data: calculations }, { data: assessment }] =
      await Promise.all([
        supabaseAdmin
          .from("anamneses")
          .select("*")
          .eq("user_id", payload.userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("metabolic_calculations")
          .select("*")
          .eq("user_id", payload.userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("physical_assessments")
          .select("*")
          .eq("user_id", payload.userId)
          .eq("week", 0)
          .maybeSingle()
      ]);

    const anamnese = anamneses?.[0] ?? null;
    const calculation = calculations?.[0] ?? null;

    if (anamnese) {
      const content = generateTrailContent({
        anamnese,
        assessment: assessment ?? null,
        calculation,
        curation
      });

      const { error: trailError } = await supabaseAdmin.from("operation_trails").insert({
        user_id: payload.userId,
        anamnese_id: anamnese.id,
        calculation_id: calculation?.id ?? null,
        priorities: content as unknown as Json,
        recommended_materials: [],
        generated_at: new Date().toISOString()
      });

      if (trailError) {
        return NextResponse.json(
          { error: `Curadoria salva, mas a trilha não foi atualizada: ${trailError.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ message: "Curadoria salva e trilha atualizada." });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar curadoria."
      },
      { status: 500 }
    );
  }
}
