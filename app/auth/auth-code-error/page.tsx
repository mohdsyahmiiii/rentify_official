import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-black">Authentication Error</CardTitle>
          <CardDescription>
            Sorry, we couldn't complete your authentication. This could be due to an expired or invalid link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
              <Link href="/auth/login">Try signing in again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-black hover:bg-black hover:text-white">
              <Link href="/auth/signup">Create a new account</Link>
            </Button>
          </div>
          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-black underline">
              Return to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
