import { type NextRequest, NextResponse } from "next/server"
import { TelegramNotificationService } from "@/lib/telegram/notifications"
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

    const { type, rentalId, message, userId } = await request.json()

    const notificationService = new TelegramNotificationService()

    // Get rental details
    const { data: rental } = await supabase
      .from("rentals")
      .select(`
        id,
        items (title)
      `)
      .eq("id", rentalId)
      .single()

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    const success = await notificationService.sendRentalReminder({
      type,
      rentalId,
      userId: userId || user.id,
      itemTitle: rental.items.title,
      message,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/rental/${rentalId}`,
    })

    return NextResponse.json({ success })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
