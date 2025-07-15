"use client"

import React from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'sm', 
  showValue = false,
  className = ""
}: StarRatingProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const starSize = sizeClasses[size]

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= Math.floor(rating)
          const isHalfFilled = starValue === Math.ceil(rating) && rating % 1 !== 0

          return (
            <Star
              key={index}
              className={`${starSize} ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isHalfFilled
                  ? 'fill-yellow-200 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
