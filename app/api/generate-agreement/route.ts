import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { deepseek } from "@/lib/ai/deepseek"
import { createClient } from "@/lib/supabase/server"

// Generate demo agreement for demo items
async function generateDemoAgreement() {
  const { text: agreement } = await generateText({
    model: deepseek("deepseek-chat"),
    system: `You are a legal document generator specializing in rental agreements for Malaysia. Generate a comprehensive, legally sound rental agreement that complies with Malaysian law and is fair to both parties. Use Malaysian Ringgit (RM) currency format and include all necessary clauses for protection and clarity. Make the language professional yet easy to understand.`,
    prompt: `Generate a detailed rental agreement for the following DEMO rental:

ITEM DETAILS:
- Item: Professional DSLR Camera
- Description: Canon EOS 5D Mark IV with 24-70mm lens, perfect for professional photography
- Features: High-resolution sensor, dual memory card slots, weather sealing
- Daily Rate: RM120
- Security Deposit: RM200

RENTAL PERIOD:
- Start Date: [To be filled by renter]
- End Date: [To be filled by renter]
- Total Days: [To be calculated]
- Total Amount: [To be calculated]

OWNER (LESSOR):
- Name: John Doe (Demo Owner)
- Email: demo.owner@rentify.com
- Phone: +60 12-345-6789
- Location: Kuala Lumpur, Malaysia

RENTER (LESSEE):
- Name: [Demo Renter]
- Email: demo.renter@rentify.com
- Phone: [To be provided]
- Location: [To be provided]

POLICIES:
- Cancellation Policy: 24-hour cancellation policy with full refund
- Damage Policy: Renter is responsible for any damage beyond normal wear and tear
- Late Fee: RM10 per day for late returns

DELIVERY:
- Method: Pickup or Delivery
- Address: [To be specified]
- Special Instructions: Handle with care, professional equipment

Please generate a comprehensive rental agreement that includes:
1. Parties identification with full contact details
2. Item description and condition assessment
3. Rental period and payment terms (in Malaysian Ringgit)
4. Security deposit terms and refund conditions
5. Delivery/pickup arrangements and responsibilities
6. Care and maintenance responsibilities
7. Damage and liability clauses
8. Cancellation and return policies
9. Late fees and penalties
10. Insurance and risk allocation
11. Dispute resolution (Malaysian jurisdiction)
12. Force majeure clause
13. Signatures section with date and location

Format the agreement with clear headings, numbered sections, and professional legal language suitable for Malaysia. Include a proper title "RENTAL AGREEMENT" at the top. Make it comprehensive yet easy to understand for both parties. Mark this as a DEMO AGREEMENT for demonstration purposes.`,
  })

  return agreement
}

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

    // Check if this is a demo rental
    if (rentalId.startsWith('demo-rental-')) {
      // For demo rentals, create a sample agreement
      const demoAgreement = await generateDemoAgreement()
      return NextResponse.json({
        agreement: demoAgreement,
        success: true,
      })
    }

    // Get rental details with item and user information for real rentals
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

    // Handle demo items with fallback data
    const itemData = rental.items || {
      title: "Demo Item",
      description: "Demo rental item",
      price_per_day: rental.price_per_day || 100,
      security_deposit: 0,
      cancellation_policy: "Standard 24-hour cancellation policy",
      damage_policy: "Renter is responsible for any damage beyond normal wear and tear",
      late_fee_per_day: 10,
      features: [],
      profiles: {
        full_name: "Demo Owner",
        email: "owner@demo.com",
        phone: "Not provided",
        location: "Demo Location"
      }
    }

    const renterData = rental.profiles || {
      full_name: "Demo Renter",
      email: "renter@demo.com",
      phone: "Not provided",
      location: "Demo Location"
    }

    // Generate custom agreement using DeepSeek AI
    const { text: agreement } = await generateText({
      model: deepseek("deepseek-chat"),
      system: `You are a legal document generator specializing in rental agreements for Malaysia. Generate a comprehensive, legally sound rental agreement that complies with Malaysian law and is fair to both parties. Use Malaysian Ringgit (RM) currency format and include all necessary clauses for protection and clarity. Make the language professional yet easy to understand.`,
      prompt: `Generate a detailed rental agreement for the following rental:

ITEM DETAILS:
- Item: ${itemData.title}
- Description: ${itemData.description}
- Features: ${itemData.features?.join(", ") || "N/A"}
- Daily Rate: RM${rental.price_per_day}
- Security Deposit: RM${itemData.security_deposit || 0}

RENTAL PERIOD:
- Start Date: ${rental.start_date}
- End Date: ${rental.end_date}
- Total Days: ${rental.total_days}
- Total Amount: RM${rental.total_amount}

OWNER (LESSOR):
- Name: ${itemData.profiles.full_name}
- Email: ${itemData.profiles.email}
- Phone: ${itemData.profiles.phone || "Not provided"}
- Location: ${itemData.profiles.location}

RENTER (LESSEE):
- Name: ${renterData.full_name}
- Email: ${renterData.email}
- Phone: ${renterData.phone || "Not provided"}
- Location: ${renterData.location}

POLICIES:
- Cancellation Policy: ${itemData.cancellation_policy || "Standard 24-hour cancellation policy"}
- Damage Policy: ${itemData.damage_policy || "Renter is responsible for any damage beyond normal wear and tear"}
- Late Fee: RM${itemData.late_fee_per_day || 10} per day for late returns

DELIVERY:
- Method: ${rental.delivery_method}
- Address: ${rental.delivery_address || "Pickup at owner location"}
- Special Instructions: ${rental.special_instructions || "None"}

Please generate a comprehensive rental agreement that includes:
1. Parties identification with full contact details
2. Item description and condition assessment
3. Rental period and payment terms (in Malaysian Ringgit)
4. Security deposit terms and refund conditions
5. Delivery/pickup arrangements and responsibilities
6. Care and maintenance responsibilities
7. Damage and liability clauses
8. Cancellation and return policies
9. Late fees and penalties
10. Insurance and risk allocation
11. Dispute resolution (Malaysian jurisdiction)
12. Force majeure clause
13. Signatures section with date and location

Format the agreement with clear headings, numbered sections, and professional legal language suitable for Malaysia. Include a proper title "RENTAL AGREEMENT" at the top. Make it comprehensive yet easy to understand for both parties.`,
    })

    // Save the generated agreement to the database (only for real rentals)
    if (!rentalId.startsWith('demo-rental-')) {
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
