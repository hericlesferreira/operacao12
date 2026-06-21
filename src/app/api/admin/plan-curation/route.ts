import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    const { error } = await supabaseAdmin.from("plan_curations").upsert({
      user_id: payload.userId,
      calculation_id: payload.calculationId ?? null,
      suggested_plan_code: payload.suggestedPlanCode ?? null,
      approved_plan_code: payload.approvedPlanCode ?? null,
      status: payload.status,
      admin_observation: payload.adminObservation ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Curadoria salva com sucesso." });
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
