"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PayoutData {
  total_earnings: number
  pending_earnings: number
  available_earnings: number
  stripe_onboarding_complete: boolean
  recent_rentals: Array<{
    id: string
    items: { title: string }
    total_amount: number
    service_fee: number
    created_at: string
    status: string
  }>
}

export default function PayoutsPage() {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingLoading, setOnboardingLoading] = useState(false)

  useEffect(() => {
    fetchPayoutData()
  }, [])

  const fetchPayoutData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get user profile and earnings data
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_onboarding_complete")
        .eq("id", user.id)
        .single()

      // Get recent rentals for this owner
      const { data: rentals } = await supabase
        .from("rentals")
        .select(`
          id,
          total_amount,
          service_fee,
          created_at,
          status,
          items (title)
        `)
        .eq("owner_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10)

      // Calculate earnings
      const totalEarnings = rentals?.reduce((sum, rental) => sum + (rental.total_amount - rental.service_fee), 0) || 0

      setPayoutData({
        total_earnings: totalEarnings,
        pending_earnings: totalEarnings * 0.3, // Example calculation
        available_earnings: totalEarnings * 0.7,
        stripe_onboarding_complete: profile?.stripe_onboarding_complete || false,
        recent_rentals: rentals || [],
      })
    } catch (error) {
      console.error("Error fetching payout data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStripeOnboarding = async () => {
    setOnboardingLoading(true)

    try {
      const response = await fetch("/api/create-connect-account", {
        method: "POST",
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error starting onboarding:", error)
    } finally {
      setOnboardingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Payouts</h1>
        <p className="text-gray-600">Manage your earnings and payout settings</p>
      </div>

      {!payoutData?.stripe_onboarding_complete && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Complete your Stripe onboarding to start receiving payouts.
            <Button
              onClick={handleStripeOnboarding}
              disabled={onboardingLoading}
              className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
              size="sm"
            >
              {onboardingLoading ? "Loading..." : "Complete Setup"}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Earnings Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${payoutData?.total_earnings.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-green-600">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${payoutData?.pending_earnings.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-gray-600">Processing payouts</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${payoutData?.available_earnings.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-green-600">Ready for payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-black">Recent Earnings</CardTitle>
          <CardDescription>Your latest completed rentals</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutData?.recent_rentals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No completed rentals yet.</p>
              <p className="text-sm">Start listing items to earn money!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutData?.recent_rentals.map((rental) => (
                <div key={rental.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{rental.items.title}</p>
                      <p className="text-sm text-gray-600">{new Date(rental.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +${(rental.total_amount - rental.service_fee).toFixed(2)}
                    </p>
                    <Badge className="bg-green-500 hover:bg-green-600">{rental.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
