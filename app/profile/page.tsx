"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Calendar, Star, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { TelegramLink } from "@/components/telegram-link"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  bio?: string
  location?: string
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
    location: "",
    date_of_birth: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData) {
          setProfile(profileData)
          setFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            bio: profileData.bio || "",
            location: profileData.location || "",
            date_of_birth: profileData.date_of_birth || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (!error) {
        setProfile({ ...profile, ...formData })
      }
    } catch (error) {
      console.error("Error saving profile:", error)
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
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
                  <AvatarFallback className="bg-black text-white text-xl">
                    {profile.full_name?.charAt(0) || "U"}
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
                <Label htmlFor="location" className="text-black font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border-gray-300 focus:border-black"
                  placeholder="City, State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-black font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="border-gray-300 focus:border-black"
                  placeholder="Tell others about yourself..."
                  rows={4}
                />
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

              {profile.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-black">{profile.location}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
