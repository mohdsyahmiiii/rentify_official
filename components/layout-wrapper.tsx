"use client"

import { useUser } from "@/contexts/user-context"
import { AuthRecovery } from "@/components/auth-recovery"
import { Navigation } from "@/components/navigation"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { loading, error, refreshSession } = useUser()

  const handleRetry = async () => {
    try {
      await refreshSession()
    } catch (err) {
      console.error('Retry failed, forcing page refresh:', err)
      window.location.reload()
    }
  }

  return (
    <>
      {/* Navigation */}
      <Navigation />

      {/* Auth Recovery Component */}
      <AuthRecovery 
        loading={loading} 
        error={error} 
        onRetry={handleRetry}
      />

      {/* Main Content */}
      {children}
    </>
  )
}
