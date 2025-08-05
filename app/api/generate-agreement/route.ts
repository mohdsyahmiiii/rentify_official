import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { deepseek } from "@/lib/ai/deepseek"
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

    const { rentalId } = await request.json()

    // Get rental details with item and user information
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        *,
        items (
          title,
          description,
          price_per_day,
          security_deposit,
          cancellation_policy,
          damage_policy,
          late_fee_per_day,
          features,
          profiles!items_owner_id_fkey (
            full_name,
            email,
            phone,
            location
          )
        ),
        profiles!rentals_renter_id_fkey (
          full_name,
          email,
          phone,
          location
        )
      `)
      .eq("id", rentalId)
      .eq("renter_id", user.id)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    const itemData = rental.items
    const renterData = rental.profiles

    // Generate custom agreement using DeepSeek AI with timeout and error handling
    let agreement
    try {
      // Add timeout to prevent hanging (25 seconds to stay under Vercel 30s limit)
      const generatePromise = generateText({
        model: deepseek("deepseek-chat"),
        system: `You are a legal document generator for Malaysian rental agreements. Generate a comprehensive rental agreement that complies with Malaysian law. Use Malaysian Ringgit (RM) currency. MEET-UP ONLY platform - no delivery service.`,
        prompt: `Generate a Malaysian rental agreement for:

Item: ${itemData.title}
Daily Rate: RM${rental.price_per_day}
Period: ${rental.start_date} to ${rental.end_date} (${rental.total_days} days)
Total: RM${rental.total_amount}
Security Deposit: RM${itemData.security_deposit || 0}

Owner: ${itemData.profiles.full_name} (${itemData.profiles.email})
Renter: ${renterData.full_name} (${renterData.email})

Generate a rental agreement with:
1. Parties and item details
2. Rental period and payment (RM currency)
3. Meet-up collection/return (no delivery)
4. Security deposit and damage policy
5. Cancellation terms
6. Signatures section

Format with clear headings and professional language.`,
      })

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 25000)
      )

      // Race between generation and timeout
      const result = await Promise.race([generatePromise, timeoutPromise]) as any
      agreement = result.text

    } catch (aiError: any) {
      console.error("AI generation failed:", aiError.message || aiError)

      // Fallback to basic template if AI fails
      agreement = `RENTAL AGREEMENT

PARTIES:
Owner (Lessor): ${itemData.profiles.full_name}
Email: ${itemData.profiles.email}
Phone: ${itemData.profiles.phone || "Not provided"}

Renter (Lessee): ${renterData.full_name}
Email: ${renterData.email}
Phone: ${renterData.phone || "Not provided"}

ITEM DETAILS:
Item: ${itemData.title}
Description: ${itemData.description}
Daily Rate: RM${rental.price_per_day}
Security Deposit: RM${itemData.security_deposit || 0}

RENTAL PERIOD:
Start Date: ${rental.start_date}
End Date: ${rental.end_date}
Total Days: ${rental.total_days}
Total Amount: RM${rental.total_amount}

TERMS AND CONDITIONS:
1. This is a peer-to-peer rental agreement governed by Malaysian law.
2. Collection and return must be arranged through direct meet-up (no delivery service).
3. Renter is responsible for the item's care and safe return.
4. Security deposit will be refunded upon satisfactory return of the item.
5. Late returns incur a fee of RM${itemData.late_fee_per_day || 10} per day.
6. Any damage beyond normal wear and tear will be deducted from the security deposit.
7. Cancellation must be made 24 hours in advance for full refund.

SIGNATURES:
Owner: _________________________ Date: _________
Renter: ________________________ Date: _________

This agreement is binding upon both parties and governed by Malaysian law.`
    }

    // Save the generated agreement to the database
    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        rental_agreement: agreement,
        agreement_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)

    if (updateError) {
      console.error("Error saving agreement:", updateError)
      return NextResponse.json({ error: "Failed to save agreement" }, { status: 500 })
    }

    return NextResponse.json({
      agreement,
      success: true,
    })
  } catch (error) {
    console.error("Error generating agreement:", error)
    return NextResponse.json({ error: "Failed to generate agreement" }, { status: 500 })
  }
}
