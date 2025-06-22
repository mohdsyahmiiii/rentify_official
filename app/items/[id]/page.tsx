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

// Demo items data (keeping for demo purposes)
const demoItems: Record<string, ItemData> = {
  "1": {
  id: 1,
  name: "Professional DSLR Camera",
  description:
    "Canon EOS 5D Mark IV with 24-70mm lens, perfect for professional photography and videography. This camera has been well-maintained and comes with all original accessories including battery, charger, and camera bag.",
  longDescription:
    "This professional-grade DSLR camera is perfect for photographers of all skill levels. The Canon EOS 5D Mark IV features a 30.4MP full-frame CMOS sensor, DIGIC 6+ image processor, and 4K video recording capabilities. The included 24-70mm f/2.8L lens is ideal for portraits, landscapes, and general photography. The camera has been professionally serviced and is in excellent condition.",
  price: 25,
  category: "Electronics",
  owner: {
    name: "John D.",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    reviews: 47,
    joinDate: "2022",
    responseTime: "within an hour",
    verified: true,
  },
  rating: 4.8,
  reviews: 124,
  location: "New York, NY",
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  features: [
    "30.4MP Full-Frame CMOS Sensor",
    "4K Video Recording",
    "Dual Pixel CMOS AF",
    "Built-in Wi-Fi and GPS",
    "Weather Sealed Body",
    "Includes 24-70mm f/2.8L Lens",
  ],
  availability: {
    available: true,
    nextAvailable: "2024-01-15",
  },
  policies: {
    cancellation: "Free cancellation up to 24 hours before pickup",
    damage: "Damage protection included",
    lateFee: "$10 per day for late returns",
  },
  },
  "2": {
    id: 2,
    name: "Mountain Bike",
    description: "Trek Mountain Bike, perfect for trails and outdoor adventures.",
    longDescription: "This high-quality mountain bike is perfect for trail riding and outdoor adventures. Features a lightweight aluminum frame, 21-speed transmission, and front suspension for a smooth ride on any terrain.",
    price: 15 * 4.7,
    category: "Sports",
    owner: {
      name: "Sarah M.",
      avatar: "/placeholder-user.jpg",
      rating: 4.9,
      reviews: 32,
      joinDate: "2023",
      responseTime: "within 2 hours",
      verified: true,
    },
    rating: 4.9,
    reviews: 89,
    location: "Penang",
    images: ["/placeholder.svg?height=400&width=600", "/placeholder.svg?height=400&width=600"],
    features: ["Lightweight Aluminum Frame", "21-Speed Transmission", "Front Suspension", "All-Terrain Tires"],
    availability: { available: true },
    policies: {
      cancellation: "Free cancellation up to 12 hours before pickup",
      damage: "Damage protection included",
      lateFee: "$5 per day for late returns",
    },
  },
  "3": {
    id: 3,
    name: "Power Drill Set",
    description: "Complete power drill set with bits and accessories.",
    longDescription: "Professional-grade power drill set perfect for home improvement projects. Includes various drill bits, screwdriver attachments, and a carrying case.",
    price: 12 * 4.7,
    category: "Tools",
    owner: {
      name: "Mike R.",
      avatar: "/placeholder-user.jpg",
      rating: 4.7,
      reviews: 28,
      joinDate: "2022",
      responseTime: "within 4 hours",
      verified: true,
    },
    rating: 4.7,
    reviews: 156,
    location: "Johor Bahru",
    images: ["/placeholder.svg?height=400&width=600"],
    features: ["18V Battery", "Multiple Drill Bits", "LED Light", "Carrying Case"],
    availability: { available: false, nextAvailable: "2024-01-20" },
    policies: {
      cancellation: "Free cancellation up to 24 hours before pickup",
      damage: "Damage protection included",
      lateFee: "$8 per day for late returns",
    },
  },
}

const reviews = [
  {
    id: 1,
    user: "Alice Johnson",
    avatar: "/placeholder-user.jpg",
    rating: 5,
    date: "2024-01-05",
    comment: "Amazing camera! John was very helpful and the equipment was in perfect condition. Highly recommend!",
  },
  {
    id: 2,
    user: "Mike Wilson",
    avatar: "/placeholder-user.jpg",
    rating: 5,
    date: "2024-01-02",
    comment:
      "Great experience renting from John. The camera worked perfectly for my wedding shoot. Will definitely rent again!",
  },
  {
    id: 3,
    user: "Sarah Brown",
    avatar: "/placeholder-user.jpg",
    rating: 4,
    date: "2023-12-28",
    comment: "Good quality camera, exactly as described. Pickup and return process was smooth.",
  },
]

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [itemData, setItemData] = useState<ItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Unwrap the params Promise
  const resolvedParams = use(params)

  useEffect(() => {
    fetchItemData()
  }, [resolvedParams.id])

  const fetchItemData = async () => {
    try {
      setError(null)

      // Check if it's a real item (prefixed with "real-") or demo item
      if (resolvedParams.id.startsWith('real-')) {
        // Only show loading for real items that need database fetch
        setLoading(true)
        // Fetch real item from database
        const realItemId = resolvedParams.id.replace('real-', '')
        const supabase = createClient()

        const { data: item, error: dbError } = await supabase
          .from('items')
          .select(`
            *,
            categories(name),
            profiles(full_name)
          `)
          .eq('id', realItemId)
          .single()

        if (dbError || !item) {
          setError('Item not found')
          return
        }

        // Transform database item to match expected format
        const transformedItem: ItemData = {
          id: resolvedParams.id,
          name: item.title,
          description: item.description,
          longDescription: item.description, // Use same description for now
          price: item.price_per_day,
          category: item.categories?.name || 'Other',
          owner: {
            name: item.profiles?.full_name || 'Unknown',
            avatar: '/placeholder-user.jpg',
            rating: 4.8, // Default values for now
            reviews: 15,
            joinDate: '2024',
            responseTime: 'within a few hours',
            verified: true,
          },
          rating: item.rating || 4.5,
          reviews: item.total_reviews || 0,
          location: item.location,
          images: item.images || ['/placeholder.svg?height=400&width=600'],
          features: item.features || ['High Quality', 'Well Maintained', 'Ready to Use'],
          availability: {
            available: item.is_available,
            nextAvailable: item.is_available ? undefined : '2024-01-25',
          },
          policies: {
            cancellation: 'Free cancellation up to 24 hours before pickup',
            damage: 'Damage protection included',
            lateFee: '$10 per day for late returns',
          },
        }

        setItemData(transformedItem)
        setLoading(false) // Only set loading false after database fetch
      } else {
        // Use demo item data - no loading needed
        const demoItem = demoItems[resolvedParams.id]
        if (demoItem) {
          setItemData(demoItem)
          setLoading(false) // Immediate for demo items
        } else {
          setError('Demo item not found')
          setLoading(false)
        }
      }
    } catch (err) {
      console.error('Error fetching item:', err)
      setError('Failed to load item')
      setLoading(false)
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
                    <div className="text-3xl font-bold text-black">{formatCurrency(itemData.price, "MYR")}</div>
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
                    <Button variant="outline" className="w-full border-black hover:bg-black hover:text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Owner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button disabled className="w-full" size="lg">
                      Currently Unavailable
                    </Button>
                    <p className="text-sm text-gray-600 text-center">
                      Next available: {itemData.availability.nextAvailable}
                    </p>
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
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-black">{itemData.owner.name}</h3>
                      {itemData.owner.verified && <Shield className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {itemData.owner.rating} ({itemData.owner.reviews} reviews)
                      </div>
                      <span>Joined {itemData.owner.joinDate}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Typically responds {itemData.owner.responseTime}</p>
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
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-black">Reviews ({itemData.reviews})</CardTitle>
                <CardDescription>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-black">{itemData.rating} out of 5</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.user} />
                        <AvatarFallback className="bg-gray-200 text-black">{review.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-black">{review.user}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{review.date}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 ml-13">{review.comment}</p>
                    {review.id !== reviews[reviews.length - 1].id && <Separator />}
                  </div>
                ))}
                <Button variant="outline" className="w-full border-black hover:bg-black hover:text-white">
                  Show All Reviews
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
