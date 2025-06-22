import { TelegramBot } from "@/lib/telegram/config"

async function setupWebhook() {
  const bot = new TelegramBot()
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`

  console.log(`Setting webhook to: ${webhookUrl}`)

  const success = await bot.setWebhook(webhookUrl)

  if (success) {
    console.log("✅ Webhook set successfully!")
  } else {
    console.log("❌ Failed to set webhook")
  }
}

setupWebhook()
