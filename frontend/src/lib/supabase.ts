import { createClient, type Session, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vdadfdqqqtofnhfhdkvh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDgyMjksImV4cCI6MjEwMzIyNDIyOX0.JaQHTxmAvLD1hOb7rHlkecoOkohgYweb614-1at8-tE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('demo-project') &&
    supabaseAnonKey !== 'demo-anon-key'
  )
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
    if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_grant')) {
      userMsg = 'Invalid email or password. Please try again.'
    } else if (error.message.includes('Invalid API key') || error.message.includes('apikey')) {
      userMsg = 'Supabase API key is invalid or not yet configured. Connecting via backend server...'
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
    const meta = user.user_metadata || {}
    const appMeta = user.app_metadata || {}
    const provider = appMeta.provider || (user.identities && user.identities[0]?.provider) || 'email'
    const avatarUrl = meta.avatar_url || meta.picture || ''
    const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Farmer User'
    const displayName = meta.name || meta.full_name || user.email?.split('@')[0] || 'Farmer User'

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
      
      // Update avatar or display name from Google if missing in DB
      const updatesToApply: any = {}
      if (avatarUrl && !existing.avatar_url) updatesToApply.avatar_url = avatarUrl
      if (displayName && !existing.display_name) updatesToApply.display_name = displayName
      if (provider === 'google' && existing.auth_provider !== 'google') updatesToApply.auth_provider = 'google'
      if (user.email?.toLowerCase() === 'charankumarreddybantrothula@gmail.com') {
        if (existing.role !== 'admin') updatesToApply.role = 'admin'
      } else if (existing.role === 'admin') {
        updatesToApply.role = 'farmer'
      }

      if (Object.keys(updatesToApply).length > 0) {
        const { data: updated } = await supabase
          .from('profiles')
          .update(updatesToApply)
          .eq('id', user.id)
          .select()
          .maybeSingle()
        return updated || { ...existing, ...updatesToApply }
      }

      return existing
    }

    // Profile doesn't exist yet -> Insert new profile (Admin strictly reserved for charankumarreddybantrothula@gmail.com)
    const defaultRole = user.email?.toLowerCase() === 'charankumarreddybantrothula@gmail.com'
      ? 'admin'
      : user.email?.toLowerCase() === 'expert@farmassist.ai'
      ? 'expert'
      : 'farmer'

    const newProfile: any = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: defaultRole, // STRICT SECURITY DEFAULT
      preferred_language: meta.preferred_language || 'en',
      onboarding_completed: false,
      auth_provider: provider,
      is_active: true,
    }

    console.log('[AUTH] Creating/upserting profile row in Supabase:', newProfile.email)
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .maybeSingle()


    if (insertErr) {
      console.warn('[AUTH] Profile upsert notice:', insertErr.message)
      return newProfile
    }

    return inserted || newProfile
  } catch (err: any) {
    console.warn('[AUTH] syncSupabaseProfile exception:', err)
    return null
  }
}
