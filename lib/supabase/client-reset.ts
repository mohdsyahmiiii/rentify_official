/**
 * Supabase Client Reset Utility
 * Handles client corruption issues after database operations
 * SAFE: Can be disabled with environment variable
 */

import { createClient } from './client'

// Feature flag - can disable if issues occur
const CLIENT_RESET_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CLIENT_RESET !== 'false'

/**
 * Reset Supabase client after problematic database operations
 * This fixes client corruption that causes auth timeouts
 */
export class SupabaseClientReset {
  private static resetInProgress = false
  private static resetCount = 0
  private static maxResets = 3 // Prevent infinite reset loops

  /**
   * Check if client reset is needed and safe to perform
   */
  static shouldReset(actionType: string): boolean {
    if (!CLIENT_RESET_ENABLED) {
      console.log('🔒 ClientReset: Disabled via environment variable')
      return false
    }

    if (this.resetInProgress) {
      console.log('⏳ ClientReset: Reset already in progress, skipping')
      return false
    }

    if (this.resetCount >= this.maxResets) {
      console.log('🚫 ClientReset: Max resets reached, skipping to prevent loops')
      return false
    }

    // Only reset for specific problematic actions
    const problematicActions = [
      'return_initiated',
      'return_confirmed', 
      'pickup_confirmed'
    ]

    return problematicActions.includes(actionType)
  }

  /**
   * Perform safe client reset with fallback handling
   */
  static async performReset(actionType: string): Promise<boolean> {
    if (!this.shouldReset(actionType)) {
      return false
    }

    this.resetInProgress = true
    this.resetCount++

    try {
      console.log(`🔄 ClientReset: Starting reset for ${actionType} (attempt ${this.resetCount})`)

      // Step 1: Create new client instance
      const newClient = createClient()
      
      // Step 2: Test new client with simple operation
      const { data: { user }, error } = await newClient.auth.getUser()
      
      if (error) {
        console.warn('⚠️ ClientReset: New client test failed:', error.message)
        return false
      }

      // Step 3: If successful, signal that reset worked
      console.log('✅ ClientReset: Reset successful, new client working')
      
      // Reset success counter after successful reset
      setTimeout(() => {
        this.resetCount = 0
        console.log('🔄 ClientReset: Reset counter cleared')
      }, 30000) // Clear after 30 seconds

      return true

    } catch (error) {
      console.error('❌ ClientReset: Reset failed:', error)
      return false
    } finally {
      this.resetInProgress = false
    }
  }

  /**
   * Get reset statistics for monitoring
   */
  static getStats() {
    return {
      enabled: CLIENT_RESET_ENABLED,
      resetCount: this.resetCount,
      inProgress: this.resetInProgress,
      maxResets: this.maxResets
    }
  }

  /**
   * Force clear reset state (for testing/debugging)
   */
  static clearState() {
    this.resetInProgress = false
    this.resetCount = 0
    console.log('🧹 ClientReset: State cleared manually')
  }
}

/**
 * Convenience function for components to use
 */
export async function resetClientAfterAction(actionType: string): Promise<boolean> {
  return SupabaseClientReset.performReset(actionType)
}
