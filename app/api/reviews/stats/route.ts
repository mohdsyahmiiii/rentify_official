import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get review statistics for an item or user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')
    const userId = searchParams.get('user_id')

    if (!itemId && !userId) {
      return NextResponse.json({ error: "Either item_id or user_id is required" }, { status: 400 })
    }

    let query = supabase
      .from('reviews')
      .select('rating')
      .eq('is_public', true)

    if (itemId) {
      query = query.eq('item_id', itemId)
    } else if (userId) {
      query = query.eq('reviewee_id', userId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching review stats:', error)
      return NextResponse.json({ error: 'Failed to fetch review statistics' }, { status: 500 })
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          }
        }
      })
    }

    // Calculate statistics
    const totalReviews = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = Math.round((totalRating / totalReviews) * 100) / 100

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    }

    return NextResponse.json({
      success: true,
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution
      }
    })
  } catch (error) {
    console.error('Error in GET /api/reviews/stats:', error)
    return NextResponse.json({ error: 'Failed to fetch review statistics' }, { status: 500 })
  }
}
