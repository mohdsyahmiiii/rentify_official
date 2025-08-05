"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Star, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { TelegramLink } from "@/components/telegram-link"
import { useUser } from "@/contexts/user-context"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  is_verified: boolean
  rating: number
  total_reviews: number
  joined_at: string
  telegram_chat_id?: string
  telegram_username?: string
  telegram_linked_at?: string
}

export default function ProfilePage() {
  const { forceReinitialize } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    console.log("🔄 Profile: Fetching profile data...")

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("❌ Profile: Authentication error:", authError)
        setLoading(false)
        return
      }

      if (!user) {
        console.error("❌ Profile: No authenticated user found")
        setLoading(false)
        return
      }

      console.log("✅ Profile: User authenticated:", user.id)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("❌ Profile: Error fetching profile data:", profileError)
        setLoading(false)
        return
      }

      if (profileData) {
        console.log("✅ Profile: Profile data fetched successfully")
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          date_of_birth: profileData.date_of_birth || "",
        })
      } else {
        console.log("⚠️ Profile: No profile data found for user")
      }
    } catch (error) {
      console.error("❌ Profile: Unexpected error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) {
      console.error("❌ Profile: No profile data available for update")
      setSaveMessage({ type: 'error', text: 'No profile data available. Please refresh the page.' })
      return
    }

    console.log("🔄 Profile: Starting profile update...", { userId: profile.id, formData })
    setSaving(true)
    setSaveMessage(null)

    // Set a timeout for the save operation
    const timeoutId = setTimeout(() => {
      console.error("⚠️ Profile: Save operation timeout")
      setSaveMessage({ type: 'error', text: 'Save operation is taking too long. Please try again.' })
      setSaving(false)
    }, 15000)

    try {
      const supabase = createClient()

      // Verify user is still authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error("❌ Profile: Authentication error during update:", authError)
        setSaveMessage({ type: 'error', text: 'Authentication error. Please refresh the page and try again.' })
        clearTimeout(timeoutId)
        setSaving(false)
        return
      }

      console.log("✅ Profile: User authenticated, proceeding with update...")

      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      console.log("📝 Profile: Updating with data:", updateData)

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id)
        .select()

      console.log("📊 Profile: Update result:", { data, error })

      clearTimeout(timeoutId)

      if (error) {
        console.error("❌ Profile: Database update failed:", error)
        setSaveMessage({ type: 'error', text: `Failed to update profile: ${error.message}` })
      } else {
        console.log("✅ Profile: Update successful!")
        setProfile({ ...profile, ...formData })
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })

        // Nuclear option: Force complete auth reinitialize after profile update
        console.log('💥 Profile: Triggering auth reinitialize after profile update')
        await forceReinitialize()

        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error("❌ Profile: Unexpected error during save:", error)
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
      clearTimeout(timeoutId)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Profile not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-black">Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20 border-2">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  ) : null}
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    <User className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-black">{profile.full_name}</h3>
                  <p className="text-gray-600">{profile.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {profile.is_verified && (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-black ml-1">{profile.rating}</span>
                      <span className="text-sm text-gray-600 ml-1">({profile.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-black font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="border-gray-300 focus:border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-black font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-gray-300 focus:border-black"
                  />
                </div>
              </div>



              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-black font-medium">
                  Date of Birth
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="border-gray-300 focus:border-black"
                />
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {saveMessage.text}
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full bg-black text-white hover:bg-gray-800">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Telegram Integration */}
          <TelegramLink
            userId={profile.id}
            telegramChatId={profile.telegram_chat_id}
            telegramUsername={profile.telegram_username}
            telegramLinkedAt={profile.telegram_linked_at}
          />
        </div>

        {/* Profile Stats */}
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-black">Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-black">Member since</span>
                </div>
                <span className="text-gray-600">{new Date(profile.joined_at).getFullYear()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-black">Rating</span>
                </div>
                <span className="text-gray-600">{profile.rating}/5.0</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-black">Reviews</span>
                </div>
                <span className="text-gray-600">{profile.total_reviews}</span>
              </div>

              {profile.is_verified && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-black">Verification</span>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-black">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-black">{profile.email}</span>
              </div>

              {profile.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-black">{profile.phone}</span>
                </div>
              )}


            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
