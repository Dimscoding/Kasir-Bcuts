import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'
import { config } from './config'

export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
