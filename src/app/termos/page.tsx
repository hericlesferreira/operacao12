import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-12 text-coal md:px-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
            Avisos importantes
          </p>
          <h1 className="mt-2 text-3xl font-bold">Termos da Operacao 12S</h1>
          <div className="mt-6 space-y-4 leading-7 text-graphite">
            <p>
              A Operacao 12S e um programa de educacao alimentar e
              emagrecimento guiado. Ela nao substitui acompanhamento medico ou
              nutricional individualizado.
            </p>
            <p>
              O plano e personalizado por perfil, nao individualizado consulta
              a consulta. Pessoas com condicoes clinicas importantes, exames
              alterados ou uso de medicacoes continuas devem manter
              acompanhamento profissional regular.
            </p>
            <p>
              Resultados dependem da adesao individual, rotina, historico de
              saude e consistencia durante o processo.
            </p>
          </div>
          <Link className="mt-7 inline-block" href="/">
            <Button variant="ghost">Voltar</Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
