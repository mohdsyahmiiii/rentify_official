import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ 
        error: "Item ID is required" 
      }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get availability blocks for the item
    const { data: blocks, error } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('item_id', itemId)
      .eq('owner_id', user.id) // Only owner can see their blocks
      .order('start_date')

    if (error) {
      console.error("Error fetching availability blocks:", error)
      return NextResponse.json({ 
        error: "Failed to fetch availability blocks" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      blocks: blocks || []
    })

  } catch (error) {
    console.error("Error in availability-blocks GET API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { itemId, startDate, endDate, reason, notes } = await request.json()

    if (!itemId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: "Item ID, start date, and end date are required" 
      }, { status: 400 })
    }

    // Validate dates
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

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user owns the item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('owner_id')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.owner_id !== user.id) {
      return NextResponse.json({ 
        error: "You can only manage availability for your own items" 
      }, { status: 403 })
    }

    // Check for existing rentals in this period using database function
    const { data: hasConflicts, error: rentalError } = await supabase
      .rpc('is_item_available', {
        p_item_id: itemId,
        p_start_date: startDate,
        p_end_date: endDate
      })

    // If not available, get the conflicting rentals for details
    let conflictingRentals = null
    if (!hasConflicts) {
      const { data: rentals } = await supabase
        .from('rentals')
        .select('id, start_date, end_date')
        .eq('item_id', itemId)
        .in('status', ['pending_pickup', 'active'])
        .gte('end_date', startDate)
        .lte('start_date', endDate)

      conflictingRentals = rentals
    }

    if (rentalError) {
      console.error("Error checking rental conflicts:", rentalError)
      return NextResponse.json({
        error: "Failed to check for conflicts"
      }, { status: 500 })
    }

    if (!hasConflicts) {
      return NextResponse.json({
        error: "Cannot block dates that have existing active rentals",
        conflicts: conflictingRentals
      }, { status: 400 })
    }

    // Create the availability block
    const { data: block, error: blockError } = await supabase
      .from('availability_blocks')
      .insert({
        item_id: itemId,
        owner_id: user.id,
        start_date: startDate,
        end_date: endDate,
        reason: reason || 'Maintenance',
        notes: notes || null
      })
      .select()
      .single()

    if (blockError) {
      console.error("Error creating availability block:", blockError)
      return NextResponse.json({ 
        error: "Failed to create availability block" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      block,
      message: "Availability block created successfully"
    })

  } catch (error) {
    console.error("Error in availability-blocks POST API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('blockId')

    if (!blockId) {
      return NextResponse.json({ 
        error: "Block ID is required" 
      }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Delete the block (RLS will ensure user can only delete their own blocks)
    const { error: deleteError } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('id', blockId)
      .eq('owner_id', user.id)

    if (deleteError) {
      console.error("Error deleting availability block:", deleteError)
      return NextResponse.json({ 
        error: "Failed to delete availability block" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Availability block deleted successfully"
    })

  } catch (error) {
    console.error("Error in availability-blocks DELETE API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
