"use client"

import React, { createContext, useContext, useState } from 'react'
import { ChatModal } from '@/components/chat-modal'

interface ChatModalContextType {
  openChat: (conversation: {
    recipientId: string
    recipientName: string
    itemId: string
    itemTitle: string
  }) => void
  closeChat: () => void
  isOpen: boolean
}

const ChatModalContext = createContext<ChatModalContextType | undefined>(undefined)

export function ChatModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [conversation, setConversation] = useState<{
    recipientId: string
    recipientName: string
    itemId: string
    itemTitle: string
  } | null>(null)

  const openChat = (newConversation: {
    recipientId: string
    recipientName: string
    itemId: string
    itemTitle: string
  }) => {
    setConversation(newConversation)
    setIsOpen(true)
    setModalKey(prev => prev + 1)
  }

  const closeChat = () => {
    setIsOpen(false)
    // Delay clearing conversation to allow modal to close properly
    setTimeout(() => {
      setConversation(null)
      setModalKey(prev => prev + 1)
    }, 200)
  }

  return (
    <ChatModalContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      {/* Global Chat Modal */}
      {conversation && isOpen && (
        <ChatModal
          key={modalKey}
          isOpen={isOpen}
          onClose={closeChat}
          recipientId={conversation.recipientId}
          recipientName={conversation.recipientName}
          itemId={conversation.itemId}
          itemTitle={conversation.itemTitle}
        />
      )}
    </ChatModalContext.Provider>
  )
}

export function useChatModal() {
  const context = useContext(ChatModalContext)
  if (context === undefined) {
    throw new Error('useChatModal must be used within a ChatModalProvider')
  }
  return context
}
