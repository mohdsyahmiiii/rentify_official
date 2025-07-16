"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Shield, MapPin, Star, ArrowLeft, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { loadStripe } from "@stripe/stripe-js"
import { createClient } from "@/lib/supabase/client"
import { RentalAgreement } from "@/components/rental-agreement"
import { formatCurrency } from "@/lib/utils/currency"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)



interface ItemData {
  id: string
  name: string
  description: string
  price: number
  owner: string
  rating: number
  reviews: number
  location: string
  image: string
  category: string
  images: string[]
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const itemId = searchParams.get('item')

  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [rentalDays, setRentalDays] = useState(1)
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checking: boolean
    available: boolean | null
    message: string
  }>({ checking: false, available: null, message: "" })
  const [deliveryMethod] = useState("pickup") // Fixed to pickup only (meet-up)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [rentalId, setRentalId] = useState<string>("")
  const [agreement, setAgreement] = useState("")
  const [agreementSigned, setAgreementSigned] = useState(false)
  const [itemData, setItemData] = useState<ItemData | null>(null)
  const [itemLoading, setItemLoading] = useState(true)
  const [itemError, setItemError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  // Fetch user and item data on component mount
  useEffect(() => {
    fetchUser()
    fetchItemData()
  }, [itemId])

  const fetchUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({ id: authUser.id })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchItemData = async () => {
    if (!itemId) {
      setItemError('No item selected')
      setItemLoading(false)
      return
    }

    try {
      setItemError(null)

      setItemLoading(true)
      const supabase = createClient()

      const { data: item, error } = await supabase
        .from('items')
        .select(`
          *,
          categories(name),
          profiles!items_owner_id_fkey(full_name)
        `)
        .eq('id', itemId)
        .single()

      if (error) {
        throw error
      }

      if (!item) {
        throw new Error('Item not found')
      }

      // Transform database item to match expected format
      const transformedItem: ItemData = {
        id: itemId,
        name: item.title,
        description: item.description,
        price: item.price_per_day,
        owner: item.profiles?.full_name || 'Unknown Owner',
        rating: item.rating || 4.5,
        reviews: item.total_reviews || 0,
        location: item.location,
        image: item.images?.[0] || '/placeholder.svg',
        category: item.categories?.name || 'Uncategorized',
        images: item.images || ['/placeholder.svg'],
      }

      setItemData(transformedItem)
      setItemLoading(false)
    } catch (err) {
      console.error('Error fetching item:', err)
      setItemError('Failed to load item')
      setItemLoading(false)
    }
  }

  // Auto-calculate rental duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

      if (daysDiff > 0) {
        setRentalDays(daysDiff)
      } else {
        // If end date is before start date, reset end date
        setEndDate(undefined)
        setRentalDays(1)
      }
    }
  }, [startDate, endDate])

  const calculateTotal = () => {
    // Calculate rental costs based on item data (meet-up only, no delivery)
    if (!itemData) return { subtotal: 0, serviceFee: 0, insurance: 0, deliveryFee: 0, total: 0 }

    const subtotal = itemData.price * rentalDays
    const serviceFee = subtotal * 0.1
    const insurance = subtotal * 0.05
    const deliveryFee = 0 // Always 0 for meet-up only
    return {
      subtotal,
      serviceFee,
      insurance,
      deliveryFee,
      total: subtotal + serviceFee + insurance + deliveryFee,
    }
  }

  const costs = calculateTotal()

  // Check availability when dates change
  const checkAvailability = async () => {
    if (!itemData || !startDate || !endDate) {
      setAvailabilityStatus({ checking: false, available: null, message: "" })
      return
    }

    setAvailabilityStatus({ checking: true, available: null, message: "Checking availability..." })

    try {
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemData.id,
          startDate: startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0'),
          endDate: endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0')
        })
      })

      const data = await response.json()

      if (response.ok && data.available) {
        setAvailabilityStatus({
          checking: false,
          available: true,
          message: "✅ Available for selected dates"
        })
      } else {
        const message = data.conflictDetails ?
          `❌ Not available. Next available: ${data.nextAvailableDate ? new Date(data.nextAvailableDate).toLocaleDateString() : 'Unknown'}` :
          `❌ ${data.error || 'Not available for selected dates'}`

        setAvailabilityStatus({
          checking: false,
          available: false,
          message
        })
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      setAvailabilityStatus({
        checking: false,
        available: false,
        message: "❌ Error checking availability"
      })
    }
  }

  // Check availability when dates change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability()
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [startDate, endDate, itemData])

  const handleCreateRental = async () => {
    if (!itemData) {
      setError("Item data not loaded")
      return
    }

    if (!user) {
      setError("Please log in to continue")
      return
    }

    if (!startDate || !endDate) {
      setError("Please select start and end dates")
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()

      // STEP 1: Check availability before creating rental
      const availabilityResponse = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemData.id,
          startDate: startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0'),
          endDate: endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0')
        })
      })

      const availabilityData = await availabilityResponse.json()

      if (!availabilityResponse.ok || !availabilityData.available) {
        const conflictMessage = availabilityData.conflictDetails ?
          `Item is already booked for those dates. Next available: ${availabilityData.nextAvailableDate}` :
          availabilityData.error || 'Item is not available for the selected dates'
        throw new Error(conflictMessage)
      }

      // STEP 2: Get the item to get the owner_id
      const { data: realItem, error: itemError } = await supabase
        .from('items')
        .select('owner_id')
        .eq('id', itemData.id)
        .single()

      if (itemError || !realItem) {
        throw new Error('Item not found in database')
      }

      const rentalData = {
        item_id: itemData.id,
        renter_id: user.id,
        owner_id: realItem.owner_id,
        start_date: startDate ? startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0') : null, // Format as YYYY-MM-DD
        end_date: endDate ? endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0') : null, // Format as YYYY-MM-DD
        total_days: rentalDays,
        price_per_day: itemData.price,
        subtotal: costs.subtotal,
        service_fee: costs.serviceFee,
        insurance_fee: costs.insurance,
        delivery_fee: costs.deliveryFee,
        total_amount: costs.total,
        delivery_method: deliveryMethod,
        special_instructions: specialInstructions,
        status: 'pending'
      }



      const { data: rental, error: rentalError } = await supabase
        .from("rentals")
        .insert(rentalData)
        .select()
        .single()

      if (rentalError) {
        console.error("Supabase rental error:", rentalError)
        throw rentalError
      }


      setRentalId(rental.id)

      // Auto-generate agreement in background
      generateAgreementInBackground(rental.id)

      setStep(2) // Move to agreement step
    } catch (error) {
      console.error("Rental creation error:", error)
      setError(`Failed to create rental: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  // Function to generate agreement in background
  const generateAgreementInBackground = async (rentalId: string) => {
    try {
      const response = await fetch("/api/generate-agreement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rentalId }),
      })

      const data = await response.json()

      if (data.error) {
        console.error("Background agreement generation failed:", data.error)
      } else {
        setAgreement(data.agreement)
        console.log("Agreement generated successfully in background")
      }
    } catch (err) {
      console.error("Background agreement generation error:", err)
      // Don't show error to user since this is background operation
    }
  }

  const handleCompleteBooking = async () => {
    setLoading(true)
    setError("")

    try {
      // For demo rentals, skip payment and go to confirmation
      if (rentalId.startsWith('demo-rental-')) {
        // Simulate a brief processing delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStep(4) // Go to confirmation step
        return
      }

      // Validate that we have a valid rental ID for real rentals
      if (!rentalId || rentalId === '') {
        throw new Error("No rental found. Please start the booking process again.")
      }

      // For real rentals, create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rentalId: rentalId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create checkout session")
      }

      const { url } = await response.json()

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setError(`Failed to process payment: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-2">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              {rentalId.startsWith('demo-rental-') ? 'Demo Booking Complete!' : 'Booking Confirmed!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {rentalId.startsWith('demo-rental-')
                ? 'This was a demo booking to showcase the rental process. In a real booking, your request would be sent to the owner and you would receive a confirmation email.'
                : `Your rental request has been sent to ${itemData?.owner || 'the owner'}. You'll receive a confirmation email shortly.`
              }
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-black hover:bg-black hover:text-white">
                <Link href="/items">Browse More Items</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (itemLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading item details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (itemError || !itemData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error Loading Item</p>
            <p className="text-sm">{itemError || 'Item not found'}</p>
          </div>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link href="/items">
              Browse Items
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
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" size="icon" className="border-black hover:bg-black hover:text-white">
            <Link href={itemId ? `/items/${itemId}` : "/items"}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">Checkout</h1>
            <p className="text-gray-600">Complete your rental booking</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? "bg-black text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? "bg-black" : "bg-gray-200"}`}></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? "bg-black text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? "bg-black" : "bg-gray-200"}`}></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? "bg-black text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <>
                {/* Rental Details */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-black">Rental Details</CardTitle>
                    <CardDescription>Choose your rental dates and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date Selection */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-black font-medium">
                          Start Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal border-gray-300 hover:border-black"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date" className="text-black font-medium">
                          End Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal border-gray-300 hover:border-black"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              disabled={(date) => {
                                const today = new Date(new Date().setHours(0, 0, 0, 0))
                                const minDate = startDate ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : today
                                return date < minDate
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Rental Duration - Auto-calculated */}
                    <div className="space-y-2">
                      <Label className="text-black font-medium">
                        Rental Duration
                      </Label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-black font-medium">
                            {rentalDays} {rentalDays === 1 ? "day" : "days"}
                          </span>
                          <span className="text-sm text-gray-600">
                            {startDate && endDate ? "Auto-calculated" : "Select dates above"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Availability Status */}
                    {(availabilityStatus.checking || availabilityStatus.available !== null) && (
                      <div className="space-y-2">
                        <Label className="text-black font-medium">Availability Status</Label>
                        <div className={`p-3 border rounded-lg ${
                          availabilityStatus.checking
                            ? 'bg-gray-50 border-gray-200'
                            : availabilityStatus.available
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {availabilityStatus.checking && (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            <span className={`text-sm font-medium ${
                              availabilityStatus.checking
                                ? 'text-gray-700'
                                : availabilityStatus.available
                                  ? 'text-green-700'
                                  : 'text-red-700'
                            }`}>
                              {availabilityStatus.message}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meet-up Information */}
                    <div className="space-y-3">
                      <Label className="text-black font-medium">Meet-up Arrangement</Label>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-800 font-medium">Meet-up Only</span>
                        </div>
                        <p className="text-blue-700 text-sm mt-2">
                          You'll arrange a convenient meet-up location with the owner to collect and return the item. No delivery fees apply.
                        </p>
                      </div>
                    </div>

                    {/* Meet-up Instructions */}
                    <div className="space-y-2">
                      <Label htmlFor="instructions" className="text-black font-medium">
                        Meet-up Preferences & Instructions (Optional)
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="Preferred meet-up times, locations, or any special instructions for the rental..."
                        className="border-gray-300 focus:border-black"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  {!user ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-800 font-medium">Sign In Required</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          Please sign in to continue with your rental booking
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild className="flex-1 bg-black text-white hover:bg-gray-800">
                          <Link href={`/auth/login?next=${encodeURIComponent(`/checkout?item_id=${itemId}`)}`}>
                            Sign In to Continue
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1 border-black hover:bg-black hover:text-white">
                          <Link href={`/auth/signup?next=${encodeURIComponent(`/checkout?item_id=${itemId}`)}`}>
                            Create Account
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCreateRental}
                      className="bg-black text-white hover:bg-gray-800"
                      disabled={
                        !startDate ||
                        !endDate ||
                        loading ||
                        availabilityStatus.checking ||
                        availabilityStatus.available === false
                      }
                    >
                      {loading ? "Creating..." : "Continue to Agreement"}
                    </Button>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Rental Agreement */}
                <RentalAgreement
                  rentalId={rentalId}
                  agreement={agreement}
                  onAgreementGenerated={(newAgreement) => {
                    setAgreement(newAgreement)
                  }}
                  onAgreementSigned={() => {
                    setAgreementSigned(true)
                  }}
                />

                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="border-black hover:bg-black hover:text-white"
                  >
                    Back to Details
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-black text-white hover:bg-gray-800"
                    disabled={!agreement || !agreementSigned || !rentalId}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {/* Payment Information */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-black">Payment Information</CardTitle>
                    <CardDescription>Complete your payment to finalize the rental</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm text-black">
                        I agree to the rental agreement and{" "}
                        <Link href="/terms" className="underline hover:text-gray-600">
                          Terms of Service
                        </Link>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="border-black hover:bg-black hover:text-white"
                  >
                    Back to Agreement
                  </Button>
                  <Button
                    onClick={handleCompleteBooking}
                    className="bg-black text-white hover:bg-gray-800"
                    disabled={!agreedToTerms || loading}
                  >
                    {loading ? "Processing..." : "Complete Booking"}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 sticky top-8">
              <CardHeader>
                <CardTitle className="text-black">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Item Details */}
                <div className="flex space-x-4">
                  <Image
                    src={itemData.image || "/placeholder.svg"}
                    alt={itemData.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-black">{itemData.name}</h3>
                    <p className="text-sm text-gray-600">{itemData.category}</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-black ml-1">{itemData.rating}</span>
                      <span className="text-sm text-gray-600 ml-1">({itemData.reviews})</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Owner Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-black">{itemData.owner.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">{itemData.owner}</p>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {itemData.location}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rental Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-black">Duration:</span>
                    <span className="text-black font-medium">
                      {rentalDays} {rentalDays === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Collection:</span>
                    <span className="text-black font-medium">Meet-up</span>
                  </div>
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-black">Subtotal:</span>
                    <span className="text-black">{formatCurrency(costs.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Service Fee:</span>
                    <span className="text-black">{formatCurrency(costs.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Insurance:</span>
                    <span className="text-black">{formatCurrency(costs.insurance)}</span>
                  </div>
                  {costs.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-black">Delivery Fee:</span>
                      <span className="text-black">{formatCurrency(costs.deliveryFee)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-black">Total:</span>
                  <span className="text-black">{formatCurrency(costs.total)}</span>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-black">AI-Generated Agreement</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
