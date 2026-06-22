import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CreateParticipantPayload = {
  fullName?: string;
  whatsapp?: string;
  email?: string;
  password?: string;
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

    const payload = (await request.json()) as CreateParticipantPayload;
    const fullName = payload.fullName?.trim();
    const whatsapp = payload.whatsapp?.trim() || null;
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? "";

    if (!fullName || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Informe nome, e-mail e senha com pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const { data, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        whatsapp
      }
    });

    if (createUserError || !data.user) {
      return NextResponse.json(
        { error: createUserError?.message ?? "Não foi possível criar o usuário." },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      whatsapp,
      role: "participant",
      access_status: "ativo",
      must_change_password: true,
      access_starts_at: new Date().toISOString(),
      access_expires_at: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString()
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      userId: data.user.id,
      message: "Participante cadastrado com acesso ativo."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao cadastrar participante."
      },
      { status: 500 }
    );
  }
}
