import { AuthCard } from "@/components/forms/auth-card";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams: Promise<{
    chave?: string;
    codigo?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const accessCode = params.chave ?? params.codigo;
  const expectedCode = process.env.SIGNUP_ACCESS_CODE;

  if (!expectedCode || accessCode !== expectedCode) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
            Cadastro restrito
          </p>
          <h1 className="mt-2 text-3xl font-bold text-coal">
            Link de cadastro invalido
          </h1>
          <p className="mt-3 text-sm leading-6 text-graphite">
            O cadastro de participantes e feito internamente pela equipe da
            Operacao 12S.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <AuthCard mode="signup" signupAccessCode={accessCode} />
    </main>
  );
}
