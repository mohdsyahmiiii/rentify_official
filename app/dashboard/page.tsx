"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Package, Star, MapPin, Clock, Plus, Eye, Edit, RotateCcw, CheckCircle, AlertTriangle, MessageSquare, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"
import { createClient } from "@/lib/supabase/client"
import { MessagesList } from "@/components/messages-list"
import { DashboardRecovery } from "@/components/dashboard-recovery"
import { ReviewForm } from "@/components/review-form"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

// Define types for our data
type Item = {
  id: string
  title: string
  price_per_day: number
  images: string[]
  is_available: boolean
  status: string
  views_count: number
  location: string
  created_at: string
  categories?: {
    name: string
  }
}

type Rental = {
  id: string
  status: string
  price_per_day: number
  start_date: string
  end_date: string
  total_amount: number
  total_days: number
  delivery_address: string
  created_at: string
  return_initiated_at?: string
  return_confirmed_at?: string
  actual_return_date?: string
  late_days?: number
  pickup_confirmed_at?: string
  pickup_confirmed_by?: string
  pickup_notes?: string
  items?: {
    title: string
    images: string[]
  }
  profiles?: {
    full_name: string
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const [userStats, setUserStats] = useState({
    activeRentals: 0,
    totalItems: 0,
    rating: 0,
    reviews: 0,
  })
  const [myItems, setMyItems] = useState<Item[]>([])
  const [myRentals, setMyRentals] = useState<Rental[]>([])
  const [ownerRentals, setOwnerRentals] = useState<Rental[]>([])
  const [reviewedRentals, setReviewedRentals] = useState<Set<string>>(new Set())

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    console.log('🔄 Dashboard: Starting data fetch...')

    // Set a timeout for the entire dashboard loading process
    const timeoutId = setTimeout(() => {
      console.error('⚠️ Dashboard: Loading timeout after 15 seconds')
      setAuthError('Dashboard loading is taking too long. Please refresh the page.')
      setLoading(false)
    }, 15000)

    try {
      const supabase = createClient()

      // Get the authenticated user with timeout
      console.log('🔍 Dashboard: Fetching user...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('❌ Dashboard: Authentication error:', authError)
        setAuthError('You must be logged in to view the dashboard. Please sign in.')
        setLoading(false)
        clearTimeout(timeoutId)
        return
      }

      console.log('✅ Dashboard: User authenticated:', user.id)
      setUser(user)
      const userId = user.id

      // Fetch items, renter rentals, and owner rentals in parallel for better performance
      console.log('📊 Dashboard: Fetching dashboard data in parallel...')

      const [itemsResult, rentalsResult, ownerRentalsResult] = await Promise.allSettled([
        supabase
          .from('items')
          .select(`
            *,
            categories(name)
          `)
          .eq('owner_id', userId)
          .order('created_at', { ascending: false }),

        supabase
          .from('rentals')
          .select(`
            *,
            items(title, images),
            profiles!rentals_owner_id_fkey(full_name)
          `)
          .eq('renter_id', userId)
          .order('created_at', { ascending: false }),

        supabase
          .from('rentals')
          .select(`
            *,
            items(title, images),
            profiles!rentals_renter_id_fkey(full_name)
          `)
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
      ])

      console.log('📊 Dashboard: Parallel queries completed')

      // Handle items result with better error handling
      if (itemsResult.status === 'fulfilled') {
        if (itemsResult.value.error) {
          console.error('❌ Dashboard: Error fetching items:', itemsResult.value.error)
          setMyItems([]) // Set empty array as fallback
        } else {
          console.log('✅ Dashboard: Fetched items:', itemsResult.value.data?.length || 0)
          setMyItems(itemsResult.value.data || [])

          // Calculate stats from items
          const totalItems = itemsResult.value.data?.length || 0
          setUserStats(prev => ({
            ...prev,
            totalItems
          }))
        }
      } else {
        console.error('❌ Dashboard: Items query rejected:', itemsResult.reason)
        setMyItems([])
      }

      // Handle rentals result with better error handling
      let renterActiveRentals = 0
      if (rentalsResult.status === 'fulfilled') {
        if (rentalsResult.value.error) {
          console.error('❌ Dashboard: Error fetching rentals:', rentalsResult.value.error)
          setMyRentals([])
        } else {
          console.log('✅ Dashboard: Fetched rentals:', rentalsResult.value.data?.length || 0)
          const rentals = rentalsResult.value.data || []
          setMyRentals(rentals)
          renterActiveRentals = rentals.filter(r => r.status === 'active').length
        }
      } else {
        console.error('❌ Dashboard: Rentals query rejected:', rentalsResult.reason)
        setMyRentals([])
      }

      // Handle owner rentals result with better error handling
      let ownerActiveRentals = 0
      if (ownerRentalsResult.status === 'fulfilled') {
        if (ownerRentalsResult.value.error) {
          console.error('❌ Dashboard: Error fetching owner rentals:', ownerRentalsResult.value.error)
          setOwnerRentals([])
        } else {
          console.log('✅ Dashboard: Fetched owner rentals:', ownerRentalsResult.value.data?.length || 0)
          const ownerRentals = ownerRentalsResult.value.data || []
          setOwnerRentals(ownerRentals)
          ownerActiveRentals = ownerRentals.filter(r => r.status === 'active').length
        }
      } else {
        console.error('❌ Dashboard: Owner rentals query rejected:', ownerRentalsResult.reason)
        setOwnerRentals([])
      }

      // Update stats with both renter and owner active rentals
      const totalActiveRentals = renterActiveRentals + ownerActiveRentals
      setUserStats(prev => ({
        ...prev,
        activeRentals: totalActiveRentals
      }))

      // Fetch reviewed rentals and user profile with error handling
      console.log('📊 Dashboard: Fetching additional data...')
      try {
        await fetchReviewedRentals(userId)
        console.log('✅ Dashboard: Reviewed rentals fetched')
      } catch (err) {
        console.error('❌ Dashboard: Error fetching reviewed rentals:', err)
      }

      try {
        await fetchUserProfile(userId)
        console.log('✅ Dashboard: User profile fetched')
      } catch (err) {
        console.error('❌ Dashboard: Error fetching user profile:', err)
      }

      console.log('🎉 Dashboard: All data loaded successfully')
      clearTimeout(timeoutId)
      setLoading(false)
    } catch (error) {
      console.error('❌ Dashboard: Critical error fetching dashboard data:', error)
      setAuthError('Failed to load dashboard data. Please refresh the page.')
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  const fetchReviewedRentals = async (userId: string) => {
    try {
      const supabase = createClient()
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rental_id')
        .eq('reviewer_id', userId)

      if (reviews) {
        const reviewedSet = new Set(reviews.map(review => review.rental_id))
        setReviewedRentals(reviewedSet)
      }
    } catch (error) {
      console.error('Error fetching reviewed rentals:', error)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('rating, total_reviews')
        .eq('id', userId)
        .single()

      if (profile) {
        setUserStats(prev => ({
          ...prev,
          rating: profile.rating || 0,
          reviews: profile.total_reviews || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const toggleItemAvailability = async (itemId: string, newAvailability: boolean) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('items')
        .update({
          is_available: newAvailability,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) {
        console.error('Error updating item availability:', error)
        return
      }

      // Refresh dashboard data to show updated availability
      fetchDashboardData()
    } catch (error) {
      console.error('Error toggling item availability:', error)
    }
  }

  const handleReturnAction = async (rentalId: string, action: 'initiate' | 'confirm' | 'confirm_pickup', options?: any) => {
    // Set loading state for this specific action
    setActionLoading(`${action}-${rentalId}`)

    try {
      const supabase = createClient()

      if (action === 'initiate') {
        const response = await fetch('/api/initiate-return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rentalId })
        })

        const data = await response.json()
        if (data.success) {
          // Show success toast
          toast({
            title: "Return Initiated",
            description: "Return process has been started successfully.",
          })
          // Refresh dashboard data
          fetchDashboardData()
        } else {
          console.error('Failed to initiate return:', data.error)
          toast({
            title: "Error",
            description: "Failed to initiate return. Please try again.",
            variant: "destructive",
          })
        }
      } else if (action === 'confirm') {
        const response = await fetch('/api/confirm-return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rentalId,
            damageReported: options?.damageReported || false,
            damageDescription: options?.damageDescription || '',
            securityDepositDeduction: options?.securityDepositDeduction || 0,
            securityDepositReason: options?.securityDepositReason || ''
          })
        })

        const data = await response.json()
        if (data.success) {
          // Show success toast
          toast({
            title: "Return Confirmed",
            description: "Item return has been confirmed successfully.",
          })
          // Refresh dashboard data
          fetchDashboardData()
        } else {
          console.error('Failed to confirm return:', data.error)
          toast({
            title: "Error",
            description: "Failed to confirm return. Please try again.",
            variant: "destructive",
          })
        }
      } else if (action === 'confirm_pickup') {
        const response = await fetch('/api/confirm-pickup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rentalId,
            pickupNotes: options?.pickupNotes || ''
          })
        })

        const data = await response.json()
        if (data.success) {
          // Show success toast
          toast({
            title: "Item Received",
            description: "You have successfully confirmed receiving the item. Your rental is now active!",
          })
          // Refresh dashboard data
          fetchDashboardData()
        } else {
          console.error('Failed to confirm pickup:', data.error)
          toast({
            title: "Error",
            description: "Failed to confirm pickup. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Return action error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear loading state
      setActionLoading(null)
    }
  }

  // Show dashboard recovery component for loading states and errors
  if (loading || authError) {
    return (
      <DashboardRecovery
        loading={loading}
        error={authError}
        onRetry={fetchDashboardData}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your rentals.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Rentals</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{userStats.activeRentals}</div>
              <p className="text-xs text-gray-600">Items currently rented</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">My Items</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{userStats.totalItems}</div>
              <p className="text-xs text-gray-600">Items listed</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{userStats.rating}</div>
              <p className="text-xs text-gray-600">{userStats.reviews} reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="my-items" className="data-[state=active]:bg-black data-[state=active]:text-white">
              My Items
            </TabsTrigger>
            <TabsTrigger value="my-rentals" className="data-[state=active]:bg-black data-[state=active]:text-white">
              My Rentals
            </TabsTrigger>
            <TabsTrigger value="items-being-rented" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Items Being Rented
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-black">Recent Activity</CardTitle>
                  <CardDescription>Your latest rental activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myItems.length === 0 && myRentals.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No recent activity</p>
                      <p className="text-sm text-gray-500">Start by listing an item or browsing rentals!</p>
                    </div>
                  ) : (
                    <>
                      {myItems.slice(0, 2).map((item) => (
                        <div key={`item-${item.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-black">Listed item: {item.title}</p>
                            <p className="text-sm text-gray-600">Category: {item.categories?.name || 'Uncategorized'}</p>
                            <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="font-bold text-blue-600">
                            {formatCurrency(item.price_per_day)}/day
                          </div>
                        </div>
                      ))}
                      {myRentals.slice(0, 1).map((rental) => (
                        <div key={`rental-${rental.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-black">Rented: {rental.items?.title}</p>
                            <p className="text-sm text-gray-600">Status: {rental.status}</p>
                            <p className="text-xs text-gray-500">{new Date(rental.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(rental.total_amount)}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-black">Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start bg-black text-white hover:bg-gray-800">
                    <Link href="/list-item">
                      <Plus className="w-4 h-4 mr-2" />
                      List a New Item
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start border-black hover:bg-black hover:text-white"
                  >
                    <Link href="/items">
                      <Package className="w-4 h-4 mr-2" />
                      Browse Items to Rent
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start border-black hover:bg-black hover:text-white"
                  >
                    <Link href="/profile">
                      <Star className="w-4 h-4 mr-2" />
                      Update Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-items" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">My Listed Items</h2>
              <Button asChild className="bg-black text-white hover:bg-gray-800">
                <Link href="/list-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Item
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myItems.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items listed yet</h3>
                  <p className="text-gray-600 mb-4">Start earning by listing your first item!</p>
                  <Button asChild className="bg-black text-white hover:bg-gray-800">
                    <Link href="/list-item">
                      <Plus className="w-4 h-4 mr-2" />
                      List Your First Item
                    </Link>
                  </Button>
                </div>
              ) : (
                myItems.map((item) => (
                  <Card key={item.id} className="border-2 hover:border-black transition-colors">
                    <div className="relative">
                      <Image
                        src={item.images?.[0] || "/placeholder.svg"}
                        alt={item.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge
                        className={`absolute top-2 right-2 ${
                          item.is_available
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-black">{item.title}</CardTitle>
                      <CardDescription>{item.categories?.name || 'Uncategorized'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-black">{formatCurrency(item.price_per_day)}/day</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Status: {item.status}</p>
                        <p className="text-sm text-gray-600">Views: {item.views_count || 0}</p>
                        <p className="text-sm text-gray-600">Location: {item.location}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-black hover:bg-black hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-black hover:bg-black hover:text-white"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant={item.is_available ? "outline" : "default"}
                          className={`w-full ${
                            item.is_available
                              ? "border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                          onClick={() => toggleItemAvailability(item.id, !item.is_available)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          {item.is_available ? "Block Dates" : "Make Available"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-rentals" className="space-y-6">
            <h2 className="text-2xl font-bold text-black">My Rentals</h2>

            <div className="space-y-4">
              {myRentals.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rentals yet</h3>
                  <p className="text-gray-600 mb-4">Browse items to start renting!</p>
                  <Button asChild variant="outline" className="border-black hover:bg-black hover:text-white">
                    <Link href="/items">
                      <Package className="w-4 h-4 mr-2" />
                      Browse Items
                    </Link>
                  </Button>
                </div>
              ) : (
                myRentals.map((rental) => (
                  <Card key={rental.id} className="border-2 hover:border-black transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Image
                          src={rental.items?.images?.[0] || "/placeholder.svg"}
                          alt={rental.items?.title || "Rental item"}
                          width={100}
                          height={100}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-black">{rental.items?.title || "Unknown Item"}</h3>
                              <p className="text-gray-600">Owner: {rental.profiles?.full_name || "Unknown"}</p>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {rental.delivery_address || "Pickup location"}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={
                                  rental.status === "active"
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : rental.status === "completed"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : rental.status === "pending_pickup"
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                }
                              >
                                {rental.status === "pending_pickup" ? "Pending Pickup" : rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                              </Badge>
                              <p className="text-lg font-bold text-black mt-1">{formatCurrency(rental.price_per_day)}/day</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>From: {rental.start_date}</span>
                            <span>Until: {rental.end_date}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span>Total: {formatCurrency(rental.total_amount)} ({rental.total_days} days)</span>
                          </div>

                          {/* Return Process Actions */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <ReturnActions
                              rental={rental}
                              onReturnAction={handleReturnAction}
                              reviewedRentals={reviewedRentals}
                              onReviewSubmitted={(rentalId) => {
                                setReviewedRentals(prev => new Set([...prev, rentalId]))
                              }}
                              actionLoading={actionLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="items-being-rented" className="space-y-6">
            <h2 className="text-2xl font-bold text-black">Items Being Rented</h2>

            <div className="space-y-4">
              {ownerRentals.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items being rented</h3>
                  <p className="text-gray-600 mb-4">List items to start earning from rentals!</p>
                  <Button asChild variant="outline" className="border-black hover:bg-black hover:text-white">
                    <Link href="/list-item">
                      <Plus className="w-4 h-4 mr-2" />
                      List an Item
                    </Link>
                  </Button>
                </div>
              ) : (
                ownerRentals.map((rental) => (
                  <Card key={rental.id} className="border-2 hover:border-black transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Image
                          src={rental.items?.images?.[0] || "/placeholder.svg"}
                          alt={rental.items?.title || "Rental item"}
                          width={100}
                          height={100}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-black">{rental.items?.title || "Unknown Item"}</h3>
                              <p className="text-gray-600">Renter: {rental.profiles?.full_name || "Unknown"}</p>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {rental.delivery_address || "Pickup location"}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={
                                  rental.status === "active"
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : rental.status === "completed"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : rental.status === "pending_pickup"
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                }
                              >
                                {rental.status === "pending_pickup" ? "Pending Pickup" : rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                              </Badge>
                              <p className="text-lg font-bold text-black mt-1">{formatCurrency(rental.price_per_day)}/day</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>From: {rental.start_date}</span>
                            <span>Until: {rental.end_date}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span>Total: {formatCurrency(rental.total_amount)} ({rental.total_days} days)</span>
                          </div>

                          {/* Owner Return Process Actions */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <OwnerReturnActions
                              rental={rental}
                              onReturnAction={handleReturnAction}
                              reviewedRentals={reviewedRentals}
                              onReviewSubmitted={(rentalId) => {
                                setReviewedRentals(prev => new Set([...prev, rentalId]))
                              }}
                              actionLoading={actionLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <h2 className="text-2xl font-bold text-black">Messages</h2>
            <MessagesList user={user} />
          </TabsContent>


        </Tabs>
      </div>
    </div>
  )
}

// Owner Return Actions Component
function OwnerReturnActions({ rental, onReturnAction, reviewedRentals, onReviewSubmitted, actionLoading }: {
  rental: Rental,
  onReturnAction: (rentalId: string, action: 'initiate' | 'confirm' | 'confirm_pickup', options?: any) => void,
  reviewedRentals: Set<string>,
  onReviewSubmitted: (rentalId: string) => void,
  actionLoading: string | null
}) {
  const today = new Date().toISOString().split('T')[0]
  const endDate = new Date(rental.end_date)
  const todayDate = new Date(today)
  const isOverdue = todayDate > endDate
  const lateDays = isOverdue ? Math.floor((todayDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  // Check return status
  const returnInitiated = rental.return_initiated_at
  const returnConfirmed = rental.return_confirmed_at
  const isActive = rental.status === 'active'
  const isCompleted = rental.status === 'completed'
  const isPendingPickup = rental.status === 'pending_pickup'

  // Handle pending pickup status - show waiting message for owners
  if (isPendingPickup) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-orange-600 mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Waiting for Renter Pickup</span>
        </div>
        <p className="text-xs text-gray-600">
          The renter has paid and will confirm when they receive the item. The rental will become active once they confirm pickup.
        </p>
      </div>
    )
  }

  if (isCompleted) {
    const hasReviewed = reviewedRentals.has(rental.id)

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Rental Completed</span>
          {rental.actual_return_date && (
            <span className="text-xs text-gray-500">
              Returned on {rental.actual_return_date}
            </span>
          )}
        </div>

        {!hasReviewed && (
          <ReviewForm
            rentalId={rental.id}
            itemTitle={rental.items?.title || "Item"}
            revieweeName={rental.profiles?.full_name || "Renter"}
            isOwner={true}
            onReviewSubmitted={() => onReviewSubmitted(rental.id)}
          />
        )}

        {hasReviewed && (
          <div className="flex items-center space-x-1 text-gray-600">
            <MessageSquare className="w-3 h-3" />
            <span className="text-xs">Review submitted</span>
          </div>
        )}
      </div>
    )
  }

  if (!isActive && !isPendingPickup) {
    return null // Don't show return actions for non-active/non-pending-pickup rentals
  }

  if (returnInitiated && !returnConfirmed) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-orange-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Return Confirmation Required</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          The renter has initiated the return process. Please confirm when you receive the item.
        </p>

        <Button
          size="sm"
          onClick={() => onReturnAction(rental.id, 'confirm')}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={actionLoading === `confirm-${rental.id}`}
        >
          {actionLoading === `confirm-${rental.id}` ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {actionLoading === `confirm-${rental.id}` ? 'Confirming...' : 'Confirm Item Received'}
        </Button>

        {isOverdue && lateDays > 0 && (
          <div className="flex items-center space-x-1 text-red-600 mt-2">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Item was {lateDays} day{lateDays > 1 ? 's' : ''} late</span>
          </div>
        )}
      </div>
    )
  }

  // Show status for active rentals where return hasn't been initiated
  return (
    <div className="space-y-2">
      {isOverdue ? (
        <div className="flex items-center space-x-1 text-red-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Overdue by {lateDays} day{lateDays > 1 ? 's' : ''}
          </span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-blue-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Active Rental</span>
        </div>
      )}

      <p className="text-xs text-gray-600">
        {isOverdue
          ? 'Waiting for renter to initiate return process'
          : `Due back on ${rental.end_date}`
        }
      </p>
    </div>
  )
}

// Return Actions Component (for renters)
function ReturnActions({ rental, onReturnAction, reviewedRentals, onReviewSubmitted, actionLoading }: {
  rental: Rental,
  onReturnAction: (rentalId: string, action: 'initiate' | 'confirm' | 'confirm_pickup', options?: any) => void,
  reviewedRentals: Set<string>,
  onReviewSubmitted: (rentalId: string) => void,
  actionLoading: string | null
}) {
  const today = new Date().toISOString().split('T')[0]
  const endDate = new Date(rental.end_date)
  const todayDate = new Date(today)
  const isOverdue = todayDate > endDate
  const lateDays = isOverdue ? Math.floor((todayDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  // Check return status
  const returnInitiated = rental.return_initiated_at
  const returnConfirmed = rental.return_confirmed_at
  const isActive = rental.status === 'active'
  const isCompleted = rental.status === 'completed'
  const isPendingPickup = rental.status === 'pending_pickup'

  // Handle pending pickup status - show pickup confirmation button
  if (isPendingPickup) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-orange-600 mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Waiting for Item Pickup</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Please confirm when you have received the item to start your rental period.
        </p>

        <Button
          size="sm"
          onClick={() => onReturnAction(rental.id, 'confirm_pickup')}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={actionLoading === `confirm_pickup-${rental.id}`}
        >
          {actionLoading === `confirm_pickup-${rental.id}` ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {actionLoading === `confirm_pickup-${rental.id}` ? 'Confirming...' : 'Confirm Item Received'}
        </Button>

        <p className="text-xs text-gray-600">
          Your rental period will officially start once you confirm receipt.
        </p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Rental Completed</span>
        {rental.actual_return_date && (
          <span className="text-xs text-gray-500">
            Returned on {rental.actual_return_date}
          </span>
        )}
      </div>
    )
  }

  if (!isActive && !isPendingPickup) {
    return null // Don't show return actions for non-active/non-pending-pickup rentals
  }

  if (returnInitiated && !returnConfirmed) {
    const hasReviewed = reviewedRentals.has(rental.id)

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-blue-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Return Initiated</span>
        </div>
        <p className="text-xs text-gray-600">
          Waiting for owner to confirm item return
        </p>
        {isOverdue && lateDays > 0 && (
          <div className="flex items-center space-x-1 text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Late by {lateDays} day{lateDays > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Renter can review owner after initiating return */}
        {!hasReviewed && (
          <ReviewForm
            rentalId={rental.id}
            itemTitle={rental.items?.title || "Item"}
            revieweeName={rental.profiles?.full_name || "Owner"}
            isOwner={false}
            onReviewSubmitted={() => onReviewSubmitted(rental.id)}
          />
        )}

        {hasReviewed && (
          <div className="flex items-center space-x-1 text-gray-600">
            <MessageSquare className="w-3 h-3" />
            <span className="text-xs">Review submitted</span>
          </div>
        )}
      </div>
    )
  }

  // Show initiate return button for active rentals
  return (
    <div className="space-y-2">
      {isOverdue && (
        <div className="flex items-center space-x-1 text-red-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Overdue by {lateDays} day{lateDays > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <Button
        size="sm"
        onClick={() => onReturnAction(rental.id, 'initiate')}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        disabled={actionLoading === `initiate-${rental.id}`}
      >
        {actionLoading === `initiate-${rental.id}` ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4 mr-2" />
        )}
        {actionLoading === `initiate-${rental.id}`
          ? 'Processing...'
          : (isOverdue ? 'Return Now (Late)' : 'Initiate Return')
        }
      </Button>

      <p className="text-xs text-gray-600">
        {isOverdue
          ? 'Return this item as soon as possible to avoid additional late fees'
          : `Return by ${rental.end_date}`
        }
      </p>
    </div>
  )
}
