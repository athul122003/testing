"use client"

import { useState } from "react"
import { Settings, Plus, Edit, Trash2, Users, Shield, UserCheck, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const initialUsers = [
  {
    id: "USR001",
    name: "John Doe",
    email: "john@example.com",
    usn: "1MS21CS001",
    role: "Admin",
    status: "Active",
    joinDate: "2023-01-15",
  },
  {
    id: "USR002",
    name: "Jane Smith",
    email: "jane@example.com",
    usn: "1MS21CS002",
    role: "User",
    status: "Active",
    joinDate: "2023-02-20",
  },
  {
    id: "USR003",
    name: "Mike Wilson",
    email: "mike@example.com",
    usn: "1MS21CS003",
    role: "Moderator",
    status: "Inactive",
    joinDate: "2023-03-10",
  },
  {
    id: "USR004",
    name: "Sarah Jones",
    email: "sarah@example.com",
    usn: "1MS21CS004",
    role: "User",
    status: "Active",
    joinDate: "2023-04-05",
  },
]

const permissions = [
  "Create Events",
  "Edit Events",
  "Delete Events",
  "Manage Users",
  "View Payments",
  "Manage Gallery",
  "Write Blogs",
  "Delete Blogs",
  "Manage Roles",
  "System Settings",
]

const initialRoles = [
  {
    id: 1,
    name: "Admin",
    permissions: [
      "Create Events",
      "Edit Events",
      "Delete Events",
      "Manage Users",
      "View Payments",
      "Manage Gallery",
      "Write Blogs",
      "Delete Blogs",
      "Manage Roles",
      "System Settings",
    ],
    userCount: 1,
  },
  {
    id: 2,
    name: "User",
    permissions: ["View Payments"],
    userCount: 2,
  },
  {
    id: 3,
    name: "Moderator",
    permissions: ["Create Events", "Edit Events", "Write Blogs", "Manage Gallery"],
    userCount: 1,
  },
]

export function UsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [roles, setRoles] = useState(initialRoles)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState({ name: "", permissions: [] })
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower) ||
      user.usn.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  const handleManageUser = (user) => {
    setSelectedUser(user)
    setIsManageOpen(true)
  }

  const handleUpdateUserRole = (newRoleName) => {
    if (selectedUser) {
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, role: newRoleName } : user)))
      setIsManageOpen(false)
    }
  }

  const handleCreateRole = () => {
    const role = {
      id: roles.length + 1,
      name: newRole.name,
      permissions: newRole.permissions,
      userCount: 0,
    }
    setRoles([...roles, role])
    setNewRole({ name: "", permissions: [] })
    setIsRoleOpen(false)
  }

  const handlePermissionChange = (permission, checked) => {
    if (checked) {
      setNewRole({ ...newRole, permissions: [...newRole.permissions, permission] })
    } else {
      setNewRole({ ...newRole, permissions: newRole.permissions.filter((p) => p !== permission) })
    }
  }

  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId))
  }

  const getStatusColor = (status: string) => {
    return status === "Active"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      case "Moderator":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Users & Roles</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage users and their permissions</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-300 dark:border-slate-600 bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                Manage Roles
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Role Management</DialogTitle>
              </DialogHeader>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Existing Roles</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {roles.map((role) => (
                      <Card key={role.id} className="border-0 shadow-md">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg text-slate-900 dark:text-white">{role.name}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{role.userCount} users</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.slice(0, 4).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Role</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        placeholder="Enter role name"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-3">
                            <Checkbox
                              id={permission}
                              checked={newRole.permissions.includes(permission)}
                              onCheckedChange={(checked) => handlePermissionChange(permission, checked)}
                            />
                            <Label htmlFor={permission} className="text-sm font-medium">
                              {permission}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateRole}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Create Role
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Registered users</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.status === "Active").length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Currently active</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Roles</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{roles.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Permission roles</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-slate-900 dark:text-white">All Users</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, ID, USN, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>USN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.usn}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{user.joinDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleManageUser(user)}>
                        Manage
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">No users found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Manage User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {selectedUser?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">{selectedUser?.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser?.email}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">USN: {selectedUser?.usn}</p>
                <Badge className={getRoleColor(selectedUser?.role)} size="sm">
                  Current: {selectedUser?.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">Assign New Role</Label>
              <Select onValueChange={handleUpdateUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsManageOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
