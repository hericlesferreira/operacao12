"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPostLoginRedirectPath } from "@/lib/auth/redirect";
import { supabase } from "@/lib/supabase/client";

export function SessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectActiveSession() {
      if (!supabase) {
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      router.replace(await getPostLoginRedirectPath(session.user.id));
      router.refresh();
    }

    void redirectActiveSession();
  }, [router]);

  return null;
}
