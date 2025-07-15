import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { rentalId, pickupNotes } = await request.json()

    if (!rentalId) {
      return NextResponse.json({ error: "Rental ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get rental details and verify user has permission
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        id,
        renter_id,
        owner_id,
        status,
        pickup_confirmed_at,
        items (
          title,
          owner_id
        )
      `)
      .eq("id", rentalId)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if user is authorized (only renter can confirm pickup)
    if (rental.renter_id !== user.id) {
      return NextResponse.json({ error: "Only the renter can confirm pickup" }, { status: 403 })
    }

    // Check if rental is in pending_pickup status
    if (rental.status !== 'pending_pickup') {
      return NextResponse.json({ 
        error: `Cannot confirm pickup for rental with status: ${rental.status}` 
      }, { status: 400 })
    }

    // Check if pickup already confirmed
    if (rental.pickup_confirmed_at) {
      return NextResponse.json({ error: "Pickup already confirmed" }, { status: 400 })
    }

    // Update rental with pickup confirmation
    const updateData = {
      pickup_confirmed_at: new Date().toISOString(),
      pickup_confirmed_by: user.id,
      pickup_notes: pickupNotes || null,
      status: 'active' as const,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("rentals")
      .update(updateData)
      .eq("id", rentalId)

    if (updateError) {
      console.error("Error confirming pickup:", updateError)
      return NextResponse.json({ error: "Failed to confirm pickup" }, { status: 500 })
    }

    // Create notification for owner
    await supabase.from("notifications").insert({
      user_id: rental.owner_id,
      title: "Item Pickup Confirmed",
      message: `The renter has confirmed pickup of "${rental.items?.title}". The rental is now active.`,
      type: "pickup_confirmed",
      related_id: rentalId,
    })

    return NextResponse.json({ 
      success: true, 
      message: "Pickup confirmed successfully. Your rental is now active!" 
    })

  } catch (error) {
    console.error("Error in confirm-pickup API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
