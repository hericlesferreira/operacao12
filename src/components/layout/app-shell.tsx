import Link from "next/link";
import { LogOut } from "lucide-react";
import { participantNavigation } from "@/constants/navigation";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
};

export function AppShell({ children, title, eyebrow = "Operacao 12S" }: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper pb-20 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-coal/10 bg-coal px-4 py-6 text-white lg:block">
        <Link className="block rounded-lg px-3 py-2" href="/dashboard">
          <span className="text-xs uppercase tracking-[0.2em] text-lime">Operacao</span>
          <strong className="mt-1 block text-2xl">12S</strong>
        </Link>
        <nav className="mt-8 space-y-1">
          {participantNavigation.map((item) => (
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-white/78 transition hover:bg-white/10 hover:text-white"
              href={item.href}
              key={item.href}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-coal/10 bg-paper/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-graphite/60">
                {eyebrow}
              </p>
              <h1 className="mt-1 truncate text-xl font-bold text-coal sm:text-2xl">
                {title}
              </h1>
            </div>
            <Button className="hidden sm:inline-flex" variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-coal/10 bg-coal px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 text-white shadow-panel lg:hidden">
        {participantNavigation.map((item) => (
          <Link
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            href={item.href}
            key={item.href}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="w-full truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
