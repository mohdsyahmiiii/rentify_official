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
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Prevent double initialization
    if (initializationRef.current) return
    initializationRef.current = true

    console.log('🔄 UserContext: Initializing auth state...')

    // Set a timeout to detect endless loading (increased to 30s)
    timeoutRef.current = setTimeout(() => {
      console.error('⚠️ UserContext: Auth initialization taking too long (>30s)')
      if (loading) {
        setError('Authentication timeout - please refresh the page')
        setLoading(false)
      }
    }, 30000)

    // Get initial user with enhanced error handling and retry logic
    const getUser = async (retryCount = 0) => {
      const maxRetries = 3

      try {
        console.log(`🔍 UserContext: Fetching initial user... (attempt ${retryCount + 1}/${maxRetries + 1})`)

        // Add timeout to the auth request itself
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth request timeout')), 15000)
        )

        const { data: { user }, error: authError } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any

        if (authError) {
          console.error('❌ UserContext: Auth error:', authError)

          // Retry on certain errors
          if (retryCount < maxRetries && (
            authError.message.includes('timeout') ||
            authError.message.includes('network') ||
            authError.message.includes('fetch') ||
            authError.message.includes('Failed to fetch')
          )) {
            console.log(`🔄 UserContext: Retrying auth request in 2 seconds...`)
            setTimeout(() => getUser(retryCount + 1), 2000)
            return
          }

          setError(authError.message)
          setUser(null)
        } else {
          console.log('✅ UserContext: Initial user fetched:', user ? 'authenticated' : 'not authenticated')
          setUser(user)
          setError(null)
        }
      } catch (err: any) {
        console.error('❌ UserContext: Unexpected error during user fetch:', err)

        // Retry on network errors
        if (retryCount < maxRetries && (
          err.message.includes('timeout') ||
          err.message.includes('network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed to fetch') ||
          err.name === 'TypeError'
        )) {
          console.log(`🔄 UserContext: Retrying after error in 2 seconds...`)
          setTimeout(() => getUser(retryCount + 1), 2000)
          return
        }

        setError('Failed to authenticate - please check your connection')
        setUser(null)
      } finally {
        // Only set loading to false if this is the final attempt or success
        if (retryCount >= maxRetries || !error) {
          setLoading(false)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
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

    // Set up automatic session refresh every 45 minutes (before 1-hour expiry)
    const setupSessionRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      refreshIntervalRef.current = setInterval(async () => {
        if (user) {
          console.log('🔄 UserContext: Automatic session refresh')
          try {
            const { data: { session }, error } = await supabase.auth.refreshSession()
            if (error) {
              console.error('❌ UserContext: Automatic session refresh failed:', error)
            } else {
              console.log('✅ UserContext: Session refreshed automatically')
              setUser(session?.user ?? null)
            }
          } catch (err) {
            console.error('❌ UserContext: Error during automatic refresh:', err)
          }
        }
      }, 45 * 60 * 1000) // 45 minutes
    }

    // Start automatic refresh if user is authenticated
    if (user) {
      setupSessionRefresh()
    }

    return () => {
      console.log('🧹 UserContext: Cleaning up auth subscription')
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, []) // Remove supabase.auth dependency to prevent re-initialization

  // Function to manually refresh session with retry logic
  const refreshSession = async (retryCount = 0) => {
    const maxRetries = 2
    console.log(`🔄 UserContext: Manual session refresh triggered (attempt ${retryCount + 1}/${maxRetries + 1})`)
    setLoading(true)
    setError(null)

    try {
      // Add timeout to refresh request
      const refreshPromise = supabase.auth.refreshSession()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Refresh timeout')), 10000)
      )

      const { data: { session }, error: refreshError } = await Promise.race([
        refreshPromise,
        timeoutPromise
      ]) as any

      if (refreshError) {
        console.error('❌ UserContext: Session refresh failed:', refreshError)

        // Retry on certain errors
        if (retryCount < maxRetries && (
          refreshError.message.includes('timeout') ||
          refreshError.message.includes('network') ||
          refreshError.message.includes('fetch')
        )) {
          console.log(`🔄 UserContext: Retrying session refresh in 1 second...`)
          setTimeout(() => refreshSession(retryCount + 1), 1000)
          return
        }

        setError('Session refresh failed - please try logging in again')
        setUser(null)
      } else {
        console.log('✅ UserContext: Session refreshed successfully')
        setUser(session?.user ?? null)
        setError(null)
      }
    } catch (err: any) {
      console.error('❌ UserContext: Unexpected error during session refresh:', err)

      // Retry on network errors
      if (retryCount < maxRetries && (
        err.message.includes('timeout') ||
        err.message.includes('network') ||
        err.message.includes('fetch')
      )) {
        console.log(`🔄 UserContext: Retrying session refresh after error in 1 second...`)
        setTimeout(() => refreshSession(retryCount + 1), 1000)
        return
      }

      setError('Failed to refresh session - please check your connection')
      setUser(null)
    } finally {
      // Only set loading to false if this is the final attempt
      if (retryCount >= maxRetries || !error) {
        setLoading(false)
      }
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
