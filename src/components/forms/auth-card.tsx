import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const isSignup = mode === "signup";

  return (
    <Card className="w-full max-w-md">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Operacao 12S
        </p>
        <h1 className="mt-2 text-3xl font-bold text-coal">
          {isSignup ? "Criar conta" : "Entrar na plataforma"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          {isSignup
            ? "Comece pela anamnese inicial para receber uma direcao adequada ao seu perfil."
            : "Acesse sua trilha, plano alimentar, aulas e proximos passos da operacao."}
        </p>
      </div>

      <form className="mt-6 space-y-4">
        {isSignup ? (
          <>
            <Input placeholder="Nome completo" />
            <Input placeholder="WhatsApp" />
          </>
        ) : null}
        <Input placeholder="E-mail" type="email" />
        <Input placeholder="Senha" type="password" />
        <Button className="w-full" type="submit">
          {isSignup ? "Criar minha conta" : "Entrar"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-graphite">
        {isSignup ? "Ja tem conta?" : "Ainda nao tem conta?"}{" "}
        <Link
          className="font-semibold text-command hover:underline"
          href={isSignup ? "/auth/login" : "/auth/cadastro"}
        >
          {isSignup ? "Entrar" : "Criar cadastro"}
        </Link>
      </p>
    </Card>
  );
}
