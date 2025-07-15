"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Shield, Heart, Share2, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils/currency"
import { ChatModal } from "@/components/chat-modal"
import { ReviewDisplay } from "@/components/review-display"
import type { User } from "@supabase/supabase-js"

// Type definitions
type ItemData = {
  id: string | number
  name: string
  description: string
  longDescription: string
  price: number
  category: string
  owner: {
    name: string
    avatar: string
    rating: number
    reviews: number
    joinDate: string
    responseTime: string
    verified: boolean
  }
  rating: number
  reviews: number
  location: string
  images: string[]
  features: string[]
  availability: {
    available: boolean
    nextAvailable?: string
  }
  policies: {
    cancellation: string
    damage: string
    lateFee: string
  }
}



export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [itemData, setItemData] = useState<ItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [ownerId, setOwnerId] = useState<string>("")
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  // Unwrap the params Promise
  const resolvedParams = use(params)

  useEffect(() => {
    fetchItemData()
    fetchReviewStats()
  }, [resolvedParams.id])

  // Update itemData when reviewStats change
  useEffect(() => {
    if (itemData) {
      setItemData(prev => prev ? {
        ...prev,
        rating: reviewStats.averageRating,
        reviews: reviewStats.totalReviews,
      } : null)
    }
  }, [reviewStats])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const fetchItemData = async () => {
    try {
      setError(null)
      setLoading(true)

      const supabase = createClient()

      const { data: item, error: dbError } = await supabase
        .from('items')
        .select(`
          *,
          categories(name),
          profiles(full_name)
        `)
        .eq('id', resolvedParams.id)
        .single()

      if (dbError || !item) {
        setError('Item not found')
        return
      }

      // Transform database item to match expected format
      const transformedItem: ItemData = {
        id: item.id,
        name: item.title,
        description: item.description,
        longDescription: item.long_description || item.description,
        price: item.price_per_day,
        category: item.categories?.name || 'Other',
        owner: {
          name: item.profiles?.full_name || 'Unknown',
          avatar: item.profiles?.avatar_url || '/placeholder-user.jpg',
          rating: item.profiles?.rating || 0,
          reviews: item.profiles?.total_reviews || 0,
          joinDate: item.profiles?.created_at ? new Date(item.profiles.created_at).getFullYear().toString() : '2024',
          responseTime: 'within a few hours',
          verified: true,
        },
        rating: reviewStats.averageRating,
        reviews: reviewStats.totalReviews,
        location: item.location,
        images: item.images || ['/placeholder.svg?height=400&width=600'],
        features: item.features || ['High Quality', 'Well Maintained', 'Ready to Use'],
        availability: {
          available: item.is_available,
          nextAvailable: item.is_available ? undefined : null,
        },
        policies: {
          cancellation: item.cancellation_policy || 'Free cancellation up to 24 hours before pickup',
          damage: item.damage_policy || 'Damage protection included',
          lateFee: `$${item.late_fee_per_day || 10} per day for late returns`,
        },
      }

      // Get real availability status
      const { data: availabilityData } = await supabase
        .from('item_availability')
        .select('base_available, next_available_date')
        .eq('item_id', item.id)
        .single()

      // Update availability in transformed item
      transformedItem.availability = {
        available: availabilityData?.base_available || false,
        nextAvailable: availabilityData?.next_available_date || null,
      }

      setItemData(transformedItem)
      setOwnerId(item.owner_id)
    } catch (err) {
      console.error('Error fetching item:', err)
      setError('Failed to load item')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewStats = async () => {
    try {
      const response = await fetch(`/api/reviews/stats?item_id=${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setReviewStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching review stats:', err)
    }
  }

  const nextImage = () => {
    if (itemData) {
      setCurrentImageIndex((prev) => (prev + 1) % itemData.images.length)
    }
  }

  const prevImage = () => {
    if (itemData) {
      setCurrentImageIndex((prev) => (prev - 1 + itemData.images.length) % itemData.images.length)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading item details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !itemData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Item Not Found</p>
            <p className="text-sm">{error || 'The requested item could not be found.'}</p>
          </div>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link href="/items">
              Back to Items
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6 hover:bg-gray-100">
          <Link href="/items">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <Image
                src={itemData.images[currentImageIndex] || "/placeholder.svg"}
                alt={itemData.name}
                width={600}
                height={400}
                className="w-full h-96 object-cover rounded-lg"
              />
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {itemData.images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {itemData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative rounded-lg overflow-hidden ${
                    index === currentImageIndex ? "ring-2 ring-black" : ""
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${itemData.name} ${index + 1}`}
                    width={150}
                    height={100}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-gray-100 text-black hover:bg-gray-200">{itemData.category}</Badge>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="hover:bg-gray-100"
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </Button>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-black mb-2">{itemData.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium text-black">{itemData.rating}</span>
                  <span className="ml-1 text-gray-600">({itemData.reviews} reviews)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {itemData.location}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{itemData.description}</p>
            </div>

            {/* Pricing */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-black">{formatCurrency(itemData.price)}</div>
                    <div className="text-gray-600">per day</div>
                  </div>
                  <Badge className={itemData.availability.available ? "bg-green-500" : "bg-red-500"}>
                    {itemData.availability.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                {itemData.availability.available ? (
                  <div className="space-y-3">
                    <Button asChild className="w-full bg-black text-white hover:bg-gray-800" size="lg">
                      <Link href={`/checkout?item=${resolvedParams.id}`}>Rent Now</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-black hover:bg-black hover:text-white"
                      onClick={() => setIsChatOpen(true)}
                      disabled={!user || user.id === ownerId}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Owner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button disabled className="w-full" size="lg">
                      Currently Unavailable
                    </Button>
                    {itemData.availability.nextAvailable && (
                      <p className="text-sm text-gray-600 text-center">
                        Next available: {new Date(itemData.availability.nextAvailable).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 border-2">
                    <AvatarImage src={itemData.owner.avatar || "/placeholder.svg"} alt={itemData.owner.name} />
                    <AvatarFallback className="bg-black text-white text-lg">
                      {itemData.owner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-black">{itemData.owner.name}</h3>
                      {itemData.owner.verified && <Shield className="w-4 h-4 text-green-600" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="details" className="data-[state=active]:bg-white">
              Details
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-white">
              Features
            </TabsTrigger>
            <TabsTrigger value="policies" className="data-[state=active]:bg-white">
              Policies
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white">
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-black">Item Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{itemData.longDescription}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-black">Features & Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  {itemData.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-black">Rental Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-black mb-2">Cancellation Policy</h4>
                  <p className="text-gray-700">{itemData.policies.cancellation}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-black mb-2">Damage Protection</h4>
                  <p className="text-gray-700">{itemData.policies.damage}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-black mb-2">Late Return Fee</h4>
                  <p className="text-gray-700">{itemData.policies.lateFee}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewDisplay itemId={resolvedParams.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Modal */}
      {itemData && ownerId && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientId={ownerId}
          recipientName={itemData.owner.name}
          itemId={resolvedParams.id}
          itemTitle={itemData.name}
        />
      )}
    </div>
  )
}
