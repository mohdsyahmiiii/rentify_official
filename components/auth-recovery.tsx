"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSessionRecovery } from "@/hooks/use-session-recovery"

interface AuthRecoveryProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export function AuthRecovery({ loading, error, onRetry }: AuthRecoveryProps) {
  const [showRecovery, setShowRecovery] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { forceRecovery } = useSessionRecovery()

  // Show recovery options after 6 seconds of loading (reduced from 8)
  useEffect(() => {
    if (loading && !error) {
      const timer = setTimeout(() => {
        console.log('⚠️ AuthRecovery: Showing recovery options due to prolonged loading')
        setShowRecovery(true)
      }, 6000)

      return () => clearTimeout(timer)
    } else {
      setShowRecovery(false)
    }
  }, [loading, error])

  const handleRefresh = () => {
    console.log('🔄 AuthRecovery: User triggered page refresh')
    window.location.reload()
  }

  const handleForceLogout = async () => {
    setIsRecovering(true)
    try {
      console.log('🚪 AuthRecovery: Force logout initiated')
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('❌ AuthRecovery: Force logout failed:', err)
      // If logout fails, just refresh the page
      window.location.reload()
    }
  }

  const handleRetry = async () => {
    console.log('🔄 AuthRecovery: Retry authentication')
    setIsRecovering(true)
    setShowRecovery(false)

    try {
      const recovered = await forceRecovery()
      if (!recovered) {
        console.log('🔄 AuthRecovery: Force recovery failed, trying callback')
        onRetry?.()
      }
    } catch (err) {
      console.error('❌ AuthRecovery: Recovery failed:', err)
      onRetry?.()
    } finally {
      setIsRecovering(false)
    }
  }

  // Show error state
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p><strong>Authentication Error:</strong> {error}</p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefresh}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Show recovery options for prolonged loading
  if (showRecovery && loading) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-2">
            <p><strong>Loading is taking longer than expected.</strong></p>
            <p className="text-sm">If you recently performed an action (like listing an item or making a payment), try one of these options:</p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefresh}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh Page
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Retry Authentication
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleForceLogout}
                disabled={isRecovering}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <LogOut className="w-4 h-4 mr-1" />
                {isRecovering ? 'Logging out...' : 'Sign Out & Restart'}
              </Button>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              💡 <strong>Tip:</strong> If this keeps happening, try closing and reopening your browser.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
