"use client"

import { useState, useEffect } from "react"
import { ConversationItem } from "@/components/conversation-item"
import { useChatModal } from "@/contexts/chat-modal-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MessageCircle, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Conversation {
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

interface MessagesListProps {
  user: User | null
}

export function MessagesList({ user }: MessagesListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { openChat } = useChatModal()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchConversations()
      const cleanup = setupRealtimeSubscription()
      return cleanup
    }
  }, [user])

  const fetchConversations = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get all messages where current user is the recipient
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
          items(title, images)
        `)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching conversations:", error)
        setConversations([])
        return
      }

      // Group messages by sender and item to create conversations
      const conversationMap = new Map<string, Conversation>()

      messages?.forEach((message) => {
        const key = `${message.sender_id}-${message.item_id}`
        
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: key,
            sender_id: message.sender_id,
            sender_name: message.sender?.full_name || "Unknown",
            sender_avatar: message.sender?.avatar_url,
            item_id: message.item_id,
            item_title: message.items?.title || "Unknown Item",
            item_image: message.items?.images?.[0],
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
          })
        }

        // Count unread messages
        if (!message.is_read) {
          const conversation = conversationMap.get(key)!
          conversation.unread_count++
        }

        // Update with latest message if this is more recent
        const conversation = conversationMap.get(key)!
        if (new Date(message.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = message.content
          conversation.last_message_time = message.created_at
        }
      })

      // Convert map to array and sort by last message time
      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())

      setConversations(conversationsList)
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const channel = supabase
      .channel("user-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Refresh conversations when new message arrives
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleConversationClick = (conversation: Conversation) => {
    openChat({
      recipientId: conversation.sender_id,
      recipientName: conversation.sender_name,
      itemId: conversation.item_id,
      itemTitle: conversation.item_title
    })
    // Refresh conversations to update unread counts after a short delay
    setTimeout(() => {
      fetchConversations()
    }, 500)
  }

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.item_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  return (
    <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Messages
              {totalUnreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {totalUnreadCount}
                </span>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConversations}
              disabled={loading}
              className="border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No conversations found" : "No messages yet"}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "When someone messages you about your items, conversations will appear here"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  onClick={() => handleConversationClick(conversation)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  )
}
