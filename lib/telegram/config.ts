interface TelegramConfig {
  botToken: string
  apiUrl: string
}

export const telegramConfig: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  apiUrl: `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`,
}

export interface TelegramMessage {
  chat_id: string | number
  text: string
  parse_mode?: "HTML" | "Markdown"
  reply_markup?: {
    inline_keyboard?: Array<
      Array<{
        text: string
        callback_data?: string
        url?: string
      }>
    >
  }
}

export class TelegramBot {
  private apiUrl: string

  constructor() {
    this.apiUrl = telegramConfig.apiUrl
  }

  async sendMessage(message: TelegramMessage): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })

      const result = await response.json()
      return result.ok
    } catch (error) {
      console.error("Error sending Telegram message:", error)
      return false
    }
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
        }),
      })

      const result = await response.json()
      return result.ok
    } catch (error) {
      console.error("Error setting webhook:", error)
      return false
    }
  }
}
