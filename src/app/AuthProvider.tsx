import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../shared/firebase/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }
    const fallback = setTimeout(() => {
      setLoading(false)
    }, 2000)
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      clearTimeout(fallback)
    })
    return () => {
      clearTimeout(fallback)
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        if (!auth) throw new Error('Firebase 설정이 필요합니다.')
        await signInWithEmailAndPassword(auth, email, password)
      },
      signUp: async (email, password) => {
        if (!auth) throw new Error('Firebase 설정이 필요합니다.')
        await createUserWithEmailAndPassword(auth, email, password)
      },
      signInWithGoogle: async () => {
        if (!auth || !googleProvider) throw new Error('Firebase 설정이 필요합니다.')
        await signInWithPopup(auth, googleProvider)
      },
      signOut: async () => {
        if (!auth) return
        await firebaseSignOut(auth)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('AuthProvider is missing')
  }
  return ctx
}
