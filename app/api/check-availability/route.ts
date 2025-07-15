import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { itemId, startDate, endDate, excludeRentalId } = await request.json()

    if (!itemId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: "Item ID, start date, and end date are required" 
      }, { status: 400 })
    }

    // Validate date format and logic
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ 
        error: "Invalid date format" 
      }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ 
        error: "End date must be after start date" 
      }, { status: 400 })
    }

    if (start < new Date()) {
      return NextResponse.json({ 
        error: "Start date cannot be in the past" 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Use the database function to check availability
    const { data: availabilityResult, error: availabilityError } = await supabase
      .rpc('is_item_available', {
        p_item_id: itemId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_exclude_rental_id: excludeRentalId || null
      })

    if (availabilityError) {
      console.error("Error checking availability:", availabilityError)
      return NextResponse.json({ 
        error: "Failed to check availability" 
      }, { status: 500 })
    }

    const isAvailable = availabilityResult

    // If not available, get details about conflicts
    let conflictDetails = null
    if (!isAvailable) {
      // Check what's causing the conflict
      const { data: conflicts } = await supabase
        .from('rentals')
        .select('start_date, end_date, status')
        .eq('item_id', itemId)
        .in('status', ['pending_pickup', 'active'])
        .overlaps('start_date', 'end_date', startDate, endDate)

      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('start_date, end_date, reason')
        .eq('item_id', itemId)
        .overlaps('start_date', 'end_date', startDate, endDate)

      conflictDetails = {
        rentals: conflicts || [],
        blocks: blocks || []
      }
    }

    // Get next available date
    const { data: nextAvailableDate, error: nextDateError } = await supabase
      .rpc('get_next_available_date', {
        p_item_id: itemId
      })

    if (nextDateError) {
      console.error("Error getting next available date:", nextDateError)
    }

    return NextResponse.json({
      success: true,
      available: isAvailable,
      nextAvailableDate: nextAvailableDate || null,
      conflictDetails: conflictDetails,
      checkedDates: {
        startDate,
        endDate
      }
    })

  } catch (error) {
    console.error("Error in check-availability API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!itemId) {
      return NextResponse.json({ 
        error: "Item ID is required" 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // If dates provided, check specific availability
    if (startDate && endDate) {
      const { data: isAvailable, error } = await supabase
        .rpc('is_item_available', {
          p_item_id: itemId,
          p_start_date: startDate,
          p_end_date: endDate
        })

      if (error) {
        console.error("Error checking availability:", error)
        return NextResponse.json({ 
          error: "Failed to check availability" 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        available: isAvailable
      })
    }

    // Otherwise, get general availability info
    const { data: item, error: itemError } = await supabase
      .from('item_availability')
      .select('*')
      .eq('item_id', itemId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ 
        error: "Item not found" 
      }, { status: 404 })
    }

    // Get upcoming unavailable periods
    const { data: upcomingRentals } = await supabase
      .from('rentals')
      .select('start_date, end_date, status')
      .eq('item_id', itemId)
      .in('status', ['pending_pickup', 'active'])
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date')

    const { data: upcomingBlocks } = await supabase
      .from('availability_blocks')
      .select('start_date, end_date, reason')
      .eq('item_id', itemId)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date')

    return NextResponse.json({
      success: true,
      item: {
        id: item.item_id,
        title: item.title,
        baseAvailable: item.base_available,
        nextAvailableDate: item.next_available_date
      },
      upcomingUnavailable: {
        rentals: upcomingRentals || [],
        blocks: upcomingBlocks || []
      }
    })

  } catch (error) {
    console.error("Error in check-availability GET API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
