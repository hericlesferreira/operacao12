import { NextResponse } from "next/server";
import { generateTrailContent } from "@/lib/trail/generator";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type GenerateTrailPayload = {
  userId?: string;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const {
      data: { user }
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
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

    const payload = (await request.json()) as GenerateTrailPayload;

    if (!payload.userId) {
      return NextResponse.json({ error: "Informe o participante." }, { status: 400 });
    }

    const [{ data: anamneses }, { data: calculations }, { data: assessment }, { data: curation }] =
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
          .maybeSingle(),
        supabaseAdmin
          .from("plan_curations")
          .select("*")
          .eq("user_id", payload.userId)
          .maybeSingle()
      ]);

    const anamnese = anamneses?.[0] ?? null;

    if (!anamnese) {
      return NextResponse.json(
        { error: "Participante ainda não respondeu ao questionário." },
        { status: 400 }
      );
    }

    const calculation = calculations?.[0] ?? null;
    const content = generateTrailContent({
      anamnese,
      assessment: assessment ?? null,
      calculation,
      curation: curation ?? null
    });

    const { data: trail, error } = await supabaseAdmin
      .from("operation_trails")
      .insert({
        user_id: payload.userId,
        anamnese_id: anamnese.id,
        calculation_id: calculation?.id ?? null,
        priorities: content as unknown as Json,
        recommended_materials: [],
        generated_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error || !trail) {
      return NextResponse.json(
        { error: error?.message ?? "Não foi possível gerar o mapa." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      trailId: trail.id,
      message: "Mapa gerado com sucesso."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro inesperado ao gerar mapa."
      },
      { status: 500 }
    );
  }
}
