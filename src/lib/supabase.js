import { createClient } from '@supabase/supabase-js'

// Ces valeurs seront remplacées lors du déploiement
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://VOTRE_PROJET.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || ''
