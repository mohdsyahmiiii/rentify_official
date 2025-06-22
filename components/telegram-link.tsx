"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Link2, Unlink, Copy, Check, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TelegramLinkProps {
  userId: string
  telegramChatId?: string
  telegramUsername?: string
  telegramLinkedAt?: string
}

export function TelegramLink({ userId, telegramChatId, telegramUsername, telegramLinkedAt }: TelegramLinkProps) {
  const [linkToken, setLinkToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLinked, setIsLinked] = useState(!!telegramChatId)

  const generateLinkToken = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const { error } = await supabase
        .from("profiles")
        .update({
          telegram_link_token: token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (!error) {
        setLinkToken(token)
      }
    } catch (error) {
      console.error("Error generating link token:", error)
    } finally {
      setLoading(false)
    }
  }

  const unlinkTelegram = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          telegram_chat_id: null,
          telegram_username: null,
          telegram_linked_at: null,
          telegram_link_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (!error) {
        setIsLinked(false)
        setLinkToken("")
      }
    } catch (error) {
      console.error("Error unlinking Telegram:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyLinkToClipboard = async () => {
    const telegramLink = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=${linkToken}`
    await navigator.clipboard.writeText(telegramLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openTelegramBot = () => {
    const telegramLink = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=${linkToken}`
    window.open(telegramLink, "_blank")
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-black">Telegram Notifications</CardTitle>
          </div>
          {isLinked && <Badge className="bg-green-500 hover:bg-green-600">Connected</Badge>}
        </div>
        <CardDescription>Get rental reminders and updates directly on Telegram</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLinked ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your Telegram account is connected! You'll receive notifications for:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Rental start reminders</li>
                  <li>Return reminders</li>
                  <li>Payment confirmations</li>
                  <li>Booking updates</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Connected Account</p>
                  <p className="text-sm text-gray-600">
                    @{telegramUsername || "Unknown"} • Connected{" "}
                    {telegramLinkedAt ? new Date(telegramLinkedAt).toLocaleDateString() : "recently"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={unlinkTelegram}
                  disabled={loading}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">Connect Telegram</h3>
              <p className="text-gray-600 mb-6">
                Link your Telegram account to receive instant notifications about your rentals.
              </p>

              {!linkToken ? (
                <Button
                  onClick={generateLinkToken}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {loading ? "Generating..." : "Generate Link"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Click the button below to open Telegram and link your account:
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button onClick={openTelegramBot} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Telegram Bot
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copyLinkToClipboard}
                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Or copy this link and send it to our bot: @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
