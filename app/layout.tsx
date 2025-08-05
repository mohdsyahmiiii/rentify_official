import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Suspense } from "react"
import { ChatModalProvider } from "@/contexts/chat-modal-context"
import { UserProvider } from "@/contexts/user-context"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rentify - Peer-to-Peer Rental Platform",
  description: "Rent anything, anytime. The ultimate peer-to-peer rental marketplace.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <ChatModalProvider>
            <LayoutWrapper>
              <Suspense>{children}</Suspense>
            </LayoutWrapper>
            <Toaster />

        {/* Footer */}
        <footer className="bg-black text-white py-12 mt-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4 justify-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-lg">R</span>
                  </div>
                  <span className="text-xl font-bold">Rentify</span>
                </div>
                <p className="text-gray-300">The ultimate peer-to-peer rental marketplace. Rent anything, anytime.</p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-300">© 2025 Rentify. All rights reserved.</p>
            </div>
          </div>
        </footer>
          </ChatModalProvider>
        </UserProvider>
      </body>
    </html>
  )
}
