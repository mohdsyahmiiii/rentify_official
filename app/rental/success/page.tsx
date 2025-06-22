"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, MapPin, User } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface RentalDetails {
  id: string
  start_date: string
  end_date: string
  total_amount: number
  items: {
    title: string
    images: string[]
  }
  profiles: {
    full_name: string
    location: string
  }
}

export default function RentalSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [rental, setRental] = useState<RentalDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRentalDetails = async () => {
      if (!sessionId) return

      try {
        const supabase = createClient()

        // Get rental details by session ID
        const { data, error } = await supabase
          .from("rentals")
          .select(`
            id,
            start_date,
            end_date,
            total_amount,
            items (
              title,
              images
            ),
            profiles!rentals_owner_id_fkey (
              full_name,
              location
            )
          `)
          .eq("stripe_session_id", sessionId)
          .single()

        if (error) throw error
        setRental(data)
      } catch (error) {
        console.error("Error fetching rental:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRentalDetails()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rental details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-black">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Your rental has been confirmed and the owner has been notified.
          </CardDescription>
        </CardHeader>

        {rental && (
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-black mb-4">Rental Details</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📦</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">{rental.items.title}</p>
                    <p className="text-sm text-gray-600">Item rented</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-black">
                      {new Date(rental.start_date).toLocaleDateString()} -{" "}
                      {new Date(rental.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Rental period</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-black">{rental.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">Item owner</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-black">{rental.profiles.location}</p>
                    <p className="text-sm text-gray-600">Pickup location</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black text-white p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Paid</span>
                <span className="text-2xl font-bold">${rental.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-black text-white hover:bg-gray-800" size="lg">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-black hover:bg-black hover:text-white">
                <Link href={`/rental/${rental.id}`}>View Rental Details</Link>
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>You'll receive an email confirmation shortly.</p>
              <p>The owner will contact you to arrange pickup details.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
