"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, X, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
import { LocationSelector } from "@/components/location-selector"

const categories = [
  { id: "electronics", name: "Electronics" },
  { id: "tools", name: "Tools" },
  { id: "sports", name: "Sports" },
  { id: "photography", name: "Photography" },
  { id: "music", name: "Music" },
  { id: "outdoor", name: "Outdoor" },
]

export default function ListItemPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Test Supabase connection on page load
  useEffect(() => {
    const testSupabase = async () => {
      try {
        console.log("Testing Supabase connection...")
        const supabase = createClient()
        const { data, error } = await supabase.from('categories').select('count').limit(1)
        console.log("Supabase test result:", data, error)
      } catch (err) {
        console.error("Supabase test error:", err)
      }
    }
    testSupabase()
  }, [])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    long_description: "",
    price_per_day: "",
    category_id: "",
    location: "",
    minimum_rental_days: "1",
    maximum_rental_days: "30",
    security_deposit: "0",
    late_fee_per_day: "0",
    cancellation_policy: "",
    damage_policy: "",
  })

  const [images, setImages] = useState<string[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures(prev => [...prev, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit called!")
    e.preventDefault()
    console.log("preventDefault called")
    setLoading(true)
    console.log("Loading set to true")
    setError("")
    setSuccess("")

    try {
      console.log("Starting form submission...")
      console.log("Form data:", formData)

      const supabase = createClient()

      // Check authentication properly
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log("Auth check:", { user: user?.id, email: user?.email, error: authError })

      if (authError || !user) {
        setError("You must be logged in to list an item. Please log out and log back in.")
        setLoading(false)
        return
      }

      // Get category ID
      const selectedCategory = categories.find(cat => cat.id === formData.category_id)
      if (!selectedCategory) {
        setError("Please select a category")
        setLoading(false)
        return
      }

      console.log("Looking for category:", formData.category_id)

      // Get or create category in database
      console.log("About to query categories table...")
      let { data: categoryResults, error: categoryLookupError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('slug', formData.category_id)

      console.log("Category lookup result:", categoryResults, categoryLookupError)

      let category = categoryResults && categoryResults.length > 0 ? categoryResults[0] : null

      if (!category) {
        console.log("Creating new category...")
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: selectedCategory.name,
            slug: formData.category_id,
            is_active: true
          })
          .select('id, name')
          .single()

        console.log("Category creation result:", newCategory, categoryError)

        if (categoryError) {
          setError("Error creating category: " + categoryError.message)
          setLoading(false)
          return
        }
        category = newCategory
      }

      // Create item
      console.log("Creating item with data:", {
        owner_id: user.id,
        category_id: category.id,
        title: formData.title,
        price_per_day: parseFloat(formData.price_per_day)
      })

      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          owner_id: user.id,
          category_id: category.id,
          title: formData.title,
          description: formData.description,
          long_description: formData.long_description || formData.description,
          price_per_day: parseFloat(formData.price_per_day),
          images: images,
          features: features,
          location: formData.location,
          minimum_rental_days: parseInt(formData.minimum_rental_days),
          maximum_rental_days: parseInt(formData.maximum_rental_days),
          security_deposit: parseFloat(formData.security_deposit),
          late_fee_per_day: parseFloat(formData.late_fee_per_day),
          cancellation_policy: formData.cancellation_policy,
          damage_policy: formData.damage_policy,
          status: 'pending'
        })
        .select()
        .single()

      console.log("Item creation result:", item, itemError)

      if (itemError) {
        setError("Error creating item: " + itemError.message)
        setLoading(false)
        return
      }

      console.log("Item created successfully!")
      setSuccess("Item listed successfully! It will be reviewed before going live.")
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4 hover:bg-gray-100">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-black">List a New Item</h1>
          <p className="text-gray-600">Share your items with the community and earn money</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-black">Item Details</CardTitle>
              <CardDescription>
                Provide detailed information about your item to attract renters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-black font-medium">
                      Item Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Professional DSLR Camera"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-black font-medium">
                      Category *
                    </Label>
                    <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
                      <SelectTrigger className="border-gray-300 focus:border-black">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-black font-medium">
                    Short Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your item..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="border-gray-300 focus:border-black"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long_description" className="text-black font-medium">
                    Detailed Description
                  </Label>
                  <Textarea
                    id="long_description"
                    placeholder="Detailed description including condition, specifications, included accessories..."
                    value={formData.long_description}
                    onChange={(e) => handleInputChange("long_description", e.target.value)}
                    className="border-gray-300 focus:border-black"
                    rows={5}
                  />
                </div>

                {/* Pricing */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_day" className="text-black font-medium">
                      Price per Day (MYR) *
                    </Label>
                    <Input
                      id="price_per_day"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      value={formData.price_per_day}
                      onChange={(e) => handleInputChange("price_per_day", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="security_deposit" className="text-black font-medium">
                      Security Deposit (MYR)
                    </Label>
                    <Input
                      id="security_deposit"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.security_deposit}
                      onChange={(e) => handleInputChange("security_deposit", e.target.value)}
                      className="border-gray-300 focus:border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="late_fee_per_day" className="text-black font-medium">
                      Late Fee per Day (MYR)
                    </Label>
                    <Input
                      id="late_fee_per_day"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.late_fee_per_day}
                      onChange={(e) => handleInputChange("late_fee_per_day", e.target.value)}
                      className="border-gray-300 focus:border-black"
                    />
                  </div>
                </div>

                {/* Rental Terms */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minimum_rental_days" className="text-black font-medium">
                      Minimum Rental Days
                    </Label>
                    <Input
                      id="minimum_rental_days"
                      type="number"
                      min="1"
                      value={formData.minimum_rental_days}
                      onChange={(e) => handleInputChange("minimum_rental_days", e.target.value)}
                      className="border-gray-300 focus:border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maximum_rental_days" className="text-black font-medium">
                      Maximum Rental Days
                    </Label>
                    <Input
                      id="maximum_rental_days"
                      type="number"
                      min="1"
                      value={formData.maximum_rental_days}
                      onChange={(e) => handleInputChange("maximum_rental_days", e.target.value)}
                      className="border-gray-300 focus:border-black"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-black font-medium">Location *</Label>
                  <LocationSelector
                    value={formData.location}
                    onChange={(value) => handleInputChange("location", value)}
                  />
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <Label className="text-black font-medium">Images</Label>
                  <ImageUpload
                    onImagesUploaded={setImages}
                    maxImages={5}
                    existingImages={images}
                  />
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <Label className="text-black font-medium">Features & Specifications</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a feature..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="border-gray-300 focus:border-black"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} variant="outline" className="border-black hover:bg-black hover:text-white">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policies */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cancellation_policy" className="text-black font-medium">
                      Cancellation Policy
                    </Label>
                    <Textarea
                      id="cancellation_policy"
                      placeholder="Describe your cancellation policy..."
                      value={formData.cancellation_policy}
                      onChange={(e) => handleInputChange("cancellation_policy", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="damage_policy" className="text-black font-medium">
                      Damage Policy
                    </Label>
                    <Textarea
                      id="damage_policy"
                      placeholder="Describe your damage policy..."
                      value={formData.damage_policy}
                      onChange={(e) => handleInputChange("damage_policy", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    disabled={loading}
                  >
                    {loading ? "Listing Item..." : "List Item"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100"
                    onClick={() => router.push("/dashboard")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
