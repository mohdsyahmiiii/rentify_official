"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showAgreementModal, setShowAgreementModal] = useState(false)

  // Update generated agreement when prop changes
  React.useEffect(() => {
    if (agreement && agreement !== generatedAgreement) {
      setGeneratedAgreement(agreement)
    }
  }, [agreement, generatedAgreement])



  const handleAgreementAcceptance = async (checked: boolean) => {
    setAgreedToTerms(checked)
    setError("")

    if (checked) {
      setLoading(true)
      try {
        // Save agreement acceptance to database
        const response = await fetch("/api/accept-agreement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rentalId,
            isOwner
          }),
        })

        const data = await response.json()

        if (data.error) {
          setError(data.error)
          setAgreedToTerms(false) // Reset checkbox on error
        } else {
          // Call the parent callback when user agrees successfully
          onAgreementSigned?.()
        }
      } catch (err) {
        setError("Failed to save agreement acceptance")
        setAgreedToTerms(false) // Reset checkbox on error
      } finally {
        setLoading(false)
      }
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
          Review and accept the rental terms and conditions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Simple Checkbox Agreement Interface */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={handleAgreementAcceptance}
              disabled={loading}
              className="mt-1"
            />
            <div className="space-y-2">
              <Label htmlFor="terms" className="text-sm font-medium leading-relaxed">
                I agree to the rental terms and conditions for this booking.
              </Label>

              {/* Agreement Status and View Link */}
              <div className="text-sm text-gray-600">
                {!generatedAgreement ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating personalized agreement with DeepSeek AI...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Personalized agreement ready</span>
                    </div>
                    <Dialog open={showAgreementModal} onOpenChange={setShowAgreementModal}>
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm underline text-blue-600 hover:text-blue-800"
                        >
                          View AI-generated agreement
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Rental Agreement</DialogTitle>
                          <DialogDescription>
                            AI-generated rental agreement for this booking
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                          <pre className="whitespace-pre-wrap text-sm text-black font-mono">
                            {generatedAgreement}
                          </pre>
                        </ScrollArea>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={downloadAgreement}
                            className="border-black hover:bg-black hover:text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button onClick={() => setShowAgreementModal(false)}>
                            Close
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {agreedToTerms && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Terms accepted! You can now proceed to payment.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
