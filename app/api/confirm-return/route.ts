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

    const { 
      rentalId, 
      damageReported = false, 
      damageDescription = "", 
      securityDepositDeduction = 0,
      securityDepositReason = ""
    } = await request.json()

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
        return_initiated_at,
        return_confirmed_at,
        security_deposit,
        late_days,
        items (
          title,
          security_deposit,
          late_fee_per_day
        )
      `)
      .eq("id", rentalId)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if user is authorized (owner can confirm return)
    if (rental.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the owner can confirm a return" }, { status: 403 })
    }

    // Check if return was initiated
    if (!rental.return_initiated_at) {
      return NextResponse.json({ error: "Return must be initiated first" }, { status: 400 })
    }

    // Check if return already confirmed
    if (rental.return_confirmed_at) {
      return NextResponse.json({ error: "Return already confirmed" }, { status: 400 })
    }

    // Calculate late fees if applicable
    const lateFeePerDay = rental.items?.late_fee_per_day || 0
    const lateFeeAmount = rental.late_days * lateFeePerDay

    // Calculate security deposit return
    const totalSecurityDeposit = rental.security_deposit || rental.items?.security_deposit || 0
    const totalDeductions = securityDepositDeduction + lateFeeAmount
    const securityDepositReturned = Math.max(0, totalSecurityDeposit - totalDeductions)

    // Update rental with return confirmation
    const updateData = {
      return_confirmed_at: new Date().toISOString(),
      return_confirmed_by: user.id,
      actual_return_date: new Date().toISOString().split('T')[0], // Today's date
      status: 'completed' as const,
      damage_reported: damageReported,
      damage_description: damageDescription || null,
      security_deposit_returned: securityDepositReturned,
      security_deposit_deduction: totalDeductions,
      security_deposit_reason: securityDepositReason || (lateFeeAmount > 0 ? `Late fees: ${rental.late_days} days` : null),
      late_fee_amount: lateFeeAmount,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("rentals")
      .update(updateData)
      .eq("id", rentalId)

    if (updateError) {
      console.error("Error confirming return:", updateError)
      return NextResponse.json({ error: "Failed to confirm return" }, { status: 500 })
    }

    // TODO: Process security deposit refund via Stripe
    // TODO: Send completion notification to both parties

    return NextResponse.json({
      success: true,
      message: "Return confirmed successfully",
      securityDepositReturned,
      lateFeeAmount,
      totalDeductions,
      rentalCompleted: true,
    })
  } catch (error) {
    console.error("Error confirming return:", error)
    return NextResponse.json({ error: "Failed to confirm return" }, { status: 500 })
  }
}
