import { type NextRequest, NextResponse } from "next/server"
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

    const { rentalId, isOwner = false } = await request.json()

    if (!rentalId) {
      return NextResponse.json({ error: "Rental ID is required" }, { status: 400 })
    }

    // Verify the rental exists and user has permission
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select("id, renter_id, owner_id")
      .eq("id", rentalId)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if user is authorized to accept this agreement
    const isAuthorized = isOwner 
      ? rental.owner_id === user.id 
      : rental.renter_id === user.id

    if (!isAuthorized) {
      return NextResponse.json({ error: "Not authorized to accept this agreement" }, { status: 403 })
    }

    // Update the appropriate agreement acceptance field
    const updateData = isOwner 
      ? { 
          agreement_accepted_by_owner: true,
          owner_signature: `${user.email} - Digital Acceptance`,
        }
      : { 
          agreement_accepted_by_renter: true,
          renter_signature: `${user.email} - Digital Acceptance`,
        }

    // If both parties have accepted, set the signed timestamp
    const { data: currentRental } = await supabase
      .from("rentals")
      .select("agreement_accepted_by_owner, agreement_accepted_by_renter")
      .eq("id", rentalId)
      .single()

    const bothAccepted = isOwner 
      ? currentRental?.agreement_accepted_by_renter && true
      : currentRental?.agreement_accepted_by_owner && true

    if (bothAccepted) {
      updateData.agreement_signed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)

    if (updateError) {
      console.error("Error updating agreement acceptance:", updateError)
      return NextResponse.json({ error: "Failed to save agreement acceptance" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Agreement accepted successfully",
      bothAccepted,
    })
  } catch (error) {
    console.error("Error accepting agreement:", error)
    return NextResponse.json({ error: "Failed to accept agreement" }, { status: 500 })
  }
}
