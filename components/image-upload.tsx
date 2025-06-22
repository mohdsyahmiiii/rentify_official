"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  maxImages?: number
  existingImages?: string[]
  className?: string
}

export function ImageUpload({
  onImagesUploaded,
  maxImages = 10,
  existingImages = [],
  className = "",
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return

      // Check if adding these files would exceed the limit
      if (images.length + files.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`)
        return
      }

      setUploading(true)
      setError("")
      setUploadProgress(0)

      try {
        const formData = new FormData()
        Array.from(files).forEach((file) => {
          formData.append("images", file)
        })

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const response = await fetch("/api/upload/images", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Upload failed")
        }

        const newImages = [...images, ...data.urls]
        setImages(newImages)
        onImagesUploaded(newImages)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [images, maxImages, onImagesUploaded],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles],
  )

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index)
      setImages(newImages)
      onImagesUploaded(newImages)
    },
    [images, onImagesUploaded],
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-gray-600" />
              )}
            </div>

            {uploading ? (
              <div className="space-y-2">
                <p className="text-black font-medium">Uploading images...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-gray-600">{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-black mb-2">Upload Images</h3>
                <p className="text-gray-600 mb-4">Drag and drop images here, or click to select files</p>
                <p className="text-sm text-gray-500 mb-4">Maximum {maxImages} images • PNG, JPG, WEBP up to 5MB each</p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading || images.length >= maxImages}
                />

                <Button
                  asChild
                  className="bg-black text-white hover:bg-gray-800"
                  disabled={uploading || images.length >= maxImages}
                >
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose Images
                  </label>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                <Image src={imageUrl || "/placeholder.svg"} alt={`Upload ${index + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">Image {index + 1}</p>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      <div className="text-center text-sm text-gray-600">
        {images.length} of {maxImages} images uploaded
      </div>
    </div>
  )
}
