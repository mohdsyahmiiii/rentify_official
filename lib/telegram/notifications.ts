import { TelegramBot } from "./config"
import { createClient } from "@/lib/supabase/server"

export interface RentalNotification {
  type: "reminder" | "confirmation" | "payment" | "return" | "overdue"
  rentalId: string
  userId: string
  itemTitle: string
  message: string
  actionUrl?: string
}

export class TelegramNotificationService {
  private bot: TelegramBot

  constructor() {
    this.bot = new TelegramBot()
  }

  async sendRentalReminder(notification: RentalNotification): Promise<boolean> {
    try {
      const supabase = await createClient()

      // Get user's Telegram chat ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_chat_id, full_name")
        .eq("id", notification.userId)
        .single()

      if (!profile?.telegram_chat_id) {
        console.log(`User ${notification.userId} doesn't have Telegram linked`)
        return false
      }

      const emoji = this.getEmojiForType(notification.type)
      const message = `${emoji} *${this.getTitleForType(notification.type)}*\n\n${notification.message}`

      const inlineKeyboard = notification.actionUrl
        ? [
            [
              {
                text: "View Details",
                callback_data: `rental_${notification.rentalId}`,
              },
              {
                text: "Open App",
                url: notification.actionUrl,
              },
            ],
          ]
        : undefined

      return await this.bot.sendMessage({
        chat_id: profile.telegram_chat_id,
        text: message,
        parse_mode: "Markdown",
        reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
      })
    } catch (error) {
      console.error("Error sending Telegram notification:", error)
      return false
    }
  }

  private getEmojiForType(type: string): string {
    switch (type) {
      case "reminder":
        return "⏰"
      case "confirmation":
        return "✅"
      case "payment":
        return "💳"
      case "return":
        return "📦"
      case "overdue":
        return "🚨"
      default:
        return "📱"
    }
  }

  private getTitleForType(type: string): string {
    switch (type) {
      case "reminder":
        return "Rental Reminder"
      case "confirmation":
        return "Booking Confirmed"
      case "payment":
        return "Payment Update"
      case "return":
        return "Return Reminder"
      case "overdue":
        return "Overdue Notice"
      default:
        return "Rentify Notification"
    }
  }

  async sendBulkReminders(): Promise<void> {
    try {
      const supabase = await createClient()
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      // Get rentals starting tomorrow
      const { data: startingRentals } = await supabase
        .from("rentals")
        .select(`
          id,
          renter_id,
          start_date,
          items (title),
          profiles!rentals_renter_id_fkey (telegram_chat_id)
        `)
        .eq("status", "active")
        .gte("start_date", tomorrow.toISOString().split("T")[0])
        .lt("start_date", new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])

      // Get rentals ending tomorrow
      const { data: endingRentals } = await supabase
        .from("rentals")
        .select(`
          id,
          renter_id,
          owner_id,
          end_date,
          items (title),
          profiles!rentals_renter_id_fkey (telegram_chat_id),
          owner_profiles:profiles!rentals_owner_id_fkey (telegram_chat_id)
        `)
        .eq("status", "active")
        .gte("end_date", tomorrow.toISOString().split("T")[0])
        .lt("end_date", new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])

      // Send start reminders
      if (startingRentals) {
        for (const rental of startingRentals) {
          if (rental.profiles?.telegram_chat_id) {
            await this.sendRentalReminder({
              type: "reminder",
              rentalId: rental.id,
              userId: rental.renter_id,
              itemTitle: rental.items.title,
              message: `Your rental of *${rental.items.title}* starts tomorrow (${rental.start_date})!\n\nDon't forget to coordinate pickup with the owner.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/rental/${rental.id}`,
            })
          }
        }
      }

      // Send return reminders
      if (endingRentals) {
        for (const rental of endingRentals) {
          // Remind renter
          if (rental.profiles?.telegram_chat_id) {
            await this.sendRentalReminder({
              type: "return",
              rentalId: rental.id,
              userId: rental.renter_id,
              itemTitle: rental.items.title,
              message: `Your rental of *${rental.items.title}* ends tomorrow (${rental.end_date})!\n\nPlease arrange to return the item on time.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/rental/${rental.id}`,
            })
          }

          // Remind owner
          if (rental.owner_profiles?.telegram_chat_id) {
            await this.sendRentalReminder({
              type: "return",
              rentalId: rental.id,
              userId: rental.owner_id,
              itemTitle: rental.items.title,
              message: `The rental of your *${rental.items.title}* ends tomorrow (${rental.end_date})!\n\nPlease coordinate the return with the renter.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/rental/${rental.id}`,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error sending bulk reminders:", error)
    }
  }
}
