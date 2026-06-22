import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SessionRedirect } from "@/components/auth/session-redirect";

const inclusions = [
  "Mapa da Operação gerado pelo Questionário Operação 12S",
  "Plano alimentar indicado ao perfil",
  "Curadoria do ponto de partida",
  "Prioridades praticas para as 12 semanas",
  "Avaliacoes fisicas programadas"
];

export default function HomePage() {
  return (
    <main className="bg-paper text-coal">
      <SessionRedirect />
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cocoa">
            Programa digital de emagrecimento
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight md:text-6xl">
            Operacao 12S
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-graphite">
            12 semanas para emagrecer com estrategia e parar de viver
            recomecando.
          </p>
          <p className="mt-4 max-w-2xl leading-7 text-graphite">
            Receba um mapa personalizado, um plano alimentar direcionado ao
            seu perfil e uma direcao clara para executar as proximas 12 semanas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/login">
              <Button>
                Acessar minha operacao
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/termos">
              <Button variant="ghost">Ver avisos importantes</Button>
            </Link>
          </div>
        </div>

        <Card className="bg-coal text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime">
            Clareza antes de intensidade
          </p>
          <h2 className="mt-3 text-3xl font-bold">O caminho das 12 semanas</h2>
          <div className="mt-6 space-y-4">
            {inclusions.map((item) => (
              <div className="flex gap-3" key={item}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-lime" />
                <span className="text-white/82">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
