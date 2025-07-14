"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UnreadBadge } from "@/components/unread-badge"
import { MessageCircle, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"

interface RecentMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  item_id: string
  item_title: string
  content: string
  created_at: string
  is_read: boolean
}

interface MessageNotificationProps {
  user: User | null
  onConversationClick: (conversation: {
    recipientId: string
    recipientName: string
    itemId: string
    itemTitle: string
  }) => void
}

export function MessageNotification({ user, onConversationClick }: MessageNotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      fetchRecentMessages()
      const cleanup = setupRealtimeSubscription()
      return cleanup
    }
  }, [user])

  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false)

      if (!error) {
        setUnreadCount(count || 0)
      } else {
        console.error("Error fetching unread count:", error)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
      setUnreadCount(0)
    }
  }

  const fetchRecentMessages = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
          items(title)
        `)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (!error && messages) {
        // Group messages by sender and item to create unique conversations
        const conversationMap = new Map<string, RecentMessage>()

        messages.forEach((msg) => {
          const key = `${msg.sender_id}-${msg.item_id}`
          const formattedMessage: RecentMessage = {
            id: msg.id,
            sender_id: msg.sender_id,
            sender_name: msg.sender?.full_name || "Unknown",
            sender_avatar: msg.sender?.avatar_url,
            item_id: msg.item_id,
            item_title: msg.items?.title || "Unknown Item",
            content: msg.content,
            created_at: msg.created_at,
            is_read: msg.is_read,
          }

          // Only keep the most recent message for each conversation
          if (!conversationMap.has(key) ||
              new Date(formattedMessage.created_at) > new Date(conversationMap.get(key)!.created_at)) {
            conversationMap.set(key, formattedMessage)
          }
        })

        // Convert map to array and sort by most recent
        const uniqueConversations = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5) // Limit to 5 most recent conversations

        setRecentMessages(uniqueConversations)
      } else {
        console.error("Error fetching recent messages:", error)
        setRecentMessages([])
      }
    } catch (error) {
      console.error("Error fetching recent messages:", error)
      setRecentMessages([])
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
          fetchRecentMessages()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
          fetchRecentMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  const truncateMessage = (message: string, maxLength: number = 40) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + "..."
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1">
              <UnreadBadge count={unreadCount} />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Messages</span>
          {unreadCount > 0 && (
            <UnreadBadge count={unreadCount} />
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <>
            {recentMessages.map((message) => (
              <DropdownMenuItem
                key={message.id}
                className="p-3 cursor-pointer"
                onClick={() => onConversationClick({
                  recipientId: message.sender_id,
                  recipientName: message.sender_name,
                  itemId: message.item_id,
                  itemTitle: message.item_title
                })}
              >
                <div className="flex items-start space-x-3 w-full">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={message.sender_avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-black text-white text-xs">
                      {message.sender_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-black truncate">
                        {message.sender_name}
                      </p>
                      <div className="flex items-center space-x-1">
                        {!message.is_read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      About: {message.item_title}
                    </p>
                    <p className="text-sm text-gray-700">
                      {truncateMessage(message.content)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full text-center p-3 text-sm font-medium">
                <Eye className="w-4 h-4 mr-2" />
                View All Messages
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
