import { useCallback } from 'react'
import { useUser } from '@/contexts/user-context'
import { SessionRecovery, withSessionRecovery } from '@/lib/supabase/session-recovery'

export function useSessionRecovery() {
  const { refreshSession } = useUser()

  const executeWithRecovery = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      return withSessionRecovery(
        operation,
        async () => {
          console.log('🔄 useSessionRecovery: Attempting to refresh session')
          try {
            await refreshSession()
          } catch (error) {
            console.error('❌ useSessionRecovery: Session refresh failed, forcing reload')
            window.location.reload()
          }
        }
      )
    },
    [refreshSession]
  )

  const checkSessionHealth = useCallback(async (): Promise<boolean> => {
    const recovery = SessionRecovery.getInstance()
    return recovery.isSessionHealthy()
  }, [])

  const forceRecovery = useCallback(async (): Promise<boolean> => {
    const recovery = SessionRecovery.getInstance()
    return recovery.recoverSession()
  }, [])

  return {
    executeWithRecovery,
    checkSessionHealth,
    forceRecovery,
  }
}
