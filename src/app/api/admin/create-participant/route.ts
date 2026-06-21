import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CreateParticipantPayload = {
  fullName?: string;
  whatsapp?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const expectedCode = process.env.SIGNUP_ACCESS_CODE;
  const receivedCode = request.headers.get("x-signup-access-code");

  if (!expectedCode || receivedCode !== expectedCode) {
    return NextResponse.json(
      { error: "Link de cadastro invalido ou expirado." },
      { status: 403 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin nao esta configurado." },
      { status: 500 }
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
      { error: createUserError?.message ?? "Nao foi possivel criar o usuario." },
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
    access_starts_at: new Date().toISOString(),
    access_expires_at: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toISOString()
  });

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    userId: data.user.id,
    message: "Participante cadastrado com acesso ativo."
  });
}
