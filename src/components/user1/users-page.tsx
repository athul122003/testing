// @ts-nocheck
"use client";

import {
	ArrowDownAZ,
	ArrowUpAZ,
	Check,
	Edit,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ComponentLoading } from "~/components/ui/component-loading";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/lib/api";
import { useDashboardData } from "~/providers/dashboardDataContext";

export function UsersPage() {
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
	// Fetch roles and permissions from the API
	const {
		rolesQuery,
		permissionsQuery,
		setUserParams,
		usersQuery,
		refetchUsers,
	} = useDashboardData();
	const { data: permissions = [], isLoading: permLoading } = permissionsQuery;
	const { data: roles = [], isLoading: roleLoading } = rolesQuery;
	console.log("Roles from API route:", roles);
	const [roleSearchTerm, setRoleSearchTerm] = useState("");
	const [rolePage, setRolePage] = useState(1);
	const ROLES_PER_PAGE = 4;

	const filteredRoles = useMemo(() => {
		return roles.filter((role) =>
			role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()),
		);
	}, [roles, roleSearchTerm]);

	const totalRolePages = Math.ceil(filteredRoles.length / ROLES_PER_PAGE);

	const paginatedRoles = filteredRoles.slice(
		(rolePage - 1) * ROLES_PER_PAGE,
		rolePage * ROLES_PER_PAGE,
	);

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
			toast.error(error.message);
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

	//User management section
	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const [roleSortOrder, setRoleSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
	const [editingRoles, setEditingRoles] = useState<
		Record<string, { prev: string; current: string }>
	>({});
	const [selectedRole, setSelectedRole] = useState(""); // for filtering by role
	const [sortBy, setSortBy] = useState<"role" | "name" | "id">("role");
	const [bulkSelectedRole, setBulkSelectedRole] = useState<string | null>(null);

	const { data: users, isLoading: userLoading } = usersQuery;

	useEffect(() => {
		console.log("Users from API route");
		setUserParams(
			searchTerm,
			page,
			10,
			sortBy,
			roleSortOrder,
			selectedRole || "all",
		);
	}, [searchTerm, page, sortBy, roleSortOrder, selectedRole, setUserParams]);

	const singleUpdate = api.user.updateUserRole.useMutation({
		onSuccess: async (_, variables) => {
			await refetchUsers();
			toast.dismiss();
			toast.success("Role updated.");

			// Exit editing mode for that specific user
			setEditingRoles((prev) => {
				const copy = { ...prev };
				delete copy[variables.userId]; // `userId` comes from mutation input
				return copy;
			});
		},
		onError: (err) => toast.error(err.message),
	});

	const bulkUpdate = api.user.updateMultipleUserRoles.useMutation({
		onSuccess: async () => {
			await refetchUsers();
			toast.dismiss();
			toast.success("Roles updated for selected users.");
			setSelectedUsers([]);
		},
		onError: (err) => toast.error(err.message),
	});

	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") || "permissions"; // fallback to "permissions"
	const [activeTab, setActiveTab] = useState(tabParam);
	useEffect(() => {
		if (tabParam) setActiveTab(tabParam);
	}, [tabParam]);

	return (
		<div className="space-y-8">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-auto grid-cols-2 bg-white dark:bg-black border border-gray-300 dark:border-slate-800">
					<TabsTrigger
						value="permissions"
						className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-slate-200 data-[state=active]:border-2 data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:rounded-md text-gray-700 dark:text-slate-200"
					>
						Role&Permissions
					</TabsTrigger>

					<TabsTrigger
						value="userManagement"
						className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-slate-200 data-[state=active]:border-2 data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:rounded-md text-gray-700 dark:text-slate-200"
					>
						User Management
					</TabsTrigger>
				</TabsList>

				<TabsContent value="permissions">
					<Card className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 shadow-xl">
						{roleLoading || permLoading ? (
							<ComponentLoading message="Role & Permissions data Loading..." />
						) : (
							<>
								<CardHeader>
									<CardTitle className="text-gray-900 dark:text-slate-200">
										Role & Permission Management
									</CardTitle>
									<CardDescription className="text-gray-600 dark:text-slate-400">
										Define roles and assign specific permissions.
									</CardDescription>
								</CardHeader>
								<CardContent className="grid gap-6">
									{/* Add Role */}
									<div className="grid gap-4 p-4 border border-gray-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-black">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
											Add New Role
										</h3>
										<div className="flex flex-col md:flex-row items-center gap-2">
											<Input
												placeholder="New Role Name"
												value={newRoleName}
												onChange={(e) => setNewRoleName(e.target.value)}
												className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
											/>

											<Button
												onClick={addNewRole}
												className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Role
											</Button>
										</div>
									</div>
									<Separator className="bg-gray-200 dark:bg-slate-800" />

									{/* 🔍 Search input */}
									<div className="flex justify-end">
										<Input
											placeholder="Search roles..."
											value={roleSearchTerm}
											onChange={(e) => {
												setRoleSearchTerm(e.target.value);
												setRolePage(1);
											}}
											className="w-full md:w-1/3 mb-4 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
										/>
									</div>

									{/* 🧩 Paginated Roles */}
									<div className="grid gap-4 md:grid-cols-2">
										{paginatedRoles.map((role) => {
											const isEditing = editingRoleId === role.id;
											const currentPermissionIds = role.permissions.map(
												(p) => p.permission.id,
											);
											const selected =
												selectedPermissions[role.id] || currentPermissionIds;

											return (
												<Card
													key={role.id}
													className="border border-gray-200 dark:border-slate-800 shadow-md bg-white dark:bg-black"
												>
													<CardContent className="p-6">
														<div className="flex justify-between items-start mb-4">
															<div>
																<h4 className="font-bold text-lg text-gray-900 dark:text-slate-200">
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
																	className="text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-900"
																>
																	{isEditing ? (
																		<Check className="h-4 w-4 text-green-500 dark:text-green-400" />
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
																		className="text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-900"
																	>
																		<X className="h-4 w-4 text-gray-500 dark:text-slate-400" />
																	</Button>
																)}
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => deleteRole(role.id)}
																	className="text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-900"
																>
																	<Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
																</Button>
															</div>
														</div>

														{isEditing ? (
															<div className="grid gap-2">
																{permissions.map((perm) => (
																	<div
																		key={perm.id}
																		className="flex items-center gap-2 text-sm text-gray-900 dark:text-slate-200"
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
																			className="cursor-pointer text-gray-900 dark:text-slate-200"
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
																		className="text-xs bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200"
																	>
																		{p.permission.name}
																	</Badge>
																))}
																{role.permissions.length > 4 && (
																	<Badge
																		variant="outline"
																		className="text-xs border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400"
																	>
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

									{/* 🔁 Pagination Controls */}
									{totalRolePages > 1 && (
										<div className="mt-6 flex justify-center">
											<Pagination className="mt-6">
												<PaginationContent>
													{/* ◀ Previous */}
													<PaginationItem>
														<PaginationPrevious
															onClick={() =>
																rolePage > 1 && setRolePage(rolePage - 1)
															}
															className={
																rolePage === 1
																	? "pointer-events-none opacity-50"
																	: "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
															}
														/>
													</PaginationItem>

													{/* ⏺ Page Numbers */}
													{(() => {
														const pages = [];
														const maxVisible = 3;
														const total = totalRolePages;

														// Always show first
														pages.push(
															<PaginationItem key={1}>
																<PaginationLink
																	isActive={rolePage === 1}
																	onClick={() => setRolePage(1)}
																	className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${rolePage === 1 ? "bg-gray-100 dark:bg-slate-800" : ""}`}
																>
																	1
																</PaginationLink>
															</PaginationItem>,
														);

														// Left Ellipsis
														if (rolePage > maxVisible) {
															pages.push(
																<PaginationItem key="left-ellipsis">
																	<span className="px-2 text-gray-500 dark:text-slate-400">
																		...
																	</span>
																</PaginationItem>,
															);
														}

														// Pages around current page
														const start = Math.max(2, rolePage - 1);
														const end = Math.min(total - 1, rolePage + 1);

														for (let i = start; i <= end; i++) {
															pages.push(
																<PaginationItem key={i}>
																	<PaginationLink
																		isActive={rolePage === i}
																		onClick={() => setRolePage(i)}
																		className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${rolePage === i ? "bg-gray-100 dark:bg-slate-800" : ""}`}
																	>
																		{i}
																	</PaginationLink>
																</PaginationItem>,
															);
														}

														// Right Ellipsis
														if (rolePage < total - 2) {
															pages.push(
																<PaginationItem key="right-ellipsis">
																	<span className="px-2 text-gray-500 dark:text-slate-400">
																		...
																	</span>
																</PaginationItem>,
															);
														}

														// Always show last
														if (total > 1) {
															pages.push(
																<PaginationItem key={total}>
																	<PaginationLink
																		isActive={rolePage === total}
																		onClick={() => setRolePage(total)}
																		className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${rolePage === total ? "bg-gray-100 dark:bg-slate-800" : ""}`}
																	>
																		{total}
																	</PaginationLink>
																</PaginationItem>,
															);
														}

														return pages;
													})()}

													{/* ▶ Next */}
													<PaginationItem>
														<PaginationNext
															onClick={() =>
																rolePage < totalRolePages &&
																setRolePage(rolePage + 1)
															}
															className={
																rolePage === totalRolePages
																	? "pointer-events-none opacity-50"
																	: "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
															}
														/>
													</PaginationItem>
												</PaginationContent>
											</Pagination>
										</div>
									)}
								</CardContent>
							</>
						)}
					</Card>
				</TabsContent>

				<TabsContent value="userManagement">
					<Card className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 shadow-xl">
						{roleLoading ? (
							<ComponentLoading message="Loading Page..." />
						) : (
							<>
								<CardHeader>
									<CardTitle className="text-gray-900 dark:text-slate-200">
										User Management
									</CardTitle>
									<CardDescription className="text-gray-600 dark:text-slate-400">
										Manage user Roles.
									</CardDescription>
								</CardHeader>
								<CardContent className="grid gap-4">
									<div className="grid gap-2">
										<div className="flex justify-between items-center mb-4">
											<div className="flex items-center gap-4 flex-wrap">
												{/*Search Input */}
												<div className="relative">
													<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
													<Input
														placeholder="Search by name, ID, USN, or email..."
														value={searchTerm}
														onChange={(e) => setSearchTerm(e.target.value)}
														className="pl-10 w-80 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
													/>
												</div>

												{/*Role Filter Dropdown */}
												<Select
													value={selectedRole ?? "all"}
													onValueChange={(val) =>
														setSelectedRole(val === "all" ? null : val)
													}
												>
													<SelectTrigger className="w-52 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
														<SelectValue placeholder="All Roles" />
													</SelectTrigger>
													<SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
														<SelectItem value="all">All Roles</SelectItem>
														{roles.map((role) => (
															<SelectItem key={role.id} value={role.name}>
																{role.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Select
													value={sortBy}
													onValueChange={(val) =>
														setSortBy(val as "role" | "name" | "id")
													}
												>
													<SelectTrigger className="w-40 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
														<SelectValue placeholder="Sort by..." />
													</SelectTrigger>
													<SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
														<SelectItem value="role">Sort by Role</SelectItem>
														<SelectItem value="name">Sort by Name</SelectItem>
														<SelectItem value="id">Sort by ID</SelectItem>
													</SelectContent>
												</Select>
												{/* ↕️ Sorting Buttons */}
												<div className="flex gap-2">
													<Button
														variant="outline"
														onClick={() =>
															setRoleSortOrder((prev) =>
																prev === "asc" ? "desc" : "asc",
															)
														}
														className="flex items-center gap-2 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
													>
														{roleSortOrder === "asc" ? (
															<ArrowDownAZ className="h-4 w-4" />
														) : (
															<ArrowUpAZ className="h-4 w-4" />
														)}
													</Button>
												</div>
											</div>
										</div>
									</div>

									<Separator className="bg-gray-200 dark:bg-slate-800" />
									<div className="grid gap-2">
										{/* 🔸 Selected Users Summary */}
										{userLoading ? (
											<ComponentLoading message="Loading Selected Users..." />
										) : (
											<div className="space-y-4">
												{/* 🔸 Selected Users Banner */}
												{selectedUsers.length > 0 && (
													<div className="rounded bg-gray-100 dark:bg-slate-900 p-4">
														<div className="flex justify-between items-center mb-2 gap-4 flex-wrap">
															<span className="font-medium text-orange-600 dark:text-orange-300">
																Selected Users: {selectedUsers.length}
															</span>

															<div className="flex items-center gap-2">
																<Select
																	value={bulkSelectedRole || ""}
																	onValueChange={(newRole) =>
																		setBulkSelectedRole(newRole)
																	}
																>
																	<SelectTrigger className="w-52 bg-white dark:bg-black border-gray-300 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																		<SelectValue placeholder="Set Role for All" />
																	</SelectTrigger>
																	<SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																		{roles.map((r) => (
																			<SelectItem key={r.id} value={r.name}>
																				{r.name}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>

																{/* ✅ Save Button */}
																<Button
																	variant="ghost"
																	size="icon"
																	disabled={!bulkSelectedRole}
																	onClick={() => {
																		if (bulkSelectedRole) {
																			toast.loading("Updating roles...");
																			bulkUpdate.mutate({
																				userIds: selectedUsers.map((u) => u.id),
																				roleName: bulkSelectedRole,
																			});
																			setBulkSelectedRole(null); // Reset selection
																		}
																	}}
																	className="hover:bg-gray-200 dark:hover:bg-slate-800"
																>
																	<Check className="h-4 w-4 text-green-500 dark:text-green-400" />
																</Button>

																{/* ❌ Cancel Button */}
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		setSelectedUsers([]);
																		setBulkSelectedRole(null);
																	}}
																	className="hover:bg-gray-200 dark:hover:bg-slate-800"
																>
																	<X className="h-4 w-4 text-red-500 dark:text-red-400" />
																</Button>
															</div>
														</div>

														<div className="grid grid-cols-2 gap-2">
															{selectedUsers.map((user) => (
																<div
																	key={user.id}
																	className="bg-white dark:bg-black px-3 py-2 rounded shadow flex justify-between items-center border border-gray-200 dark:border-slate-800"
																>
																	<div>
																		<p className="text-sm font-medium text-gray-900 dark:text-slate-200">
																			{user.name}
																		</p>
																		<p className="text-xs text-gray-500 dark:text-slate-400">
																			{user.email}
																		</p>
																	</div>
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() =>
																			setSelectedUsers((prev) =>
																				prev.filter((u) => u.id !== user.id),
																			)
																		}
																		className="hover:bg-gray-100 dark:hover:bg-slate-900"
																	>
																		<X className="h-4 w-4 text-gray-500 dark:text-slate-400" />
																	</Button>
																</div>
															))}
														</div>
													</div>
												)}

												{/* 🔍 User Table */}
												{users?.data.length ? (
													<>
														<Table className="bg-white dark:bg-black text-gray-900 dark:text-slate-200">
															<TableHeader>
																<TableRow className="bg-gray-50 dark:bg-slate-900">
																	<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800" />
																	<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																		ID
																	</TableHead>
																	<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																		Name
																	</TableHead>
																	<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																		Email
																	</TableHead>
																	<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																		Role
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{users.data.map((user) => (
																	<TableRow
																		key={user.id}
																		className="hover:bg-gray-50 dark:hover:bg-slate-900"
																	>
																		<TableCell>
																			<Checkbox
																				checked={selectedUsers.some(
																					(u) => u.id === user.id,
																				)}
																				onCheckedChange={(checked) => {
																					setSelectedUsers((prev) =>
																						checked
																							? [...prev, user]
																							: prev.filter(
																									(u) => u.id !== user.id,
																								),
																					);
																				}}
																			/>
																		</TableCell>

																		<TableCell className="font-mono text-sm text-gray-500 dark:text-slate-400">
																			{user.id}
																		</TableCell>

																		<TableCell className="text-gray-900 dark:text-slate-200">
																			{user.name}
																		</TableCell>
																		<TableCell className="text-gray-500 dark:text-slate-400">
																			{user.email}
																		</TableCell>
																		<TableCell>
																			{editingRoles[user.id] ? (
																				<div className="flex gap-2 items-center">
																					<Select
																						value={
																							editingRoles[user.id].current
																						}
																						onValueChange={(val) =>
																							setEditingRoles((prev) => ({
																								...prev,
																								[user.id]: {
																									...prev[user.id],
																									current: val,
																								},
																							}))
																						}
																					>
																						<SelectTrigger className="w-32 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
																							<SelectValue />
																						</SelectTrigger>
																						<SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																							{roles.map((r) => (
																								<SelectItem
																									key={r.id}
																									value={r.name}
																								>
																									{r.name}
																								</SelectItem>
																							))}
																						</SelectContent>
																					</Select>
																					<Button
																						size="icon"
																						variant="ghost"
																						onClick={() => {
																							toast.loading("Updating role...");
																							singleUpdate.mutate({
																								userId: user.id,
																								roleName:
																									editingRoles[user.id].current,
																							});
																						}}
																						className="hover:bg-gray-100 dark:hover:bg-slate-900"
																					>
																						<Check className="text-green-500 dark:text-green-400 h-4 w-4" />
																					</Button>
																					<Button
																						size="icon"
																						variant="ghost"
																						onClick={() =>
																							setEditingRoles((prev) => {
																								const copy = { ...prev };
																								delete copy[user.id];
																								return copy;
																							})
																						}
																						className="hover:bg-gray-100 dark:hover:bg-slate-900"
																					>
																						<X className="text-red-500 dark:text-red-400 h-4 w-4" />
																					</Button>
																				</div>
																			) : (
																				<div className="flex justify-between items-center">
																					<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800">
																						{user.role.name}
																					</Badge>
																					<Button
																						variant="ghost"
																						size="sm"
																						onClick={() =>
																							setEditingRoles((prev) => ({
																								...prev,
																								[user.id]: {
																									prev: user.role.name,
																									current: user.role.name,
																								},
																							}))
																						}
																						className="hover:bg-gray-100 dark:hover:bg-slate-900"
																					>
																						<Edit className="h-4 w-4" />
																					</Button>
																				</div>
																			)}
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>

														{/* 📃 Pagination */}
														{users.totalPages > 1 && (
															<Pagination className="mt-6">
																<PaginationContent>
																	{/* ◀ Previous */}
																	<PaginationItem>
																		<PaginationPrevious
																			onClick={() =>
																				page > 1 && setPage(page - 1)
																			}
																			className={
																				page === 1
																					? "pointer-events-none opacity-50"
																					: "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
																			}
																		/>
																	</PaginationItem>

																	{/* ⏺ Page Numbers */}
																	{(() => {
																		const pages = [];
																		const total = users.totalPages;
																		const maxVisible = 3;

																		// Always show first
																		pages.push(
																			<PaginationItem key={1}>
																				<PaginationLink
																					isActive={page === 1}
																					onClick={() => setPage(1)}
																					className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${page === 1 ? "bg-gray-100 dark:bg-slate-800" : ""}`}
																				>
																					1
																				</PaginationLink>
																			</PaginationItem>,
																		);

																		// Ellipsis before current chunk
																		if (page > maxVisible) {
																			pages.push(
																				<PaginationItem key="left-ellipsis">
																					<span className="px-2 text-gray-500 dark:text-slate-400">
																						...
																					</span>
																				</PaginationItem>,
																			);
																		}

																		// Pages around current page
																		const start = Math.max(2, page - 1);
																		const end = Math.min(total - 1, page + 1);

																		for (let i = start; i <= end; i++) {
																			pages.push(
																				<PaginationItem key={i}>
																					<PaginationLink
																						isActive={page === i}
																						onClick={() => setPage(i)}
																						className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${page === i ? "bg-gray-100 dark:bg-slate-800" : ""}`}
																					>
																						{i}
																					</PaginationLink>
																				</PaginationItem>,
																			);
																		}

																		// Ellipsis after current chunk
																		if (page < total - 2) {
																			pages.push(
																				<PaginationItem key="right-ellipsis">
																					<span className="px-2 text-gray-500 dark:text-slate-400">
																						...
																					</span>
																				</PaginationItem>,
																			);
																		}

																		// Always show last
																		if (total > 1) {
																			pages.push(
																				<PaginationItem key={total}>
																					<PaginationLink
																						isActive={page === total}
																						onClick={() => setPage(total)}
																						className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${page === total ? "bg-gray-100 dark:bg-slate-800" : ""}`}
																					>
																						{total}
																					</PaginationLink>
																				</PaginationItem>,
																			);
																		}

																		return pages;
																	})()}

																	{/* ▶ Next */}
																	<PaginationItem>
																		<PaginationNext
																			onClick={() =>
																				page < users.totalPages &&
																				setPage(page + 1)
																			}
																			className={
																				page === users.totalPages
																					? "pointer-events-none opacity-50"
																					: "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
																			}
																		/>
																	</PaginationItem>
																</PaginationContent>
															</Pagination>
														)}
													</>
												) : (
													!userLoading && (
														<div className="text-center py-8 text-gray-500 dark:text-slate-400">
															No users found.
														</div>
													)
												)}
											</div>
										)}
									</div>
								</CardContent>
							</>
						)}
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
