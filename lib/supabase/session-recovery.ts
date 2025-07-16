import { createClient } from './client'

/**
 * Session Recovery Utility
 * Helps recover from session issues after database operations
 */
export class SessionRecovery {
  private static instance: SessionRecovery
  private recoveryAttempts = 0
  private maxAttempts = 3

  static getInstance(): SessionRecovery {
    if (!SessionRecovery.instance) {
      SessionRecovery.instance = new SessionRecovery()
    }
    return SessionRecovery.instance
  }

  /**
   * Attempt to recover session after a database operation
   */
  async recoverSession(): Promise<boolean> {
    if (this.recoveryAttempts >= this.maxAttempts) {
      console.log('🚫 SessionRecovery: Max recovery attempts reached')
      return false
    }

    this.recoveryAttempts++
    console.log(`🔄 SessionRecovery: Attempt ${this.recoveryAttempts}/${this.maxAttempts}`)

    try {
      const supabase = createClient()
      
      // First, try to refresh the session
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.log('⚠️ SessionRecovery: Session refresh failed, trying getUser')
        
        // If refresh fails, try to get current user
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()
        
        if (getUserError) {
          console.error('❌ SessionRecovery: Both refresh and getUser failed')
          return false
        }
        
        if (user) {
          console.log('✅ SessionRecovery: User still authenticated via getUser')
          this.resetAttempts()
          return true
        }
      } else if (session?.user) {
        console.log('✅ SessionRecovery: Session refreshed successfully')
        this.resetAttempts()
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ SessionRecovery: Recovery attempt failed:', error)
      return false
    }
  }

  /**
   * Reset recovery attempts counter
   */
  resetAttempts(): void {
    this.recoveryAttempts = 0
  }

  /**
   * Check if session is healthy
   */
  async isSessionHealthy(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      return !error && !!user
    } catch {
      return false
    }
  }
}

/**
 * Wrapper function for database operations that might affect session
 */
export async function withSessionRecovery<T>(
  operation: () => Promise<T>,
  onSessionIssue?: () => void
): Promise<T> {
  try {
    const result = await operation()
    
    // After successful operation, check session health
    const recovery = SessionRecovery.getInstance()
    const isHealthy = await recovery.isSessionHealthy()
    
    if (!isHealthy) {
      console.log('⚠️ Session appears unhealthy after operation, attempting recovery')
      const recovered = await recovery.recoverSession()
      
      if (!recovered) {
        console.log('❌ Session recovery failed, triggering callback')
        onSessionIssue?.()
      }
    }
    
    return result
  } catch (error) {
    console.error('❌ Operation failed:', error)
    throw error
  }
}
