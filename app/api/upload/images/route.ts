import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadMultipleImages } from "@/lib/upload/image-upload"

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

    const formData = await request.formData()
    const files = formData.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Validate number of files (max 10)
    if (files.length > 10) {
      return NextResponse.json({ error: "Maximum 10 images allowed" }, { status: 400 })
    }

    // Upload all images
    const uploadResults = await uploadMultipleImages(files as any)

    // Extract URLs for database storage
    const imageUrls = uploadResults.map((result) => result.url)

    return NextResponse.json({
      success: true,
      images: uploadResults,
      urls: imageUrls,
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
