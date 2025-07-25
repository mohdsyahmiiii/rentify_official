import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { TelegramNotificationService } from "@/lib/telegram/notifications"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const rentalId = session.metadata?.rental_id

        if (rentalId) {
          console.log(`🔍 WEBHOOK DEBUG: Processing rental ${rentalId}`)

          // Update rental status to pending_pickup (waiting for renter to confirm receipt)
          const { data: updateResult, error: updateError } = await supabase
            .from("rentals")
            .update({
              status: "pending_pickup",
              payment_status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", rentalId)
            .select()

          if (updateError) {
            console.error(`❌ WEBHOOK ERROR: Failed to update rental ${rentalId}:`, updateError)
          } else {
            console.log(`✅ WEBHOOK SUCCESS: Updated rental ${rentalId} to pending_pickup:`, updateResult)
          }

          // Get rental details for notifications
          const { data: rental } = await supabase
            .from("rentals")
            .select(`
        owner_id,
        renter_id,
        start_date,
        end_date,
        items(title)
      `)
            .eq("id", rentalId)
            .single()

          if (rental) {
            // Create notification for owner
            await supabase.from("notifications").insert({
              user_id: rental.owner_id,
              title: "New Rental Booking",
              message: `Your item "${rental.items.title}" has been booked! Please arrange pickup with the renter.`,
              type: "rental_confirmed",
              related_id: rentalId,
            })

            // Send Telegram notifications
            const telegramService = new TelegramNotificationService()

            // Notify renter
            await telegramService.sendRentalReminder({
              type: "confirmation",
              rentalId,
              userId: rental.renter_id,
              itemTitle: rental.items.title,
              message: `🎉 *Booking Confirmed!*\n\nYour rental of *${rental.items.title}* has been confirmed!\n\n📅 Rental Period: ${rental.start_date} to ${rental.end_date}\n\n📋 *Next Step:* Arrange pickup with the owner, then confirm receipt in your dashboard to start the rental.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            })

            // Notify owner
            await telegramService.sendRentalReminder({
              type: "confirmation",
              rentalId,
              userId: rental.owner_id,
              itemTitle: rental.items.title,
              message: `💰 *New Booking Received!*\n\nYour *${rental.items.title}* has been booked!\n\n📅 Rental Period: ${rental.start_date} to ${rental.end_date}\n\n📋 *Next Step:* Contact the renter to arrange pickup. The rental will become active once they confirm receipt.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            })
          }
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object
        const rentalId = paymentIntent.metadata?.rental_id

        if (rentalId) {
          await supabase
            .from("rentals")
            .update({
              payment_status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", rentalId)
        }
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object
        const rentalId = paymentIntent.metadata?.rental_id

        if (rentalId) {
          await supabase
            .from("rentals")
            .update({
              payment_status: "failed",
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", rentalId)
        }
        break
      }

      case "account.updated": {
        const account = event.data.object

        // Update user's Stripe account status
        await supabase
          .from("profiles")
          .update({
            stripe_account_id: account.id,
            stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", account.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
