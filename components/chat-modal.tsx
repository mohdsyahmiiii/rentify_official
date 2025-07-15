"use client"

import { useState, useEffect, useRef } from "react"
import { SimpleModal } from "@/components/simple-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Message {
  id: string
  content: string
  sender_id: string
  recipient_id: string
  item_id?: string
  created_at: string
  is_read: boolean
  sender?: {
    full_name: string
    avatar_url?: string
  }
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
  itemId?: string
  itemTitle?: string
}

export function ChatModal({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName, 
  itemId, 
  itemTitle 
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  // Fetch messages when modal opens
  useEffect(() => {
    if (isOpen && user && recipientId) {
      fetchMessages()
      const cleanup = setupRealtimeSubscription()
      return cleanup
    }
  }, [isOpen, user, recipientId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .eq("item_id", itemId || null)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching messages:", error)
        return
      }

      setMessages(data || [])
      
      // Mark messages as read
      await markMessagesAsRead()
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const markMessagesAsRead = async () => {
    if (!user) return

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("sender_id", recipientId)
        .eq("is_read", false)
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message
          if (newMessage.sender_id === recipientId) {
            // Fetch sender profile for the new message
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single()

            const messageWithSender = {
              ...newMessage,
              sender: senderProfile
            }

            setMessages((prev) => [...prev, messageWithSender])
            markMessagesAsRead()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || loading) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setLoading(true)

    // Optimistically add message to UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: user.id,
      recipient_id: recipientId,
      item_id: itemId || null,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          item_id: itemId || null,
          content: messageContent,
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error sending message:", error)
        // Remove temp message on error
        setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id))
        setNewMessage(messageContent) // Restore message content
        return
      }

      // Replace temp message with real message
      setMessages((prev) =>
        prev.map(msg => msg.id === tempMessage.id ? data : msg)
      )
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove temp message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id))
      setNewMessage(messageContent) // Restore message content
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Force immediate cleanup before calling onClose
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      onClose()
    }
  }



  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleOpenChange}
      title={
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg">{recipientName}</div>
            {itemTitle && (
              <p className="text-sm text-gray-500">About: {itemTitle}</p>
            )}
          </div>
        </div>
      }
    >

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.sender_id === user?.id
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === user?.id
                        ? "text-gray-300"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || loading}
              size="icon"
              className="bg-black text-white hover:bg-gray-800"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
    </SimpleModal>
  )
}
