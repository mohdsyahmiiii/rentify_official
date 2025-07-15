"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"

interface ReviewFormProps {
  rentalId: string
  itemTitle: string
  revieweeName: string
  isOwner: boolean
  onReviewSubmitted?: () => void
}

export function ReviewForm({ 
  rentalId, 
  itemTitle, 
  revieweeName, 
  isOwner, 
  onReviewSubmitted 
}: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          rating,
          comment: comment.trim() || null
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        onReviewSubmitted?.()
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          setRating(0)
          setComment("")
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Leave Review
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Review Submitted!</h3>
            <p className="text-gray-600">Thank you for your feedback.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <MessageSquare className="w-4 h-4 mr-2" />
          Leave Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience with {isOwner ? 'the renter' : revieweeName} for "{itemTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center space-x-2">
              {renderStars()}
              {rating > 0 && (
                <span className="text-sm text-gray-600 ml-2">
                  {rating} star{rating > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder={`Share your experience with ${isOwner ? 'the renter' : revieweeName}...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || rating === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
