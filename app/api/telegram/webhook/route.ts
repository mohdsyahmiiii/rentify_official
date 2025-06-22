import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelegramBot } from "@/lib/telegram/config"

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      username?: string
    }
    message: {
      message_id: number
      chat: {
        id: number
      }
    }
    data: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    const bot = new TelegramBot()
    const supabase = await createClient()

    // Handle regular messages
    if (update.message) {
      const { message } = update
      const chatId = message.chat.id
      const text = message.text || ""
      const userId = message.from.id

      if (text.startsWith("/start")) {
        // Handle /start command - link Telegram account
        const parts = text.split(" ")
        const linkToken = parts[1] // /start <token>

        if (linkToken) {
          // Find user by link token and update their Telegram chat ID
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("telegram_link_token", linkToken)
            .single()

          if (profile && !error) {
            await supabase
              .from("profiles")
              .update({
                telegram_chat_id: chatId.toString(),
                telegram_username: message.from.username,
                telegram_linked_at: new Date().toISOString(),
                telegram_link_token: null, // Clear the token
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id)

            await bot.sendMessage({
              chat_id: chatId,
              text: `🎉 *Welcome to Rentify!*\n\nYour Telegram account has been successfully linked!\n\nYou'll now receive:\n• Rental reminders\n• Booking confirmations\n• Payment notifications\n• Important updates\n\nType /help to see available commands.`,
              parse_mode: "Markdown",
            })
          } else {
            await bot.sendMessage({
              chat_id: chatId,
              text: "❌ Invalid or expired link token. Please generate a new link from your Rentify profile.",
            })
          }
        } else {
          await bot.sendMessage({
            chat_id: chatId,
            text: `👋 Welcome to Rentify Bot!\n\nTo link your account, please:\n1. Go to your Rentify profile\n2. Click "Link Telegram"\n3. Use the provided link\n\nType /help for more information.`,
          })
        }
      } else if (text === "/help") {
        await bot.sendMessage({
          chat_id: chatId,
          text: `🤖 *Rentify Bot Commands*\n\n/start - Link your Telegram account\n/help - Show this help message\n/rentals - View your active rentals\n/profile - View your profile info\n/unlink - Unlink your Telegram account`,
          parse_mode: "Markdown",
        })
      } else if (text === "/rentals") {
        // Show user's active rentals
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_chat_id", chatId.toString())
          .single()

        if (profile) {
          const { data: rentals } = await supabase
            .from("rentals")
            .select(`
              id,
              start_date,
              end_date,
              status,
              total_amount,
              items (title)
            `)
            .or(`renter_id.eq.${profile.id},owner_id.eq.${profile.id}`)
            .in("status", ["pending", "active"])
            .order("start_date", { ascending: true })

          if (rentals && rentals.length > 0) {
            let message = "📋 *Your Active Rentals:*\n\n"
            rentals.forEach((rental, index) => {
              message += `${index + 1}. *${rental.items.title}*\n`
              message += `   📅 ${rental.start_date} to ${rental.end_date}\n`
              message += `   💰 $${rental.total_amount}\n`
              message += `   📊 Status: ${rental.status}\n\n`
            })

            await bot.sendMessage({
              chat_id: chatId,
              text: message,
              parse_mode: "Markdown",
            })
          } else {
            await bot.sendMessage({
              chat_id: chatId,
              text: "📭 You don't have any active rentals at the moment.",
            })
          }
        } else {
          await bot.sendMessage({
            chat_id: chatId,
            text: "❌ Your Telegram account is not linked. Use /start to link your account.",
          })
        }
      } else if (text === "/unlink") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_chat_id", chatId.toString())
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              telegram_chat_id: null,
              telegram_username: null,
              telegram_linked_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id)

          await bot.sendMessage({
            chat_id: chatId,
            text: "✅ Your Telegram account has been unlinked from Rentify.",
          })
        } else {
          await bot.sendMessage({
            chat_id: chatId,
            text: "❌ Your account was not linked.",
          })
        }
      }
    }

    // Handle callback queries (inline button presses)
    if (update.callback_query) {
      const { callback_query } = update
      const chatId = callback_query.message.chat.id
      const data = callback_query.data

      if (data?.startsWith("rental_")) {
        const rentalId = data.split("_")[1]

        await bot.sendMessage({
          chat_id: chatId,
          text: `🔗 View rental details: ${process.env.NEXT_PUBLIC_APP_URL}/rental/${rentalId}`,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Open in App",
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/rental/${rentalId}`,
                },
              ],
            ],
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
