import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get("recipientId")
    const itemId = searchParams.get("itemId")

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    // Fetch messages between current user and recipient for specific item
    const { data: messages, error } = await supabase
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
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId, itemId, content } = await request.json()

    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ error: "Recipient ID and content are required" }, { status: 400 })
    }

    // Insert new message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        item_id: itemId || null,
        content: content.trim(),
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { senderId } = await request.json()

    if (!senderId) {
      return NextResponse.json({ error: "Sender ID is required" }, { status: 400 })
    }

    // Mark messages as read
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("sender_id", senderId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking messages as read:", error)
      return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
