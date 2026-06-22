"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminNavigation } from "@/constants/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { supabase } from "@/lib/supabase/client";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
};

export function AdminShell({ children, title }: AdminShellProps) {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking"
  );

  useEffect(() => {
    async function checkAdminAccess() {
      if (!supabase) {
        setStatus("denied");
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        window.location.replace("/dashboard");
        return;
      }

      setStatus("allowed");
    }

    void checkAdminAccess();
  }, []);

  if (status !== "allowed") {
    return (
      <div className="grid min-h-screen place-items-center bg-coal px-4 text-white">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {status === "checking" ? "Verificando acesso..." : "Acesso restrito"}
          </h1>
          <p className="mt-2 text-sm text-white/65">
            Esta área é exclusiva para administradores da Operação 12S.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-20 text-coal lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-coal/10 bg-coal px-4 py-6 text-white lg:block">
        <Link className="block rounded-lg px-3 py-2" href="/admin">
          <span className="text-xs uppercase tracking-[0.2em] text-lime">
            Operação
          </span>
          <strong className="mt-1 block text-2xl">12S</strong>
        </Link>
        <nav className="mt-8 space-y-1">
          {adminNavigation.map((item) => (
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
                Admin
              </p>
              <h1 className="mt-1 truncate text-xl font-bold text-coal sm:text-2xl">
                {title}
              </h1>
            </div>
            <LogoutButton className="hidden sm:inline-flex" />
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-coal/20 bg-lime px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 text-coal shadow-panel lg:hidden">
        {adminNavigation.map((item) => (
          <Link
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-coal/75 transition hover:bg-coal/10 hover:text-coal"
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
