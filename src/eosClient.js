import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiUrl = import.meta.env.VITE_EOS_API_URL?.replace(/\/$/, '')

export const eosConfigured = Boolean(supabaseUrl && supabaseAnonKey && apiUrl)

export const supabase = eosConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { flowType: 'pkce' } })
  : null

export async function eosApi(path, options = {}) {
  if (!supabase || !apiUrl) throw new Error('Eos is waiting for its secure configuration.')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Please sign in with GitHub to open Eos.')

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Eos could not complete that request.')
    error.code = payload.error?.code
    error.data = payload.data
    throw error
  }
  return payload.data
}
