import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UpdateProfilePayload = {
  fullName?: string;
  email?: string;
  whatsapp?: string | null;
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

    const payload = (await request.json()) as UpdateProfilePayload;
    const fullName = payload.fullName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const whatsapp = payload.whatsapp?.trim() || null;
    const password = payload.password?.trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Informe nome e e-mail para atualizar o perfil." },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "A nova senha precisa ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const authUpdate: {
      email?: string;
      email_confirm?: boolean;
      password?: string;
      user_metadata?: Record<string, string | null>;
    } = {
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        whatsapp
      }
    };

    if (password) {
      authUpdate.password = password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      authUpdate
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        whatsapp,
        ...(password ? { must_change_password: false } : {})
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      email,
      message: password
        ? "Perfil e senha atualizados com sucesso."
        : "Perfil atualizado com sucesso.",
      passwordChanged: Boolean(password)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro inesperado ao atualizar perfil."
      },
      { status: 500 }
    );
  }
}
