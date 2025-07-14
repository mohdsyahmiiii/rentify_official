"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { UnreadBadge } from "@/components/unread-badge"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

interface ConversationItemProps {
  conversation: {
    id: string
    sender_id: string
    sender_name: string
    sender_avatar?: string
    item_id: string
    item_title: string
    item_image?: string
    last_message: string
    last_message_time: string
    unread_count: number
  }
  onClick: () => void
}

export function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + "..."
  }

  return (
    <Card 
      className="border-2 hover:border-black transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Sender Avatar */}
          <Avatar className="h-12 w-12 border-2">
            <AvatarImage src={conversation.sender_avatar || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-black text-white">
              {conversation.sender_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Conversation Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-black truncate">
                {conversation.sender_name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.last_message_time)}
                </span>
                <UnreadBadge count={conversation.unread_count} />
              </div>
            </div>

            {/* Item Info */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 relative rounded overflow-hidden border">
                <Image
                  src={conversation.item_image || "/placeholder.svg"}
                  alt={conversation.item_title}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm text-gray-600 truncate">
                About: {conversation.item_title}
              </span>
            </div>

            {/* Last Message */}
            <p className={`text-sm ${
              conversation.unread_count > 0 ? "font-medium text-black" : "text-gray-600"
            }`}>
              {truncateMessage(conversation.last_message)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
