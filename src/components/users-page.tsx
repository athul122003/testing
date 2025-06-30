// @ts-nocheck

"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

const users = [
	{ id: "USR001", name: "John Doe", email: "john@example.com", role: "Admin" },
	{ id: "USR002", name: "Jane Smith", email: "jane@example.com", role: "User" },
];

const permissions = [
	"Create Events",
	"Edit Events",
	"Delete Events",
	"Manage Users",
	"View Payments",
	"Manage Gallery",
	"Write Blogs",
];

export function UsersPage() {
	const [isManageOpen, setIsManageOpen] = useState(false);
	const [isRoleOpen, setIsRoleOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Users</h1>
				<Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
					<DialogTrigger asChild>
						<Button variant="outline">
							<Settings className="h-4 w-4 mr-2" />
							Manage Roles
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Role Management</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="role-name">Create New Role</Label>
								<Input id="role-name" placeholder="Enter role name" />
							</div>

							<div className="space-y-2">
								<Label>Permissions</Label>
								<div className="grid grid-cols-2 gap-2">
									{permissions.map((permission) => (
										<div
											key={permission}
											className="flex items-center space-x-2"
										>
											<Checkbox id={permission} />
											<Label htmlFor={permission} className="text-sm">
												{permission}
											</Label>
										</div>
									))}
								</div>
							</div>

							<div className="flex justify-end space-x-2">
								<Button variant="outline" onClick={() => setIsRoleOpen(false)}>
									Cancel
								</Button>
								<Button onClick={() => setIsRoleOpen(false)}>
									Create Role
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Users</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User ID</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.id}</TableCell>
									<TableCell>{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.role}</TableCell>
									<TableCell>
										<Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
											<DialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedUser(user)}
												>
													Manage
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Manage User Role</DialogTitle>
												</DialogHeader>
												<div className="space-y-4">
													<div className="space-y-2">
														<Label>User: {selectedUser?.name}</Label>
														<Label>Current Role: {selectedUser?.role}</Label>
													</div>

													<div className="space-y-2">
														<Label htmlFor="new-role">Assign New Role</Label>
														<Select>
															<SelectTrigger>
																<SelectValue placeholder="Select role" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="admin">Admin</SelectItem>
																<SelectItem value="user">User</SelectItem>
																<SelectItem value="moderator">
																	Moderator
																</SelectItem>
															</SelectContent>
														</Select>
													</div>

													<div className="flex justify-end space-x-2">
														<Button
															variant="outline"
															onClick={() => setIsManageOpen(false)}
														>
															Cancel
														</Button>
														<Button onClick={() => setIsManageOpen(false)}>
															Update Role
														</Button>
													</div>
												</div>
											</DialogContent>
										</Dialog>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
