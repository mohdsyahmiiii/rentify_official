import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rentalId, amount, currency = "usd", applicationFeeAmount, stripeAccountId } = await request.json()

    // Get rental details from database
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        *,
        items (
          title,
          owner_id,
          profiles!items_owner_id_fkey (
            stripe_account_id
          )
        )
      `)
      .eq("id", rentalId)
      .eq("renter_id", user.id)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      application_fee_amount: Math.round(applicationFeeAmount * 100),
      transfer_data: {
        destination: rental.items.profiles.stripe_account_id,
      },
      metadata: {
        rental_id: rentalId,
        renter_id: user.id,
        owner_id: rental.owner_id,
      },
    })

    // Update rental with payment intent ID
    await supabase
      .from("rentals")
      .update({
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
