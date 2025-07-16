"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserContextType {
  user: SupabaseUser | null
  loading: boolean
  error: string | null
  refreshSession: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const initializationRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Prevent double initialization
    if (initializationRef.current) return
    initializationRef.current = true

    console.log('🔄 UserContext: Initializing auth state...')

    // Set a timeout to detect endless loading
    timeoutRef.current = setTimeout(() => {
      console.error('⚠️ UserContext: Auth initialization taking too long (>10s)')
      if (loading) {
        setError('Authentication timeout - please refresh the page')
        setLoading(false)
      }
    }, 10000)

    // Get initial user with error handling
    const getUser = async () => {
      try {
        console.log('🔍 UserContext: Fetching initial user...')
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error('❌ UserContext: Auth error:', authError)
          setError(authError.message)
          setUser(null)
        } else {
          console.log('✅ UserContext: Initial user fetched:', user ? 'authenticated' : 'not authenticated')
          setUser(user)
          setError(null)
        }
      } catch (err) {
        console.error('❌ UserContext: Unexpected error during user fetch:', err)
        setError('Failed to authenticate')
        setUser(null)
      } finally {
        setLoading(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }

    getUser()

    // Listen for auth changes with enhanced logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 UserContext: Auth state changed - Event: ${event}, User: ${session?.user ? 'authenticated' : 'not authenticated'}`)

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          setError(null)
          setLoading(false)
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null)
          setError(null)
        } else {
          // For other events, update user but don't change loading state during initial load
          setUser(session?.user ?? null)
          setError(null)
          if (!loading) {
            setLoading(false)
          }
        }
      }
    )

    // Handle page visibility changes to refresh session when user returns
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('👁️ UserContext: Page became visible, checking session health')
        try {
          const { data: { user: currentUser }, error } = await supabase.auth.getUser()
          if (error || !currentUser) {
            console.log('⚠️ UserContext: Session appears invalid, attempting refresh')
            // Call the refresh function directly instead of using the context function
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('❌ UserContext: Session refresh failed on visibility change:', refreshError)
            } else {
              setUser(session?.user ?? null)
            }
          }
        } catch (err) {
          console.error('❌ UserContext: Error checking session on visibility change:', err)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      console.log('🧹 UserContext: Cleaning up auth subscription')
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, []) // Remove supabase.auth dependency to prevent re-initialization

  // Function to manually refresh session
  const refreshSession = async () => {
    console.log('🔄 UserContext: Manual session refresh triggered')
    setLoading(true)
    setError(null)

    try {
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('❌ UserContext: Session refresh failed:', refreshError)
        setError('Session refresh failed')
        setUser(null)
      } else {
        console.log('✅ UserContext: Session refreshed successfully')
        setUser(session?.user ?? null)
        setError(null)
      }
    } catch (err) {
      console.error('❌ UserContext: Unexpected error during session refresh:', err)
      setError('Failed to refresh session')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, error, refreshSession }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
