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

    const { rentalId } = await request.json()

    // Get rental details
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        *,
        items (
          title,
          images,
          owner_id,
          profiles!items_owner_id_fkey (
            stripe_account_id,
            full_name
          )
        )
      `)
      .eq("id", rentalId)
      .eq("renter_id", user.id)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if owner has Stripe account set up
    const stripeAccountId = rental.items.profiles.stripe_account_id
    const isDevelopment = process.env.NODE_ENV === 'development'

    // In development, allow testing without real Stripe Connect account
    if (!stripeAccountId && !isDevelopment) {
      return NextResponse.json({
        error: "Owner hasn't set up payment processing yet. Please contact the owner."
      }, { status: 400 })
    }

    if (!stripeAccountId && isDevelopment) {
      console.log('Development mode: Creating checkout session without Connect account')
    }

    const serviceFee = rental.service_fee
    const applicationFeeAmount = serviceFee

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Rental: ${rental.items.title}`,
              description: `${rental.total_days} day rental`,
              images: rental.items.images?.slice(0, 1) || [],
            },
            unit_amount: Math.round(rental.subtotal * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Fee",
              description: "Rentify platform fee",
            },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Insurance Fee",
              description: "Rental protection insurance",
            },
            unit_amount: Math.round(rental.insurance_fee * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/rental/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/checkout?rental_id=${rentalId}`,
      payment_intent_data: stripeAccountId ? {
        application_fee_amount: Math.round(applicationFeeAmount * 100),
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          rental_id: rentalId,
          renter_id: user.id,
          owner_id: rental.owner_id,
        },
      } : {
        metadata: {
          rental_id: rentalId,
          renter_id: user.id,
          owner_id: rental.owner_id,
        },
      },
      metadata: {
        rental_id: rentalId,
        renter_id: user.id,
      },
    })

    // Update rental with session ID
    await supabase
      .from("rentals")
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
