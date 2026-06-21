import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseSecretKey);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseSecretKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
