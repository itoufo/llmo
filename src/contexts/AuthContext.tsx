import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Profile, type Tenant } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  tenant: Tenant | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    tenant: null,
    loading: true,
  })

  // 初期化・セッション監視
  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user, session)
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    // セッション変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserData(session.user, session)
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            tenant: null,
            loading: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ユーザーデータ（プロファイル・テナント）読み込み
  async function loadUserData(user: User, session: Session) {
    try {
      // プロファイル取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // テナント取得
      let tenant: Tenant | null = null
      if (profile?.default_tenant_id) {
        const { data } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.default_tenant_id)
          .single()
        tenant = data
      }

      setState({
        user,
        session,
        profile,
        tenant,
        loading: false,
      })
    } catch (error) {
      console.error('Failed to load user data:', error)
      setState(prev => ({ ...prev, user, session, loading: false }))
    }
  }

  // ログイン
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  // サインアップ
  async function signUp(email: string, password: string, name?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    return { error: error as Error | null }
  }

  // ログアウト
  async function signOut() {
    await supabase.auth.signOut()
  }

  // Googleログイン
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
