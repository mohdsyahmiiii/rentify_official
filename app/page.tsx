import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Shield, Users, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"

const featuredItems = [
  {
    id: 1,
    name: "Professional DSLR Camera",
    category: "Electronics",
    price: 120,
    rating: 4.8,
    reviews: 124,
    location: "Kuala Lumpur, Kuala Lumpur",
    image: "/placeholder.svg?height=200&width=300",
    owner: "John D.",
    available: true,
  },
  {
    id: 2,
    name: "Mountain Bike",
    category: "Sports",
    price: 75,
    rating: 4.9,
    reviews: 89,
    location: "George Town, Penang",
    image: "/placeholder.svg?height=200&width=300",
    owner: "Sarah M.",
    available: true,
  },
  {
    id: 3,
    name: "Power Drill Set",
    category: "Tools",
    price: 60,
    rating: 4.7,
    reviews: 156,
    location: "Johor Bahru, Johor",
    image: "/placeholder.svg?height=200&width=300",
    owner: "Mike R.",
    available: false,
  },
  {
    id: 4,
    name: "Gaming Console",
    category: "Electronics",
    price: 95,
    rating: 4.9,
    reviews: 203,
    location: "Shah Alam, Selangor",
    image: "/placeholder.svg?height=200&width=300",
    owner: "Alex K.",
    available: true,
  },
]

const categories = [
  { name: "Electronics", count: 1250, icon: "📱" },
  { name: "Tools", count: 890, icon: "🔧" },
  { name: "Sports", count: 670, icon: "⚽" },
  { name: "Photography", count: 450, icon: "📸" },
  { name: "Music", count: 320, icon: "🎵" },
  { name: "Outdoor", count: 540, icon: "🏕️" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Rent Anything, <span className="text-gray-300">Anytime</span>
          </h1>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Access thousands of items from your neighbors. From cameras to tools, rent what you need without the
            commitment of buying.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
              <Link href="/items">Browse Items</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              <Link href="/list-item">List Your Items</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Why Choose Rentify?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-black text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Secure & Safe</h3>
              <p className="text-gray-600">All items are insured and verified. Rent with confidence.</p>
            </div>
            <div className="text-center">
              <div className="bg-black text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Community Driven</h3>
              <p className="text-gray-600">Connect with neighbors and build lasting relationships.</p>
            </div>
            <div className="text-center">
              <div className="bg-black text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Instant Access</h3>
              <p className="text-gray-600">Book items instantly and pick them up the same day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={`/items?category=${category.name.toLowerCase()}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-black">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-semibold text-black">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.count} items</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-black">Featured Items</h2>
            <Button asChild variant="outline" className="border-black text-black hover:bg-black hover:text-white">
              <Link href="/items">View All</Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow border-2 hover:border-black">
                <div className="relative">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      item.available ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {item.available ? "Available" : "Rented"}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-black">{item.name}</CardTitle>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">{formatCurrency(item.price)}</div>
                      <div className="text-sm text-gray-600">/day</div>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600">{item.category}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-black ml-1">{item.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">({item.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {item.location}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">Owner: {item.owner}</div>
                  <Button asChild className="w-full bg-black text-white hover:bg-gray-800" disabled={!item.available}>
                    <Link href={`/items/${item.id}`}>{item.available ? "Rent Now" : "View Details"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Renting?</h2>
          <p className="text-xl mb-8 text-gray-300">Join thousands of users who are already saving money and space.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
              <Link href="/signup">Sign Up Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              <Link href="/items">Browse Items</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
