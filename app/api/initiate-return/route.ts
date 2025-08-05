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

    const { rentalId } = await request.json()

    if (!rentalId) {
      return NextResponse.json({ error: "Rental ID is required" }, { status: 400 })
    }

    // Get rental details and verify user has permission
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        id,
        renter_id,
        owner_id,
        status,
        end_date,
        return_initiated_at,
        items (
          title,
          security_deposit
        )
      `)
      .eq("id", rentalId)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if user is authorized (renter can initiate return)
    if (rental.renter_id !== user.id) {
      return NextResponse.json({ error: "Only the renter can initiate a return" }, { status: 403 })
    }

    // Check if rental is in active status
    if (rental.status !== 'active') {
      return NextResponse.json({ error: "Can only initiate return for active rentals" }, { status: 400 })
    }

    // Check if return already initiated
    if (rental.return_initiated_at) {
      return NextResponse.json({ error: "Return already initiated" }, { status: 400 })
    }

    // Calculate if return is late
    const endDate = new Date(rental.end_date)
    const today = new Date()
    const lateDays = Math.max(0, Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)))

    // Update rental with return initiation (with transaction safety)
    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        return_initiated_at: new Date().toISOString(),
        return_initiated_by: user.id,
        late_days: lateDays,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)

    if (updateError) {
      console.error("Error initiating return:", updateError)

      // Provide specific error messages for better debugging
      const errorMessage = updateError.message || "Failed to initiate return"
      return NextResponse.json({
        error: errorMessage,
        details: updateError.details || "Database update failed"
      }, { status: 500 })
    }

    // Add small delay to ensure database consistency before response
    await new Promise(resolve => setTimeout(resolve, 100))

    // TODO: Send notification to owner about return initiation
    // This will be implemented in the notification system

    return NextResponse.json({
      success: true,
      message: "Return initiated successfully",
      lateDays,
      isLate: lateDays > 0,
    })
  } catch (error) {
    console.error("Error initiating return:", error)
    return NextResponse.json({ error: "Failed to initiate return" }, { status: 500 })
  }
}
