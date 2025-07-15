import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch reviews for an item or user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!itemId && !userId) {
      return NextResponse.json({ error: "Either item_id or user_id is required" }, { status: 400 })
    }

    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviews_reviewer_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        reviewee:profiles!reviews_reviewee_id_fkey (
          id,
          full_name
        ),
        item:items (
          id,
          title,
          images
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (itemId) {
      query = query.eq('item_id', itemId)
    } else if (userId) {
      query = query.eq('reviewee_id', userId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      count: reviews?.length || 0
    })
  } catch (error) {
    console.error('Error in GET /api/reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST - Create a new review
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

    const { rentalId, rating, comment } = await request.json()

    if (!rentalId || !rating) {
      return NextResponse.json({ error: "Rental ID and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Get rental details and verify user can review
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select(`
        id,
        renter_id,
        owner_id,
        item_id,
        status,
        return_confirmed_at
      `)
      .eq('id', rentalId)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if rental is completed
    if (rental.status !== 'completed') {
      return NextResponse.json({ error: "Can only review completed rentals" }, { status: 400 })
    }

    // Check if user is part of this rental
    if (rental.renter_id !== user.id && rental.owner_id !== user.id) {
      return NextResponse.json({ error: "You can only review your own rentals" }, { status: 403 })
    }

    // Determine who is being reviewed
    const revieweeId = rental.renter_id === user.id ? rental.owner_id : rental.renter_id

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('rental_id', rentalId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this rental" }, { status: 400 })
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        rental_id: rentalId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        item_id: rental.item_id,
        rating,
        comment: comment?.trim() || null,
        is_public: true
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Update reviewee's rating and review count
    await updateUserRating(supabase, revieweeId)

    return NextResponse.json({
      success: true,
      message: "Review created successfully",
      review
    })
  } catch (error) {
    console.error('Error in POST /api/reviews:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}

// Helper function to update user's average rating
async function updateUserRating(supabase: any, userId: string) {
  try {
    // Calculate new average rating and total reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId)
      .eq('is_public', true)

    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      const averageRating = totalRating / reviews.length
      const totalReviews = reviews.length

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
          total_reviews: totalReviews,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }
  } catch (error) {
    console.error('Error updating user rating:', error)
  }
}
