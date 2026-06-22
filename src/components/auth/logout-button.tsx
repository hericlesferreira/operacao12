"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    await supabase?.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <Button
      className={className}
      disabled={isSigningOut}
      onClick={() => void handleLogout()}
      variant="ghost"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isSigningOut ? "Saindo..." : "Sair"}
    </Button>
  );
}
