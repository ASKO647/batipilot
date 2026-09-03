import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL est manquante."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY est manquante."
  );
}

/**
 * Client Supabase réservé au serveur.
 *
 * IMPORTANT :
 * - Ne jamais importer ce fichier dans un composant "use client".
 * - Ne jamais exposer SUPABASE_SERVICE_ROLE_KEY au navigateur.
 * - Ce client contourne les règles RLS.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);