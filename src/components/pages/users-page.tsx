// @ts-nocheck
"use client";
import { useSearchParams } from "next/navigation";
import {
	Edit,
	Plus,
	Check,
	X,
	Search,
	Settings,
	Shield,
	Trash2,
	UserCheck,
	Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Separator } from "~/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MoreVertical } from "lucide-react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { ComponentLoading } from "~/components/ui/component-loading2";
import { server } from "~/lib/actions/serverAction";
import { api } from "~/lib/api";
import { toast } from "sonner";

type Permission = {
	id: string;
	name: string;
};
type Role = {
	id: string;
	name: string;
	permissions: {
		permission: {
			id: string;
			name: string;
		};
	}[];
};

export function UsersPage() {
	// Fetch roles and permissions from the API
	const { data: permissions = [], isLoading: permLoading } =
		api.permission.getAll.useQuery();
	const { data: roles = [], isLoading: roleLoading } =
		api.role.getAll.useQuery();

	/*
  const [roles, setRoles] = useState([]);
  
  const [permissions, setPermissions] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [permLoading, setPermLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);

 useEffect(() => {
    setRoleLoading(true);
    setPermLoading(true);
    server.role.getAll().then((roles) => {
      setRoles(roles);
        console.log("Roles from serverAction:", roles);
      })
      .catch((error) => {
        toast.error(`Failed to load roles: ${error.message}`);
        console.error("Error serverAction:", error);
      })
      .finally(() => {
        setRoleLoading(false);
      });

    
    server.permission.getAll().then((permissions) => {
      setPermissions(permissions);  
      console.log("Permissions from serverAction:", permissions);
    })
      .catch((error) => {
        toast.error(`Failed to load permissions: ${error.message}`);
        console.error("Error serverAction:", error);
      })
      .finally(() => {
        setRoleLoading(false);
      });

     Fetch roles from API 
    fetch("/api/role/getAll", {method: "POST",}).then(async (res) => {
        if (!res.ok) throw new Error(await res.text());

        return res.json();
      })
      .then((rolesFromApi) => {
        console.log("Roles from API route:", rolesFromApi);
      })
      .catch((error) => {
        console.error("Error API route:", error);
      });
  }, []);

*/

	// CRUD operations for roles and permissions
	const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
	const [selectedPermissions, setSelectedPermissions] = useState<
		Record<string, string[]>
	>({});
	const [originalPermissions, setOriginalPermissions] = useState<
		Record<string, string[]>
	>({});
	const [newRoleName, setNewRoleName] = useState("");
	//create role,perm mutations & functions
	const createRoleMutation = api.role.create.useMutation({
		onSuccess: (newRole) => {
			toast.success(`Role: "${newRole.name}" created.`);
			setNewRoleName("");

			api.role.getAll.invalidate?.();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create Role.");
		},
	});
	const addNewRole = () => {
		if (!newRoleName) {
			toast.error("Please provide both department name and full name.");
			return;
		}
		createRoleMutation.mutate({ name: newRoleName.trim() });
	};
	const deleteRoleMutation = api.role.deleteRole.useMutation({
		onSuccess: (delRole) => {
			toast.success(`Role ${delRole.name} deleted.`);
			api.role.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete Role.");
		},
	});
	const deleteRole = (roleId: string) => {
		if (!roleId) {
			toast.error("Please provide a valid department id for deletion.");
			return;
		}
		deleteRoleMutation.mutate({ id: roleId.trim() });
	};

	const togglePermission = (roleId: string, permId: string) => {
		setSelectedPermissions((prev) => {
			const current = prev[roleId] || [];
			const updated = current.includes(permId)
				? current.filter((id) => id !== permId) // remove
				: [...current, permId]; // add

			return {
				...prev,
				[roleId]: updated,
			};
		});
	};

	const SaveRolePermMutation = api.role.updateRolePermissions.useMutation({
		onSuccess: (data) => {
			const { role, addedIds = [], removedIds = [] } = data;

			const added = permissions.filter((p) => addedIds.includes(p.id));
			const removed = permissions.filter((p) => removedIds.includes(p.id));

			const addedText =
				added.length > 0
					? `Added: ${added.map((p) => `"${p.name}"`).join(", ")}`
					: "";

			const removedText =
				removed.length > 0
					? `\nRemoved: ${removed.map((p) => `"${p.name}"`).join(", ")}`
					: "";

			const messageLines = [`Permissions updated for role "${role.name}".`];
			if (addedText) messageLines.push(addedText);
			if (removedText) messageLines.push(removedText);
			toast.success(messageLines.join("\n"));

			api.role.getAll.invalidate(); // Refresh role list
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update permissions.");
		},
	});

	const savePermissions = (roleId: string, newPermissions: string[]) => {
		if (!roleId || !newPermissions || newPermissions.length === 0) {
			toast.error("Please select at least one permission.");
			return;
		}

		SaveRolePermMutation.mutate({
			roleId,
			permissionIds: newPermissions,
		});
		setEditingRoleId(null);
	};

	//

	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") || "permissions"; // fallback to "permissions"
	const [activeTab, setActiveTab] = useState(tabParam);
	useEffect(() => {
		if (tabParam) setActiveTab(tabParam);
	}, [tabParam]);

	if (roleLoading || permLoading) {
		return <ComponentLoading message="Role & Permissions data Loading..." />;
	}

	return (
		<div className="space-y-8">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-auto grid-cols-2 bg-gradient-to-r from-teal-100 to-purple-100 dark:from-teal-800 dark:to-purple-800">
					<TabsTrigger
						value="permissions"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
					>
						Role&Permissions
					</TabsTrigger>

					<TabsTrigger
						value="userManagement"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
					>
						User Management
					</TabsTrigger>
				</TabsList>

				<TabsContent value="permissions">
					<Card className="bg-gradient-to-br from-white to-teal-50 dark:from-gray-900 dark:to-teal-900 shadow-xl">
						<CardHeader>
							<CardTitle className="text-teal-700 dark:text-teal-300">
								Role & Permission Management
							</CardTitle>
							<CardDescription>
								Define roles and assign specific permissions.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6">
							{/* Add Role */}
							<div className="grid gap-4 p-4 border rounded-lg bg-gradient-to-r from-teal-50 to-purple-50 dark:from-teal-900 dark:to-purple-900">
								<h3 className="text-lg font-semibold">Add New Role</h3>
								<div className="flex flex-col md:flex-row items-center gap-2">
									<Input
										placeholder="New Role Name"
										value={newRoleName}
										onChange={(e) => setNewRoleName(e.target.value)}
									/>

									<Button
										onClick={addNewRole}
										className="bg-gradient-to-r from-teal-500 to-purple-500"
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Role
									</Button>
								</div>
							</div>
							<Separator />

							<div className="grid gap-4 md:grid-cols-2">
								{roles.map((role) => {
									const isEditing = editingRoleId === role.id;
									const currentPermissionIds = role.permissions.map(
										(p) => p.permission.id,
									);
									const selected =
										selectedPermissions[role.id] || currentPermissionIds;

									return (
										<Card key={role.id} className="border-0 shadow-md">
											<CardContent className="p-6">
												<div className="flex justify-between items-start mb-4">
													<div>
														<h4 className="font-bold text-lg text-slate-900 dark:text-white">
															{role.name}
														</h4>
													</div>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																if (isEditing) {
																	savePermissions(role.id, selected);
																} else {
																	const permIds = role.permissions.map(
																		(p) => p.permission.id,
																	);
																	setSelectedPermissions((prev) => ({
																		...prev,
																		[role.id]: permIds,
																	}));
																	setOriginalPermissions((prev) => ({
																		...prev,
																		[role.id]: permIds,
																	}));
																	setEditingRoleId(role.id);
																}
															}}
														>
															{isEditing ? (
																<Check className="h-4 w-4 text-green-600" />
															) : (
																<Edit className="h-4 w-4" />
															)}
														</Button>
														{isEditing && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setSelectedPermissions((prev) => ({
																		...prev,
																		[role.id]:
																			originalPermissions[role.id] || [],
																	}));
																	setEditingRoleId(null);
																}}
															>
																<X className="h-4 w-4 text-gray-500" />
															</Button>
														)}

														<Button
															variant="ghost"
															size="sm"
															onClick={() => deleteRole(role.id)}
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													</div>
												</div>

												{isEditing ? (
													<div className="grid gap-2">
														{permissions.map((perm) => (
															<div
																key={perm.id}
																className="flex items-center gap-2 text-sm"
															>
																<Checkbox
																	id={`checkbox-${role.id}-${perm.id}`}
																	checked={selected.includes(perm.id)}
																	onCheckedChange={() =>
																		togglePermission(role.id, perm.id)
																	}
																/>
																<Label
																	htmlFor={`checkbox-${role.id}-${perm.id}`}
																	className="cursor-pointer"
																>
																	{perm.name}
																</Label>
															</div>
														))}
													</div>
												) : (
													<div className="flex flex-wrap gap-2">
														{role.permissions.slice(0, 4).map((p) => (
															<Badge
																key={p.permission.id}
																variant="secondary"
																className="text-xs"
															>
																{p.permission.name}
															</Badge>
														))}
														{role.permissions.length > 4 && (
															<Badge variant="outline" className="text-xs">
																+{role.permissions.length - 4} more
															</Badge>
														)}
													</div>
												)}
											</CardContent>
										</Card>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="userManagement">
					<Card className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-900 shadow-xl">
						<CardHeader>
							<CardTitle className="text-orange-700 dark:text-orange-300">
								User Management
							</CardTitle>
							<CardDescription>
								Manage database backups and integrity.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="backup-frequency">Daily Backup Frequency</Label>
								<Select defaultValue="daily">
									<SelectTrigger id="backup-frequency">
										<SelectValue placeholder="Select frequency" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="daily">Daily</SelectItem>
										<SelectItem value="weekly">Weekly</SelectItem>
										<SelectItem value="monthly">Monthly</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
								Initiate Manual Backup Now
							</Button>
							<Separator />
							<div className="grid gap-2">
								<h3 className="font-medium">
									Last Backup:{" "}
									<span className="text-primary">2025-01-22 10:30 AM</span>
								</h3>
								<p className="text-sm text-muted-foreground">
									Next Scheduled Backup: 2025-01-23 03:00 AM
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
