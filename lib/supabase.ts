import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { warn } from './logger'

const envFromProcess = (key: string): string | undefined => {
  try {
    // process.env may be undefined in some RN/Expo runtimes; guard access
    const proc = (process as unknown as { env?: Record<string, string | undefined> })?.env
    return proc ? proc[key] : undefined
  } catch {
    return undefined
  }
}

const expoExtra = (Constants?.expoConfig?.extra ?? (Constants as any).manifest?.extra) as Record<string, any> | undefined

const supabaseUrl = envFromProcess('EXPO_PUBLIC_SUPABASE_URL') || expoExtra?.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = envFromProcess('EXPO_PUBLIC_SUPABASE_ANON_KEY') || expoExtra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // use logger.warn
  warn('⚠️ Supabase not fully configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. Some features will be disabled.')
}

const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    const thrower = () => {
      throw new Error('Supabase client used but configuration is missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
    }
    // Minimal stub that surfaces clear errors at call sites rather than failing silently.
    return {
      from: () => ({ select: thrower, insert: thrower, update: thrower, delete: thrower }),
      auth: { signIn: thrower, signUp: thrower, signOut: thrower },
      storage: { from: thrower },
      rpc: thrower,
    } as unknown as ReturnType<typeof createClient>
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}

export const supabase = createSupabaseClient()