import { NextResponse } from "next/server"
import { TelegramNotificationService } from "@/lib/telegram/notifications"

export async function GET() {
  try {
    // Verify this is a legitimate cron request
    const authHeader = process.env.CRON_SECRET

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationService = new TelegramNotificationService()
    await notificationService.sendBulkReminders()

    return NextResponse.json({ success: true, message: "Reminders sent" })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}
