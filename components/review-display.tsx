"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, User, ChevronDown, ChevronUp } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reviewee: {
    id: string
    full_name: string
  }
  item?: {
    id: string
    title: string
    images: string[]
  }
}

interface ReviewDisplayProps {
  itemId?: string
  userId?: string
  showItemInfo?: boolean
  maxHeight?: string
}

export function ReviewDisplay({ itemId, userId, showItemInfo = false, maxHeight }: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [itemId, userId])

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams()
      if (itemId) params.append('item_id', itemId)
      if (userId) params.append('user_id', userId)
      params.append('limit', '50')

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews)
      } else {
        setError(data.error || 'Failed to load reviews')
      }
    } catch (err) {
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (itemId) params.append('item_id', itemId)
      if (userId) params.append('user_id', userId)

      const response = await fetch(`/api/reviews/stats?${params}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load review stats:', err)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-black">
          Reviews ({stats.totalReviews})
        </CardTitle>
        {stats.totalReviews > 0 && (
          <CardDescription>
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.averageRating), 'md')}
              <span className="font-medium text-black">
                {stats.averageRating.toFixed(1)} out of 5
              </span>
              <span className="text-gray-600">
                ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <>
            <div className={`space-y-4 ${maxHeight ? `max-h-${maxHeight} overflow-y-auto` : ''}`}>
              {displayedReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewer.avatar_url} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-black text-sm">
                            {review.reviewer.full_name}
                          </h4>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      
                      {showItemInfo && review.item && (
                        <p className="text-xs text-gray-600 mb-2">
                          Review for: {review.item.title}
                        </p>
                      )}
                      
                      {review.comment && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="border-black hover:bg-black hover:text-white"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show All {reviews.length} Reviews
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
