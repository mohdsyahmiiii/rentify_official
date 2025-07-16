"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface DashboardRecoveryProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export function DashboardRecovery({ loading, error, onRetry }: DashboardRecoveryProps) {
  const [showRecovery, setShowRecovery] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Show recovery options after 8 seconds of loading
  useEffect(() => {
    if (loading && !error) {
      const timer = setTimeout(() => {
        console.log('⚠️ DashboardRecovery: Showing recovery options due to prolonged loading')
        setShowRecovery(true)
      }, 8000)

      return () => clearTimeout(timer)
    } else {
      setShowRecovery(false)
    }
  }, [loading, error])

  const handleRefresh = () => {
    console.log('🔄 DashboardRecovery: User triggered page refresh')
    window.location.reload()
  }

  const handleRetry = () => {
    console.log('🔄 DashboardRecovery: Retry dashboard loading')
    setShowRecovery(false)
    setIsRecovering(true)
    onRetry?.()
    setTimeout(() => setIsRecovering(false), 3000)
  }

  const handleGoHome = () => {
    console.log('🏠 DashboardRecovery: Redirecting to home')
    router.push('/')
  }

  const handleLogout = async () => {
    setIsRecovering(true)
    try {
      console.log('🚪 DashboardRecovery: Logout initiated')
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      console.error('❌ DashboardRecovery: Logout failed:', err)
      window.location.reload()
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p><strong>Dashboard Error:</strong> {error}</p>
                <div className="flex gap-2 flex-wrap">
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleGoHome}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Go Home
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Show recovery options for prolonged loading
  if (showRecovery && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Still loading dashboard...</p>
          </div>
          
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-3">
                <p><strong>Dashboard is taking longer than expected.</strong></p>
                <p className="text-sm">This might be due to a slow connection or server issue. Try one of these options:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRetry}
                    disabled={isRecovering}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {isRecovering ? 'Retrying...' : 'Retry Loading'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    Refresh Page
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleGoHome}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Go Home
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleLogout}
                    disabled={isRecovering}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  💡 <strong>Tip:</strong> If this keeps happening, try clearing your browser cache.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return null
}
