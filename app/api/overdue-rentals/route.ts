import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request or admin request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get rentals that need return reminders (due today or tomorrow)
    const { data: upcomingReturns, error: upcomingError } = await supabase
      .from("rentals")
      .select(`
        id,
        end_date,
        return_reminder_sent,
        renter_id,
        owner_id,
        items (title),
        profiles!rentals_renter_id_fkey (full_name, telegram_chat_id)
      `)
      .eq("status", "active")
      .eq("return_reminder_sent", false)
      .gte("end_date", today)
      .lte("end_date", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Tomorrow

    if (upcomingError) {
      console.error("Error fetching upcoming returns:", upcomingError)
    }

    // Get overdue rentals (past end date, still active, no return initiated)
    const { data: overdueRentals, error: overdueError } = await supabase
      .from("rentals")
      .select(`
        id,
        end_date,
        overdue_reminder_sent,
        renter_id,
        owner_id,
        return_initiated_at,
        items (title, late_fee_per_day),
        profiles!rentals_renter_id_fkey (full_name, telegram_chat_id)
      `)
      .eq("status", "active")
      .lt("end_date", today)
      .is("return_initiated_at", null)

    if (overdueError) {
      console.error("Error fetching overdue rentals:", overdueError)
    }

    // Calculate late days for overdue rentals
    const overdueWithLateDays = (overdueRentals || []).map(rental => {
      const endDate = new Date(rental.end_date)
      const todayDate = new Date(today)
      const lateDays = Math.floor((todayDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        ...rental,
        lateDays,
        lateFeeAmount: lateDays * (rental.items?.late_fee_per_day || 0)
      }
    })

    return NextResponse.json({
      success: true,
      upcomingReturns: upcomingReturns || [],
      overdueRentals: overdueWithLateDays,
      summary: {
        upcomingCount: upcomingReturns?.length || 0,
        overdueCount: overdueRentals?.length || 0,
      }
    })
  } catch (error) {
    console.error("Error fetching overdue rentals:", error)
    return NextResponse.json({ error: "Failed to fetch overdue rentals" }, { status: 500 })
  }
}

// Helper endpoint for manual admin use
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

    // Check if user is admin (you can implement admin role checking here)
    // For now, we'll allow any authenticated user to trigger this for testing

    const { rentalId, action } = await request.json()

    if (action === "update_late_days" && rentalId) {
      // Manually update late days for a specific rental
      const { data: rental } = await supabase
        .from("rentals")
        .select("end_date")
        .eq("id", rentalId)
        .single()

      if (rental) {
        const endDate = new Date(rental.end_date)
        const today = new Date()
        const lateDays = Math.max(0, Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)))

        await supabase
          .from("rentals")
          .update({ 
            late_days: lateDays,
            updated_at: new Date().toISOString()
          })
          .eq("id", rentalId)

        return NextResponse.json({ success: true, lateDays })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in manual overdue update:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
