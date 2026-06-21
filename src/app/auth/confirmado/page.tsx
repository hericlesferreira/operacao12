import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EmailConfirmedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-cocoa" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Cadastro confirmado
        </p>
        <h1 className="mt-2 text-3xl font-bold text-coal">
          Seu acesso foi confirmado
        </h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          Agora voce ja pode entrar na plataforma com o e-mail e senha
          cadastrados.
        </p>
        <Link className="mt-6 block" href="/auth/login">
          <Button className="w-full">Entrar na plataforma</Button>
        </Link>
      </Card>
    </main>
  );
}
