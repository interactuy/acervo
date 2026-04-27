import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const ACERVO_CONTENT_ID =
  process.env.SUPABASE_ACERVO_CONTENT_ID ?? "production";
export const ACERVO_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "acervo-media";

function hasValue(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

type AcervoSupabaseClient = SupabaseClient<Database, "public", "public">;

function createConfiguredClient(
  key: string | undefined,
): AcervoSupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!hasValue(supabaseUrl) || !hasValue(key)) {
    return null;
  }

  return createClient<Database, "public", "public">(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseServerClient() {
  return createConfiguredClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createSupabaseAdminClient() {
  return createConfiguredClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasSupabaseAdminConfig() {
  return Boolean(createSupabaseAdminClient());
}
