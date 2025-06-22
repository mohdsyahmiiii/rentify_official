import { NextResponse } from "next/server"
import { TelegramBot } from "@/lib/telegram/config"

export async function POST() {
  try {
    const bot = new TelegramBot()
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`

    console.log(`Setting webhook to: ${webhookUrl}`)

    const success = await bot.setWebhook(webhookUrl)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Webhook set successfully",
        webhookUrl,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to set webhook",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error setting webhook:", error)
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting webhook info:", error)
    return NextResponse.json({ error: "Failed to get webhook info" }, { status: 500 })
  }
}
