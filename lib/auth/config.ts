/**
 * Authentication Configuration
 * Centralized auth settings for better reliability
 */

export const AUTH_CONFIG = {
  // Timeout settings (in milliseconds)
  INIT_TIMEOUT: 30000,           // 30 seconds for initial auth
  REQUEST_TIMEOUT: 15000,        // 15 seconds for individual auth requests
  REFRESH_TIMEOUT: 10000,        // 10 seconds for session refresh
  
  // Retry settings
  MAX_RETRIES: 3,                // Maximum retry attempts
  RETRY_DELAY: 2000,             // 2 seconds between retries
  REFRESH_RETRY_DELAY: 1000,     // 1 second between refresh retries
  
  // Session management
  AUTO_REFRESH_INTERVAL: 45 * 60 * 1000,  // 45 minutes (before 1-hour expiry)
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000,  // 5 minutes for health checks
  
  // Error messages
  MESSAGES: {
    TIMEOUT: 'Authentication timeout - please refresh the page',
    NETWORK_ERROR: 'Failed to authenticate - please check your connection',
    REFRESH_FAILED: 'Session refresh failed - please try logging in again',
    GENERIC_ERROR: 'Authentication failed - please try again'
  },
  
  // Retry conditions
  RETRYABLE_ERRORS: [
    'timeout',
    'network',
    'fetch',
    'Failed to fetch',
    'TypeError'
  ]
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetryError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || error.toString()
  const errorName = error.name || ''
  
  return AUTH_CONFIG.RETRYABLE_ERRORS.some(retryableError => 
    errorMessage.includes(retryableError) || errorName.includes(retryableError)
  )
}

/**
 * Get appropriate error message for user display
 */
export function getErrorMessage(error: any): string {
  if (!error) return AUTH_CONFIG.MESSAGES.GENERIC_ERROR
  
  const errorMessage = error.message || error.toString()
  
  if (errorMessage.includes('timeout')) {
    return AUTH_CONFIG.MESSAGES.TIMEOUT
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return AUTH_CONFIG.MESSAGES.NETWORK_ERROR
  }
  
  if (errorMessage.includes('refresh')) {
    return AUTH_CONFIG.MESSAGES.REFRESH_FAILED
  }
  
  return error.message || AUTH_CONFIG.MESSAGES.GENERIC_ERROR
}

/**
 * Create a timeout promise for auth operations
 */
export function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  )
}
