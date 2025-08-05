"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserContextType {
  user: SupabaseUser | null
  loading: boolean
  error: string | null
  refreshSession: () => Promise<void>
  forceReinitialize: () => Promise<void>
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

        // Add timeout to the auth request itself (reduced to 8 seconds)
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth request timeout')), 8000)
        )

        const { data: { user }, error: authError } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any

        if (authError) {
          console.error('❌ UserContext: Auth error:', authError)

          // Retry on certain errors (reduced retry delay)
          if (retryCount < maxRetries && (
            authError.message.includes('timeout') ||
            authError.message.includes('network') ||
            authError.message.includes('fetch') ||
            authError.message.includes('Failed to fetch')
          )) {
            console.log(`🔄 UserContext: Retrying auth request in 1 second...`)
            setTimeout(() => getUser(retryCount + 1), 1000)
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

        // Retry on network errors (reduced retry delay)
        if (retryCount < maxRetries && (
          err.message.includes('timeout') ||
          err.message.includes('network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed to fetch') ||
          err.name === 'TypeError'
        )) {
          console.log(`🔄 UserContext: Retrying after error in 1 second...`)
          setTimeout(() => getUser(retryCount + 1), 1000)
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

    // Enhanced page visibility handling for production stability
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('👁️ UserContext: Page became visible, checking session health')
        try {
          // Add timeout to prevent hanging
          const healthCheckPromise = supabase.auth.getUser()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )

          const { data: { user: currentUser }, error } = await Promise.race([
            healthCheckPromise,
            timeoutPromise
          ]) as any

          if (error || !currentUser) {
            console.log('⚠️ UserContext: Session appears invalid, attempting refresh')

            // Enhanced session refresh with retry logic
            let refreshAttempts = 0
            const maxRefreshAttempts = 2

            while (refreshAttempts < maxRefreshAttempts) {
              try {
                const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
                if (!refreshError && session?.user) {
                  console.log('✅ UserContext: Session refreshed successfully on visibility change')
                  setUser(session.user)
                  setError(null)
                  return
                }
                refreshAttempts++
              } catch (refreshErr) {
                refreshAttempts++
                console.warn(`⚠️ UserContext: Refresh attempt ${refreshAttempts} failed:`, refreshErr)
              }
            }

            console.error('❌ UserContext: All session refresh attempts failed')
            setError('Session expired - please refresh the page')
          }
        } catch (err: any) {
          console.error('❌ UserContext: Error during visibility change handling:', err)
          if (err.message.includes('timeout')) {
            setError('Connection timeout - please check your internet')
          }
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

  // Nuclear option: Force complete auth reinitialize
  const forceReinitialize = async () => {
    console.log('💥 UserContext: Force reinitializing auth state')
    setLoading(true)
    setError(null)

    try {
      // Clear all state
      setUser(null)

      // Wait a moment for state to clear
      await new Promise(resolve => setTimeout(resolve, 300))

      // Create completely fresh client
      const freshClient = createClient()

      // Get user with fresh client and timeout protection
      const authPromise = freshClient.auth.getUser()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Nuclear auth timeout')), 5000)
      )

      const { data: { user: freshUser }, error: freshError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any

      if (freshError) {
        console.error('❌ UserContext: Fresh auth failed:', freshError)
        // Don't set error state - just log it and continue
        setUser(null)
      } else {
        console.log('✅ UserContext: Fresh auth successful:', freshUser ? 'authenticated' : 'not authenticated')
        setUser(freshUser)
        setError(null)
      }
    } catch (error) {
      console.error('❌ UserContext: Force reinitialize failed:', error)
      // Don't set error state - just continue silently
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, error, refreshSession, forceReinitialize }}>
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
