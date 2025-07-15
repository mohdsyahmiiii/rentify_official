"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, DollarSign, Package, Star, MapPin, Clock, Plus, Eye, Edit, RotateCcw, CheckCircle, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"
import { createClient } from "@/lib/supabase/client"
import { MessagesList } from "@/components/messages-list"
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
  const [userStats, setUserStats] = useState({
    totalEarnings: 0,
    activeRentals: 0,
    totalItems: 0,
    rating: 0,
    reviews: 0,
  })
  const [myItems, setMyItems] = useState<Item[]>([])
  const [myRentals, setMyRentals] = useState<Rental[]>([])
  const [ownerRentals, setOwnerRentals] = useState<Rental[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()

      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Authentication error:', authError)
        setAuthError('You must be logged in to view the dashboard. Please sign in.')
        setLoading(false)
        return
      }

      setUser(user)
      const userId = user.id

      // Fetch items, renter rentals, and owner rentals in parallel for better performance
      const [itemsResult, rentalsResult, ownerRentalsResult] = await Promise.all([
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

      // Handle items result
      if (itemsResult.error) {
        console.error('Error fetching items:', itemsResult.error)
      } else {
        console.log('Fetched items:', itemsResult.data)
        setMyItems(itemsResult.data || [])

        // Calculate stats from items
        const totalItems = itemsResult.data?.length || 0
        setUserStats(prev => ({
          ...prev,
          totalItems
        }))
      }

      // Handle rentals result
      if (rentalsResult.error) {
        console.error('Error fetching rentals:', rentalsResult.error)
      } else {
        console.log('Fetched rentals:', rentalsResult.data)
        setMyRentals(rentalsResult.data || [])
      }

      // Handle owner rentals result
      if (ownerRentalsResult.error) {
        console.error('Error fetching owner rentals:', ownerRentalsResult.error)
      } else {
        console.log('Fetched owner rentals:', ownerRentalsResult.data)
        setOwnerRentals(ownerRentalsResult.data || [])

        // Update stats to include both renter and owner active rentals
        const renterActiveRentals = (rentalsResult.data || []).filter(r => r.status === 'active').length
        const ownerActiveRentals = (ownerRentalsResult.data || []).filter(r => r.status === 'active').length
        const totalActiveRentals = renterActiveRentals + ownerActiveRentals

        setUserStats(prev => ({
          ...prev,
          activeRentals: totalActiveRentals
        }))
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const handleReturnAction = async (rentalId: string, action: 'initiate' | 'confirm', options?: any) => {
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
          // Refresh dashboard data
          fetchDashboardData()
        } else {
          console.error('Failed to initiate return:', data.error)
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
          // Refresh dashboard data
          fetchDashboardData()
        } else {
          console.error('Failed to confirm return:', data.error)
        }
      }
    } catch (error) {
      console.error('Return action error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Authentication Required</p>
            <p className="text-sm">{authError}</p>
          </div>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{formatCurrency(userStats.totalEarnings)}</div>
              <p className="text-xs text-green-600">+12% from last month</p>
            </CardContent>
          </Card>

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

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{formatCurrency(320)}</div>
              <p className="text-xs text-green-600">+8% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border-2">
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
            <TabsTrigger value="transactions" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Transactions
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
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                }
                              >
                                {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
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
                            <ReturnActions rental={rental} onReturnAction={handleReturnAction} />
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
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                }
                              >
                                {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
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
                            <OwnerReturnActions rental={rental} onReturnAction={handleReturnAction} />
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

          <TabsContent value="transactions" className="space-y-6">
            <h2 className="text-2xl font-bold text-black">Transaction History</h2>

            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600">Your transaction history will appear here once you start renting or earning from your items.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Owner Return Actions Component
function OwnerReturnActions({ rental, onReturnAction }: {
  rental: Rental,
  onReturnAction: (rentalId: string, action: 'initiate' | 'confirm', options?: any) => void
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

  if (!isActive) {
    return null // Don't show return actions for non-active rentals
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
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Item Received
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
function ReturnActions({ rental, onReturnAction }: {
  rental: Rental,
  onReturnAction: (rentalId: string, action: 'initiate' | 'confirm', options?: any) => void
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

  if (!isActive) {
    return null // Don't show return actions for non-active rentals
  }

  if (returnInitiated && !returnConfirmed) {
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
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        {isOverdue ? 'Return Now (Late)' : 'Initiate Return'}
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
