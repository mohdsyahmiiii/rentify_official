"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Menu } from "lucide-react"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"
import { MessageNotification } from "@/components/message-notification"
import { useChatModal } from "@/contexts/chat-modal-context"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Navigation() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { openChat } = useChatModal()
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleConversationClick = (conversation: {
    recipientId: string
    recipientName: string
    itemId: string
    itemTitle: string
  }) => {
    openChat(conversation)
  }

  return (
    <nav className="bg-white border-b-2 border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold text-black">Rentify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* List Item Button */}
            <Button asChild className="hidden md:flex bg-black text-white hover:bg-gray-800">
              <Link href="/list-item">
                <Plus className="w-4 h-4 mr-2" />
                List Item
              </Link>
            </Button>

            {/* Message Notification */}
            {user && <MessageNotification user={user} onConversationClick={handleConversationClick} />}

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
