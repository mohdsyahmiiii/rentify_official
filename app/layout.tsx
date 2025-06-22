import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Button } from "@/components/ui/button"
import { Search, Plus, Menu } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { UserMenu } from "@/components/user-menu"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rentify - Peer-to-Peer Rental Platform",
  description: "Rent anything, anytime. The ultimate peer-to-peer rental marketplace.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation */}
        <nav className="bg-white border-b-2 border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-xl font-bold text-black">Rentify</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/items" className="text-black hover:text-gray-600 font-medium">
                  Browse Items
                </Link>
                <Link href="/dashboard" className="text-black hover:text-gray-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/list-item" className="text-black hover:text-gray-600 font-medium">
                  List Item
                </Link>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                {/* Search - Desktop */}
                <div className="hidden lg:block relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black w-64"
                  />
                </div>

                {/* List Item Button */}
                <Button asChild className="hidden md:flex bg-black text-white hover:bg-gray-800">
                  <Link href="/list-item">
                    <Plus className="w-4 h-4 mr-2" />
                    List Item
                  </Link>
                </Button>

                {/* User Menu */}
                <UserMenu />

                {/* Mobile Menu */}
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <Suspense>{children}</Suspense>

        {/* Footer */}
        <footer className="bg-black text-white py-12 mt-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-lg">R</span>
                  </div>
                  <span className="text-xl font-bold">Rentify</span>
                </div>
                <p className="text-gray-300">The ultimate peer-to-peer rental marketplace. Rent anything, anytime.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Platform</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <Link href="/items" className="hover:text-white">
                      Browse Items
                    </Link>
                  </li>
                  <li>
                    <Link href="/list-item" className="hover:text-white">
                      List Your Items
                    </Link>
                  </li>
                  <li>
                    <Link href="/how-it-works" className="hover:text-white">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/safety" className="hover:text-white">
                      Safety
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <Link href="/help" className="hover:text-white">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/trust-safety" className="hover:text-white">
                      Trust & Safety
                    </Link>
                  </li>
                  <li>
                    <Link href="/insurance" className="hover:text-white">
                      Insurance
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <Link href="/about" className="hover:text-white">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="hover:text-white">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/press" className="hover:text-white">
                      Press
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-white">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-300">© 2024 Rentify. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-gray-300 hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-300 hover:text-white">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="text-gray-300 hover:text-white">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
