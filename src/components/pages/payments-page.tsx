"use client"

import { useState } from "react"
import { Search, Download, Filter, TrendingUp, DollarSign, CreditCard, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const initialPayments = [
  {
    id: "PAY001",
    userId: "USR001",
    username: "john_doe",
    email: "john@example.com",
    date: "2024-01-15",
    time: "10:30 AM",
    amount: 99.0,
    status: "success",
    event: "Tech Conference 2024",
    method: "Credit Card",
  },
  {
    id: "PAY002",
    userId: "USR002",
    username: "jane_smith",
    email: "jane@example.com",
    date: "2024-01-14",
    time: "2:15 PM",
    amount: 149.0,
    status: "failed",
    event: "Workshop: React Basics",
    method: "PayPal",
  },
  {
    id: "PAY003",
    userId: "USR003",
    username: "mike_wilson",
    email: "mike@example.com",
    date: "2024-01-13",
    time: "4:45 PM",
    amount: 75.0,
    status: "success",
    event: "Design Meetup",
    method: "Bank Transfer",
  },
  {
    id: "PAY004",
    userId: "USR004",
    username: "sarah_jones",
    email: "sarah@example.com",
    date: "2024-01-12",
    time: "11:20 AM",
    amount: 199.0,
    status: "pending",
    event: "Advanced Workshop",
    method: "Credit Card",
  },
]

export function PaymentsPage() {
  const [payments] = useState(initialPayments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.event.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0)

  const successfulPayments = payments.filter((p) => p.status === "success").length
  const failedPayments = payments.filter((p) => p.status === "failed").length
  const pendingPayments = payments.filter((p) => p.status === "pending").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <TrendingUp className="h-3 w-3" />
      case "failed":
        return <AlertCircle className="h-3 w-3" />
      case "pending":
        return <CreditCard className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Payments</h1>
          <p className="text-slate-600 dark:text-slate-400">Track and manage payment transactions</p>
        </div>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toFixed(2)}</div>
            <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Successful</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successfulPayments}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Completed payments</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedPayments}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Failed transactions</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Awaiting confirmation</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-slate-900 dark:text-white">Payment History</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{payment.username}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{payment.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{payment.event}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.date}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{payment.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell className="font-bold">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
