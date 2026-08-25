import { createClient, type Session, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('demo-project'))
}

export async function signInWithGoogle() {
  const redirectUrl = window.location.origin
  console.log('[AUTH] Initiating Google OAuth with redirectUrl:', redirectUrl)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) {
    console.error('[AUTH] Google OAuth initiation error:', error)
    throw new Error(error.message || 'Failed to initiate Google sign in.')
  }
  return data
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { full_name?: string; preferred_language?: string }
) {
  console.log('[AUTH] Calling Supabase signUp with email:', email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata?.full_name || '',
        name: metadata?.full_name || '',
        preferred_language: metadata?.preferred_language || 'en',
        role: 'farmer', // STRICT DEFAULT
      },
    },
  })

  if (error) {
    console.error('[AUTH] Supabase signUp error:', error)
    let userMsg = error.message
    if (error.message.includes('already registered')) {
      userMsg = 'An account already exists with this email. Please sign in instead.'
    } else if (error.message.includes('Password should be at least')) {
      userMsg = 'Password must be at least 6 characters.'
    }
    throw new Error(userMsg)
  }
  return data
}

export async function signInWithEmail(email: string, password: string) {
  console.log('[AUTH] Calling Supabase signInWithPassword for:', email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[AUTH] Supabase signIn error:', error)
    let userMsg = error.message
    if (error.message.includes('Invalid login credentials')) {
      userMsg = 'Invalid email or password. Please try again.'
    }
    throw new Error(userMsg)
  }
  return data
}

export async function signOutSupabase() {
  console.log('[AUTH] Calling Supabase signOut')
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.warn('[AUTH] Supabase signOut notice:', error)
  }
}

export async function getCurrentSupabaseSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.warn('[AUTH] Error fetching session:', error)
    return null
  }
  return data.session
}

/**
 * Synchronize Supabase Profile table for the authenticated user.
 * Guarantees profile row exists without overwriting existing roles or locations.
 */
export async function syncSupabaseProfile(user: User): Promise<any> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data: existing, error: selectErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (selectErr) {
      console.warn('[AUTH] Error selecting profile from Supabase:', selectErr.message)
    }

    if (existing) {
      console.log('[AUTH] Found existing profile in Supabase:', existing.role, 'onboarding:', existing.onboarding_completed)
      return existing
    }

    // Profile doesn't exist yet -> Insert new farmer profile
    const meta = user.user_metadata || {}
    const appMeta = user.app_metadata || {}
    const provider = appMeta.provider || (user.identities && user.identities[0]?.provider) || 'email'

    const newProfile = {
      id: user.id,
      email: user.email,
      full_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Farmer User',
      display_name: meta.name || meta.full_name || user.email?.split('@')[0] || 'Farmer User',
      avatar_url: meta.avatar_url || meta.picture || '',
      role: 'farmer', // STRICT SECURITY DEFAULT
      preferred_language: meta.preferred_language || 'en',
      onboarding_completed: false,
      auth_provider: provider,
      is_active: true,
    }

    console.log('[AUTH] Creating new profile row in Supabase:', newProfile.email)
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .maybeSingle()

    if (insertErr) {
      console.warn('[AUTH] Profile insertion notice (may be created by trigger):', insertErr.message)
      return newProfile
    }

    return inserted || newProfile
  } catch (err: any) {
    console.warn('[AUTH] syncSupabaseProfile exception:', err)
    return null
  }
}
