"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminNavigation } from "@/constants/navigation";
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
