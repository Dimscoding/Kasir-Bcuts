const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const ownerEmail = import.meta.env.VITE_OWNER_EMAIL?.trim()

export const config = {
  supabaseUrl: supabaseUrl || 'https://example.supabase.co',
  supabaseKey: supabaseKey || 'missing-publishable-key',
  ownerEmail: ownerEmail || '',
  isConfigured: Boolean(supabaseUrl && supabaseKey && ownerEmail),
} as const
