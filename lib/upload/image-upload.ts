import { put } from "@vercel/blob"

export interface UploadResult {
  url: string
  pathname: string
  contentType: string
  contentDisposition: string
}

export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image")
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB")
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    const filename = `items/${timestamp}-${randomString}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      contentDisposition: `inline; filename="${file.name}"`,
    }
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}

export async function uploadMultipleImages(files: FileList): Promise<UploadResult[]> {
  const uploadPromises = Array.from(files).map((file) => uploadImage(file))
  return Promise.all(uploadPromises)
}
