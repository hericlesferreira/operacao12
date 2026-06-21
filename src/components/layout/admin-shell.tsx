import Link from "next/link";
import { adminNavigation } from "@/constants/navigation";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
};

export function AdminShell({ children, title }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-coal text-white">
      <header className="border-b border-white/10 px-4 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          </div>
          <nav className="flex gap-2">
            {adminNavigation.map((item) => (
              <Link
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/15"
                href={item.href}
                key={item.href}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
