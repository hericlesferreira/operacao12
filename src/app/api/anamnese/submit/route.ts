import { NextResponse } from "next/server";
import {
  calculateOperation12sMetabolism,
  type ActivityLevel,
  type BiologicalSex
} from "@/lib/calculations/metabolic";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateTrailContent } from "@/lib/trail/generator";
import {
  anamneseSchema,
  calculateAge,
  type AnamneseFormData
} from "@/schemas/anamnese";
import type { Json } from "@/types/database";

type SubmitAnamnesePayload = {
  answers?: unknown;
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

    const payload = (await request.json()) as SubmitAnamnesePayload;
    const parsed = anamneseSchema.safeParse(payload.answers);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do questionário inválidos." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const userAge = calculateAge(data.birthDate);
    const metabolic = calculateOperation12sMetabolism({
      biologicalSex: data.biologicalSex as BiologicalSex,
      activityLevel: data.activityLevel as ActivityLevel,
      age: userAge,
      weightKg: data.weightKg,
      heightCm: data.heightCm
    });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: anamnese, error: anamneseError } = await supabaseAdmin
      .from("anamneses")
      .insert(buildAnamneseInsert(data, user.id, profile?.full_name ?? user.email ?? "Participante", userAge))
      .select("*")
      .single();

    if (anamneseError || !anamnese) {
      return NextResponse.json(
        { error: anamneseError?.message ?? "Não foi possível salvar o questionário." },
        { status: 400 }
      );
    }

    const [{ data: calculation, error: calculationError }, { data: assessment, error: assessmentError }] =
      await Promise.all([
        supabaseAdmin
          .from("metabolic_calculations")
          .insert({
            user_id: user.id,
            anamnese_id: anamnese.id,
            basal_metabolic_rate: metabolic.basalMetabolicRate,
            total_energy_expenditure: metabolic.totalEnergyExpenditure,
            activity_factor: metabolic.activityFactor,
            cut_target_calories: metabolic.cutTargetCalories,
            indicated_plan_code: metabolic.indicatedPlan?.code ?? null,
            estimated_deficit: metabolic.estimatedDeficit,
            review_status: metabolic.reviewRecommended
              ? "revisao_recomendada"
              : "sem_revisao",
            review_reasons: metabolic.reviewReasons
          })
          .select("*")
          .single(),
        supabaseAdmin
          .from("physical_assessments")
          .upsert(
            {
              user_id: user.id,
              week: 0,
              weight_kg: data.weightKg,
              neck_cm: data.neckCm,
              arm_cm: data.armCm,
              waist_cm: data.waistCm,
              abdomen_cm: data.abdomenCm,
              thigh_cm: data.thighCm,
              calf_cm: data.calfCm
            },
            { onConflict: "user_id,week" }
          )
          .select("*")
          .single()
      ]);

    if (calculationError || !calculation) {
      return NextResponse.json(
        { error: calculationError?.message ?? "Não foi possível gerar o cálculo metabólico." },
        { status: 400 }
      );
    }

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: assessmentError?.message ?? "Não foi possível salvar a avaliação física." },
        { status: 400 }
      );
    }

    const trailContent = generateTrailContent({
      anamnese,
      assessment,
      calculation,
      curation: null
    });

    const { error: trailError } = await supabaseAdmin.from("operation_trails").insert({
      user_id: user.id,
      anamnese_id: anamnese.id,
      calculation_id: calculation.id,
      priorities: trailContent as unknown as Json,
      recommended_materials: [],
      generated_at: new Date().toISOString()
    });

    if (trailError) {
      return NextResponse.json({ error: trailError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Questionário salvo com sucesso." });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro inesperado ao salvar questionário."
      },
      { status: 500 }
    );
  }
}

function buildAnamneseInsert(
  data: AnamneseFormData,
  userId: string,
  fullName: string,
  userAge: number
) {
  return {
    user_id: userId,
    full_name: fullName,
    age: userAge,
    biological_sex: data.biologicalSex,
    weight_kg: data.weightKg,
    height_cm: data.heightCm,
    main_goal: data.mainGoals.join(", "),
    weight_loss_history: data.weightLossHistory || null,
    main_difficulty: data.mainDifficulties.join(", "),
    activity_level: data.activityLevel,
    sleep_hours: data.sleepHours || null,
    sleep_quality: data.sleepQuality || null,
    health_conditions: [
      ...data.healthConditions,
      ...(data.healthConditionOther ? [`Outro: ${data.healthConditionOther}`] : [])
    ],
    food_preference: data.foodPreferences.join(", "),
    motivation: data.motivation,
    behavioral_answers: {
      birthDate: data.birthDate,
      weekendDifficulty: data.weekendDifficulty,
      weekendDifficultyReason: data.weekendDifficultyReason || null,
      sweetsDifficulty: data.sweetsDifficulty,
      nightHunger: data.nightHunger,
      activityDescription: data.activityDescription || null,
      dislikedFoods: data.dislikedFoods || null,
      foodAllergies: data.foodAllergies,
      foodAllergyOther: data.foodAllergyOther || null
    },
    raw_answers: data as unknown as Json,
    completed_at: new Date().toISOString()
  };
}
