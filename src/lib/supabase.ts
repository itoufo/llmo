import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  default_tenant_id: string | null
}

export type Tenant = {
  id: string
  name: string
  slug: string
  plan: string
  settings: Record<string, unknown>
}
