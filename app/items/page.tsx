"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Star, MapPin, Search, Grid, List } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"
import { createClient } from "@/lib/supabase/client"

interface Item {
  id: string
  name: string
  category: string
  price: number
  rating: number
  reviews: number
  location: string
  image: string
  owner: string
  available: boolean
  description: string
}

export default function ItemsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch items from database
  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const supabase = createClient()

      const { data: items, error } = await supabase
        .from('items')
        .select(`
          *,
          categories(name),
          profiles(full_name)
        `)
        .in('status', ['approved', 'pending'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching items:', error)
      } else {
        // Transform database items to match the expected format
        const transformedItems = items?.map(item => ({
          id: item.id,
          name: item.title,
          category: item.categories?.name || 'Other',
          price: item.price_per_day,
          rating: item.rating || 4.5,
          reviews: item.total_reviews || 0,
          location: item.location,
          image: item.images?.[0] || "/placeholder.svg?height=200&width=300",
          owner: item.profiles?.full_name || "Unknown",
          available: item.is_available,
          description: item.description,
        })) || []

        setItems(transformedItems)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category.toLowerCase() === selectedCategory
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1]

    return matchesSearch && matchesCategory && matchesPrice
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-4 mb-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-600 text-sm">Loading items...</span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Browse Items</h1>
          <p className="text-gray-600">Find the perfect item to rent from our community</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-gray-300 focus:border-black">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="music">Music</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="border-gray-300 focus:border-black">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-black text-white" : "border-gray-300 hover:border-black"}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-black text-white" : "border-gray-300 hover:border-black"}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="max-w-md">
            <label className="block text-sm font-medium text-black mb-2">
              Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])} per day
            </label>
            <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={5} className="w-full" />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>

        {/* Items Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow border-2 hover:border-black">
                <div className="relative">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge
                      className={`${
                        item.available ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {item.available ? "Available" : "Rented"}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-black">{item.name}</CardTitle>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">{formatCurrency(item.price)}</div>
                      <div className="text-sm text-gray-600">/day</div>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-black ml-1">{item.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">({item.reviews})</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    {item.location}
                  </div>
                  <Button asChild className="w-full bg-black text-white hover:bg-gray-800" disabled={!item.available}>
                    <Link href={`/items/${item.id}`}>{item.available ? "Rent Now" : "View Details"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow border-2 hover:border-black">
                <div className="flex">
                  <div className="relative w-48 h-32">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-l-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge
                        className={`${
                          item.available ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {item.available ? "Available" : "Rented"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-black">{item.name}</h3>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-black">{formatCurrency(item.price)}</div>
                        <div className="text-sm text-gray-600">/day</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-black ml-1">{item.rating}</span>
                        <span className="text-sm text-gray-600 ml-1">({item.reviews})</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        {item.location}
                      </div>
                    </div>
                    <Button asChild className="bg-black text-white hover:bg-gray-800" disabled={!item.available}>
                      <Link href={`/items/${item.id}`}>{item.available ? "Rent Now" : "View Details"}</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No items found matching your criteria.</p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setPriceRange([0, 500])
              }}
              className="mt-4 bg-black text-white hover:bg-gray-800"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
