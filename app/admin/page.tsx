"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react"
import Image from "next/image"

const adminStats = {
  totalUsers: 12450,
  totalItems: 8920,
  totalRevenue: 45600,
  pendingReports: 23,
  monthlyGrowth: 12.5,
}

const recentUsers = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    joinDate: "2024-01-08",
    status: "active",
    itemsListed: 3,
    rentals: 12,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    joinDate: "2024-01-07",
    status: "active",
    itemsListed: 1,
    rentals: 5,
  },
  {
    id: 3,
    name: "Charlie Brown",
    email: "charlie@example.com",
    joinDate: "2024-01-06",
    status: "suspended",
    itemsListed: 0,
    rentals: 2,
  },
]

const pendingItems = [
  {
    id: 1,
    name: "Professional Camera Lens",
    owner: "John Doe",
    category: "Electronics",
    price: 35,
    status: "pending",
    submittedDate: "2024-01-08",
    image: "/placeholder.svg?height=60&width=80",
  },
  {
    id: 2,
    name: "Vintage Guitar",
    owner: "Sarah Wilson",
    category: "Music",
    price: 28,
    status: "pending",
    submittedDate: "2024-01-07",
    image: "/placeholder.svg?height=60&width=80",
  },
]

const reportedItems = [
  {
    id: 1,
    itemName: "Power Drill",
    reportedBy: "Mike Johnson",
    reason: "Item not as described",
    date: "2024-01-08",
    status: "pending",
    severity: "medium",
  },
  {
    id: 2,
    itemName: "Gaming Console",
    reportedBy: "Lisa Brown",
    reason: "Damaged item received",
    date: "2024-01-07",
    status: "investigating",
    severity: "high",
  },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, items, and platform operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{adminStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{adminStats.monthlyGrowth}% this month</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{adminStats.totalItems.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Items listed</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">${adminStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-green-600">Platform fees collected</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{adminStats.pendingReports}</div>
              <p className="text-xs text-red-600">Require attention</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-black transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{adminStats.monthlyGrowth}%</div>
              <p className="text-xs text-green-600">Monthly growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Items
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-black">Recent User Registrations</CardTitle>
                  <CardDescription>Latest users who joined the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-black">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Joined: {user.joinDate}</p>
                      </div>
                      <Badge className={user.status === "active" ? "bg-green-500" : "bg-red-500"}>{user.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-black">Pending Item Approvals</CardTitle>
                  <CardDescription>Items waiting for admin approval</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-black">{item.name}</p>
                        <p className="text-sm text-gray-600">by {item.owner}</p>
                        <p className="text-sm text-gray-600">${item.price}/day</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">User Management</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border-2">
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            {user.itemsListed} items listed • {user.rentals} rentals
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={user.status === "active" ? "bg-green-500" : "bg-red-500"}>
                          {user.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-black hover:bg-black hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">Item Management</h2>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingItems.map((item) => (
                <Card key={item.id} className="border-2 hover:border-black transition-colors">
                  <div className="relative">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">{item.status}</Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-black">{item.name}</CardTitle>
                    <CardDescription>by {item.owner}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-black">${item.price}/day</span>
                      <span className="text-sm text-gray-600">{item.category}</span>
                    </div>
                    <p className="text-sm text-gray-600">Submitted: {item.submittedDate}</p>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">Reports & Issues</h2>
              <Badge className="bg-red-500 hover:bg-red-600">{reportedItems.length} Pending</Badge>
            </div>

            <div className="space-y-4">
              {reportedItems.map((report) => (
                <Card key={report.id} className="border-2 hover:border-black transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-black">{report.itemName}</h3>
                        <p className="text-gray-600">Reported by: {report.reportedBy}</p>
                        <p className="text-sm text-gray-500">{report.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            report.severity === "high"
                              ? "bg-red-500"
                              : report.severity === "medium"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }
                        >
                          {report.severity} priority
                        </Badge>
                        <Badge className={report.status === "pending" ? "bg-gray-500" : "bg-blue-500"}>
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-black font-medium">Reason:</p>
                      <p className="text-gray-600">{report.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                        <Eye className="w-4 h-4 mr-1" />
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Take Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold text-black">Platform Analytics</h2>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-black">Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue and growth metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-black font-medium">This Month</span>
                      <span className="text-2xl font-bold text-green-600">$12,450</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-black font-medium">Last Month</span>
                      <span className="text-xl font-bold text-black">$11,200</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-black font-medium">Growth Rate</span>
                      <span className="text-xl font-bold text-green-600">+11.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-black">Popular Categories</CardTitle>
                  <CardDescription>Most rented item categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-black">Electronics</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-20 h-2 bg-black rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">83%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black">Tools</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-16 h-2 bg-black rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">67%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black">Sports</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-12 h-2 bg-black rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">50%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black">Music</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-8 h-2 bg-black rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">33%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
