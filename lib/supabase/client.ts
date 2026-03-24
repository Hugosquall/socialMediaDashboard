/**
 * Supabase browser client — use em Client Components ("use client")
 * Usa @supabase/ssr para gerenciar cookies automaticamente.
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
