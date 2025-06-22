"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Check, Loader2, AlertCircle } from "lucide-react"

interface RentalAgreementProps {
  rentalId: string
  agreement?: string
  isOwner?: boolean
  onAgreementGenerated?: (agreement: string) => void
  onAgreementSigned?: () => void
}

export function RentalAgreement({
  rentalId,
  agreement,
  isOwner = false,
  onAgreementGenerated,
  onAgreementSigned,
}: RentalAgreementProps) {
  const [generatedAgreement, setGeneratedAgreement] = useState(agreement || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [signature, setSignature] = useState("")
  const [signed, setSigned] = useState(false)

  const generateAgreement = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-agreement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rentalId }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setGeneratedAgreement(data.agreement)
        onAgreementGenerated?.(data.agreement)
      }
    } catch (err) {
      setError("Failed to generate agreement")
    } finally {
      setLoading(false)
    }
  }

  const handleSignAgreement = async () => {
    if (!signature.trim()) {
      setError("Please provide your digital signature")
      return
    }

    try {
      // Here you would typically save the signature to the database
      setSigned(true)
      onAgreementSigned?.()
    } catch (err) {
      setError("Failed to sign agreement")
    }
  }

  const downloadAgreement = () => {
    const element = document.createElement("a")
    const file = new Blob([generatedAgreement], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `rental-agreement-${rentalId}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-black" />
            <CardTitle className="text-black">Rental Agreement</CardTitle>
          </div>
          {generatedAgreement && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAgreement}
              className="border-black hover:bg-black hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
        <CardDescription>
          {!generatedAgreement ? "Generate a custom rental agreement using AI" : "Review and sign the rental agreement"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {!generatedAgreement ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No Agreement Generated</h3>
            <p className="text-gray-600 mb-6">
              Generate a custom rental agreement tailored to this specific rental using DeepSeek AI.
              The agreement will be legally compliant and include all necessary terms and conditions.
            </p>
            <Button onClick={generateAgreement} disabled={loading} className="bg-black text-white hover:bg-gray-800">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating with DeepSeek AI...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Agreement with DeepSeek AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agreement Content */}
            <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-black font-mono">{generatedAgreement}</pre>
            </div>

            {/* Signature Section */}
            {!signed && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signature" className="text-black font-medium">
                      Digital Signature {isOwner ? "(Owner)" : "(Renter)"}
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      By typing your full name below, you agree to the terms of this rental agreement.
                    </p>
                    <Textarea
                      id="signature"
                      placeholder="Type your full name as your digital signature"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="border-gray-300 focus:border-black"
                    />
                  </div>
                  <Button
                    onClick={handleSignAgreement}
                    disabled={!signature.trim()}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Sign Agreement
                  </Button>
                </div>
              </>
            )}

            {signed && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Agreement signed successfully!{" "}
                  {isOwner ? "Waiting for renter to sign." : "Waiting for owner to sign."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
