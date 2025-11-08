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
import { permissionKeys as perm } from "~/actions/middleware/routePermissions";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "~/components/ui/dialog";
import { useAddToCoreMutation } from "~/actions/tanstackHooks/core-queries";
import CoreManagement from "./core-management";
// import { addToCore } from "~/actions/core";

export function UsersPage() {
	const [isCoreModalOpen, setIsCoreModalOpen] = useState(false);

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
	//addToCore mutation
	const { mutate: addToCore, isPending: addToCorePending } =
		useAddToCoreMutation({
			onSuccessCallback: () => {
				setIsCoreModalOpen(false);
			},
		});
	//handleCore Submit
	const handleCoreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		addToCore(formData);
	};

	// const handleCoreSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
	// 	event.preventDefault();
	// 	const formData = new FormData(event.currentTarget);
	// 	const res = await addToCore(formData);
	// 	if (res.status === "success") {
	// 		toast.success("Added to core successfully");
	// 	} else {
	// 		toast.error("Failed to add to core");
	// 		console.error("Error adding to core:", res);
	// 	}
	// 	setIsCoreModalOpen(false);
	// };
	// // Fetch roles and permissions from the API

	const {
		hasPerm,
		rolesQuery,
		permissionsQuery,
		setUserParams,
		usersQuery,
		refetchUsers,
		refetchRoles,
	} = useDashboardData();
	const canManageUser = hasPerm(perm.MANAGE_USER_ROLES);
	const canManageRole = hasPerm(
		perm.MANAGE_ROLE_PERMISSIONS,
		perm.MANAGE_USER_ROLES,
	);
	const canManagePerm = hasPerm(perm.MANAGE_ROLE_PERMISSIONS);
	//const { data: permissions = [], isLoading: permLoading } = permissionsQuery;
	//const { data: roles = [], isLoading: roleLoading } = rolesQuery;
	//CHANGES AS PER THE PERMISSION BASED FETCHS
	const permissions = canManagePerm ? (permissionsQuery?.data ?? []) : [];
	const permLoading = canManagePerm
		? (permissionsQuery?.isLoading ?? false)
		: false;

	const roles = canManageRole ? (rolesQuery?.data ?? []) : [];
	const roleLoading = canManageRole ? (rolesQuery?.isLoading ?? false) : false;

	const [roleSearchTerm, setRoleSearchTerm] = useState("");
	const [rolePage, setRolePage] = useState(1);
	const ROLES_PER_PAGE = 4;

	const [bannedOnly, setBannedOnly] = useState(false);

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
			if (refetchRoles) refetchRoles(); // Refresh roles list
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to create Role.");
		},
	});
	const addNewRole = () => {
		if (!newRoleName) {
			toast.error("Please provide both department name and full name.");
			return;
		}
		createRoleMutation.mutate({ name: newRoleName.trim() } as any);
	};
	const deleteRoleMutation = api.role.deleteRole.useMutation({
		onSuccess: (delRole) => {
			toast.success(`Role ${delRole.name} deleted.`);
			if (refetchRoles) refetchRoles(); // Refresh roles list
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});
	const deleteRole = (roleId: string) => {
		if (!roleId) {
			toast.error("Please provide a valid department id for deletion.");
			return;
		}
		deleteRoleMutation.mutate({ id: roleId.trim() } as any);
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

			if (refetchRoles) refetchRoles(); // Refresh roles list
		},
		onError: (error: any) => {
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

	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const [roleSortOrder, setRoleSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedUsers, setSelectedUsers] = useState<StrikeUser[]>([]);
	const [editingRoles, setEditingRoles] = useState<
		Record<string, { prev: string; current: string }>
	>({});
	const [selectedRole, setSelectedRole] = useState(""); // for filtering by role
	const [sortBy, setSortBy] = useState<"role" | "name" | "id" | "strikeCount">(
		"role",
	);
	const [bulkSelectedRole, setBulkSelectedRole] = useState<string | null>(null);

	type StrikeUser = {
		id: number;
		name: string;
		usn?: string;
		memberSince?: Date | string | null;
		email?: string;
		phone?: string | null;
		role?: { id: number | string; name: string };
		banCount?: number;
		strikes: Array<{
			id: string;
			reason: string;
			createdAt: Date;
		}>;
	};

	const [strikeModalOpen, setStrikeModalOpen] = useState(false);
	const [strikeUser, setStrikeUser] = useState<StrikeUser | null>(null);
	const [strikeCount, setStrikeCount] = useState<number>(0);
	const [banCount, setBanCount] = useState<number>(0);

	const [addStrikeModalOpen, setAddStrikeModalOpen] = useState(false);
	const [newStrikeReason, setNewStrikeReason] = useState("");

	const addBanStreakMutation = api.user.addBanStreak.useMutation({
		onSuccess: async () => {
			toast.success("Strike added");
			if (refetchUsers) await refetchUsers();
			setStrikeCount((v) => v + 1);
		},
		onError: (err: unknown) => {
			const msg = err instanceof Error ? err.message : undefined;
			toast.error(msg || "Failed to add strike");
		},
	});

	const revokeBanMutation = api.user.revokeBan.useMutation({
		onSuccess: async () => {
			toast.success("Ban revoked");
			if (refetchUsers) await refetchUsers();
			setStrikeCount(0);
			setBanCount((v) => Math.max(0, v - 1));
		},
		onError: (err: unknown) => {
			const msg = err instanceof Error ? err.message : undefined;
			toast.error(msg || "Failed to revoke ban");
		},
	});

	const removeStrikeReasonMutation = api.user.removeStrikeReason.useMutation({
		onSuccess: async () => {
			toast.success("Strike removed");
			if (refetchUsers) await refetchUsers();
			setStrikeCount((v) => Math.max(0, v - 1));
		},
		onError: (err: unknown) => {
			const msg = err instanceof Error ? err.message : undefined;
			toast.error(msg || "Failed to remove strike");
		},
	});

	useEffect(() => {
		if (strikeUser) {
			console.log("Strike user updated:", strikeUser);
		}
	}, [strikeUser]);

	function openStrikeModal(user: StrikeUser) {
		setStrikeUser(user);
		setStrikeCount(user.strikes.length ?? 0);
		setBanCount(user.banCount ?? 0);
		setStrikeModalOpen(true);
	}

	function handleIncreaseStrike() {
		setNewStrikeReason("");
		setAddStrikeModalOpen(true);
	}

	function handleConfirmAddStrike() {
		if (!strikeUser) return;
		const reason = String(newStrikeReason ?? "").trim();
		if (!reason) {
			toast.error("Please enter a reason for the strike.");
			return;
		}

		toast.loading("Adding strike...");
		addBanStreakMutation.mutate(
			{ userId: strikeUser.id, reason },
			{
				onSuccess: () => {
					toast.dismiss();
					toast.success("Strike added.");
					setAddStrikeModalOpen(false);
					setNewStrikeReason("");
					setStrikeModalOpen(false);
				},
				onError: (err: unknown) => {
					toast.dismiss();
					const msg =
						err instanceof Error ? err.message : "Failed to add strike";
					toast.error(msg);
				},
			},
		);
	}

	function handleRevokeBan() {
		if (!strikeUser) return;
		toast.loading("Revoking ban...");
		revokeBanMutation.mutate(
			{ userId: strikeUser.id },
			{
				onSuccess: () => {
					toast.dismiss();
					toast.success("Ban revoked.");
				},
				onError: () => {
					toast.dismiss();
					toast.error("Failed to revoke ban.");
				},
			},
		);
	}

	//const { data: users, isLoading: userLoading } = usersQuery;
	//CHANGES AS PER THE PERMISSION BASED FETCHS
	const users = canManageUser && usersQuery?.data ? usersQuery.data : undefined;
	const userLoading = canManageUser ? (usersQuery?.isLoading ?? false) : false;
	useEffect(() => {
		if (!canManageUser || !setUserParams) return;
		setUserParams(
			searchTerm,
			page,
			10,
			sortBy,
			roleSortOrder,
			selectedRole || "all",
			bannedOnly,
		);
	}, [
		canManageUser,
		searchTerm,
		page,
		sortBy,
		roleSortOrder,
		selectedRole,
		setUserParams,
		bannedOnly,
	]);

	const singleUpdate = api.user.updateUserRole.useMutation({
		onSuccess: async (_, variables) => {
			if (refetchUsers) await refetchUsers();
			toast.dismiss();
			toast.success("Role updated.");

			// Exit editing mode for that specific user
			setEditingRoles((prev) => {
				const copy = { ...prev };
				const userId = (variables as { userId: number | string }).userId;
				delete copy[String(userId)]; // `userId` comes from mutation input
				return copy;
			});
		},
		onError: (err) => toast.error((err as any)?.message),
	});

	const bulkUpdate = api.user.updateMultipleUserRoles.useMutation({
		onSuccess: async () => {
			if (refetchUsers) await refetchUsers();
			toast.dismiss();
			toast.success("Roles updated for selected users.");
			setSelectedUsers([]);
		},
		onError: (err: any) => toast.error(err.message),
	});

	const searchParams = useSearchParams();
	const tabParam =
		searchParams.get("tab") ||
		(canManagePerm ? "permissions" : canManageUser ? "userManagement" : ""); // fallback priority
	const [activeTab, setActiveTab] = useState(tabParam);

	useEffect(() => {
		if (tabParam) setActiveTab(tabParam);
	}, [tabParam]);

	return (
		<div className="space-y-8">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList
					className="flex overflow-x-auto bg-white dark:bg-black border border-gray-300 dark:border-slate-800 rounded-lg"
					style={{ scrollbarWidth: "none" }}
				>
					{canManagePerm && (
						<TabsTrigger
							value="permissions"
							className="flex-1 min-w-[120px] text-center data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-slate-200 data-[state=active]:border-2 data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:rounded-md text-gray-700 dark:text-slate-200"
						>
							Role & Permissions
						</TabsTrigger>
					)}
					{canManageUser && (
						<TabsTrigger
							value="userManagement"
							className="flex-1 min-w-[120px] text-center data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-slate-200 data-[state=active]:border-2 data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:rounded-md text-gray-700 dark:text-slate-200"
						>
							User Management
						</TabsTrigger>
					)}
					{canManageUser && (
						<TabsTrigger
							value="coreManagement"
							className="flex-1 min-w-[120px] text-center data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-slate-200 data-[state=active]:border-2 data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:rounded-md text-gray-700 dark:text-slate-200"
						>
							Core Management
						</TabsTrigger>
					)}
				</TabsList>

				{canManageUser && (
					<TabsContent value="coreManagement">
						<CoreManagement />
					</TabsContent>
				)}

				{canManagePerm && (
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

										<div className="grid gap-4 md:grid-cols-2">
											{paginatedRoles.map((role) => {
												const isEditing = editingRoleId === role.id;
												const currentPermissionIds = Array.isArray(
													(role as any).permissions,
												)
													? (role as any).permissions.map(
															(p: any) => p.permission.id,
														)
													: [];
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
																				const permIds = Array.isArray(
																					(role as any).permissions,
																				)
																					? (role as any).permissions.map(
																							(p: any) => p.permission.id,
																						)
																					: [];

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
																	{((role as any).permissions ?? [])
																		.slice(0, 4)
																		.map((p: any) => (
																			<Badge
																				key={p.permission.id}
																				variant="secondary"
																				className="text-xs bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200"
																			>
																				{p.permission.name}
																			</Badge>
																		))}
																	{((role as any).permissions ?? []).length >
																		4 && (
																		<Badge
																			variant="outline"
																			className="text-xs border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400"
																		>
																			+
																			{((role as any).permissions ?? [])
																				.length - 4}{" "}
																			more
																		</Badge>
																	)}
																</div>
															)}
														</CardContent>
													</Card>
												);
											})}
										</div>

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
																		className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																			rolePage === 1
																				? "bg-gray-100 dark:bg-slate-800"
																				: ""
																		}`}
																	>
																		1
																	</PaginationLink>
																</PaginationItem>,
															);

															if (rolePage > maxVisible) {
																pages.push(
																	<PaginationItem key="left-ellipsis">
																		<span className="px-2 text-gray-500 dark:text-slate-400">
																			...
																		</span>
																	</PaginationItem>,
																);
															}

															const start = Math.max(2, rolePage - 1);
															const end = Math.min(total - 1, rolePage + 1);

															for (let i = start; i <= end; i++) {
																pages.push(
																	<PaginationItem key={i}>
																		<PaginationLink
																			isActive={rolePage === i}
																			onClick={() => setRolePage(i)}
																			className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																				rolePage === i
																					? "bg-gray-100 dark:bg-slate-800"
																					: ""
																			}`}
																		>
																			{i}
																		</PaginationLink>
																	</PaginationItem>,
																);
															}

															if (rolePage < total - 2) {
																pages.push(
																	<PaginationItem key="right-ellipsis">
																		<span className="px-2 text-gray-500 dark:text-slate-400">
																			...
																		</span>
																	</PaginationItem>,
																);
															}

															if (total > 1) {
																pages.push(
																	<PaginationItem key={total}>
																		<PaginationLink
																			isActive={rolePage === total}
																			onClick={() => setRolePage(total)}
																			className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																				rolePage === total
																					? "bg-gray-100 dark:bg-slate-800"
																					: ""
																			}`}
																		>
																			{total}
																		</PaginationLink>
																	</PaginationItem>,
																);
															}

															return pages;
														})()}

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
				)}
				{canManageUser && (
					<TabsContent value="userManagement">
						<Card className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 shadow-xl">
							{roleLoading ? (
								<ComponentLoading message="Loading Page..." />
							) : (
								<>
									<CardHeader className="px-4 sm:px-6">
										<CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-slate-200">
											User Management
										</CardTitle>
										<CardDescription className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
											Manage user Roles.
										</CardDescription>
									</CardHeader>
									<CardContent className="px-4 sm:px-6 space-y-6">
										<div className="space-y-4">
											<div className="relative w-full">
												<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
												<Input
													placeholder="Search by name, ID, or email..."
													value={searchTerm}
													onChange={(e) => setSearchTerm(e.target.value)}
													className="pl-10 w-full bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
												/>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
												<Select
													value={selectedRole ?? "all"}
													onValueChange={(val) =>
														setSelectedRole(val === "all" ? "" : val)
													}
												>
													<SelectTrigger className="w-full bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
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
														setSortBy(
															val as "role" | "name" | "id" | "strikeCount",
														)
													}
												>
													<SelectTrigger className="w-full bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
														<SelectValue placeholder="Sort by..." />
													</SelectTrigger>
													<SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
														<SelectItem value="role">Sort by Role</SelectItem>
														<SelectItem value="name">Sort by Name</SelectItem>
														<SelectItem value="id">Sort by ID</SelectItem>
														<SelectItem value="strikeCount">
															Sort by Strikes
														</SelectItem>
													</SelectContent>
												</Select>

												<Button
													variant="outline"
													onClick={() =>
														setRoleSortOrder((prev) =>
															prev === "asc" ? "desc" : "asc",
														)
													}
													className="w-full justify-center bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
												>
													{roleSortOrder === "asc" ? (
														<ArrowDownAZ className="h-4 w-4 mr-2" />
													) : (
														<ArrowUpAZ className="h-4 w-4 mr-2" />
													)}
													<span className="hidden sm:inline">
														{roleSortOrder === "asc" ? "A-Z" : "Z-A"}
													</span>
													<span className="sm:hidden">Sort</span>
												</Button>
												<Button
													variant={bannedOnly ? "destructive" : "outline"}
													onClick={() => {
														const newBanned = !bannedOnly;
														setBannedOnly(newBanned);
														setPage(1);

														if (setUserParams) {
															try {
																setUserParams(
																	searchTerm,
																	1,
																	10,
																	sortBy,
																	roleSortOrder,
																	selectedRole || "all",
																	newBanned,
																);
															} catch (e) {
																console.warn("setUserParams failed:", e);
															}
														}

														if (refetchUsers) {
															refetchUsers();
														}
													}}
													className={`w-full justify-center bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
														bannedOnly
															? "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 border-red-600 dark:border-red-700"
															: ""
													}`}
												>
													<span className="hidden sm:inline">
														{bannedOnly
															? "Showing Banned Members"
															: "Show Banned Only"}
													</span>
													<span className="sm:hidden">
														{bannedOnly ? "Banned" : "Ban Only"}
													</span>
												</Button>
											</div>
										</div>

										<Separator className="bg-gray-200 dark:bg-slate-800" />

										{userLoading ? (
											<ComponentLoading message="Loading Selected Users..." />
										) : (
											<div className="space-y-6">
												{selectedUsers.length > 0 && (
													<div className="rounded bg-gray-100 dark:bg-slate-900 p-4">
														<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
															<span className="font-medium text-orange-600 dark:text-orange-300 text-sm sm:text-base">
																Selected Users: {selectedUsers.length}
															</span>

															<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
																<Select
																	value={bulkSelectedRole || ""}
																	onValueChange={(newRole) =>
																		setBulkSelectedRole(newRole)
																	}
																>
																	<SelectTrigger className="w-full sm:w-52 bg-white dark:bg-black border-gray-300 dark:border-slate-800 text-gray-900 dark:text-slate-200">
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

																<div className="flex gap-2 justify-end sm:justify-start">
																	<Button
																		variant="ghost"
																		size="icon"
																		disabled={!bulkSelectedRole}
																		onClick={() => {
																			if (bulkSelectedRole) {
																				toast.loading("Updating roles...");
																				bulkUpdate.mutate({
																					userIds: selectedUsers.map(
																						(u) => u.id,
																					),
																					roleName: bulkSelectedRole,
																				});
																				setBulkSelectedRole(null);
																			}
																		}}
																		className="hover:bg-gray-200 dark:hover:bg-slate-800"
																	>
																		<Check className="h-4 w-4 text-green-500 dark:text-green-400" />
																	</Button>

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

																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => setIsCoreModalOpen(true)}
																		className="hover:bg-gray-200 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 whitespace-nowrap"
																	>
																		Add to Core
																	</Button>
																</div>
															</div>
														</div>

														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
															{selectedUsers.map((user) => (
																<div
																	key={user.id}
																	className="bg-white dark:bg-black px-3 py-2 rounded shadow flex justify-between items-center border border-gray-200 dark:border-slate-800"
																>
																	<div className="min-w-0 flex-1">
																		<p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">
																			{user.name}
																		</p>
																		<p className="text-xs text-gray-500 dark:text-slate-400 truncate">
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
																		className="hover:bg-gray-100 dark:hover:bg-slate-900 flex-shrink-0"
																	>
																		<X className="h-4 w-4 text-gray-500 dark:text-slate-400" />
																	</Button>
																</div>
															))}
														</div>
													</div>
												)}

												{users?.data?.length ? (
													<>
														<div className="w-full overflow-x-auto">
															<div className="min-w-full">
																<Table className="w-full bg-white dark:bg-black text-gray-900 dark:text-slate-200">
																	<TableHeader>
																		<TableRow className="bg-gray-50 dark:bg-slate-900">
																			<TableHead className="w-12 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800">
																				<span className="sr-only">Select</span>
																			</TableHead>
																			<TableHead className="min-w-[80px] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																				ID
																			</TableHead>
																			<TableHead className="min-w-[120px] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																				Name
																			</TableHead>
																			<TableHead className="min-w-[180px] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																				Email
																			</TableHead>
																			<TableHead className="min-w-[180px] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																				Phone
																			</TableHead>
																			<TableHead className="min-w-[200px] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																				Role
																			</TableHead>
																			<TableHead className="min-w-[200px] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
																				Strikes
																			</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{users.data.map((user) => (
																			<TableRow
																				key={user.id}
																				className="hover:bg-gray-50 dark:hover:bg-slate-900"
																			>
																				<TableCell className="w-12">
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
																					<div className="truncate max-w-[80px]">
																						{user.id}
																					</div>
																				</TableCell>

																				<TableCell className="text-gray-900 dark:text-slate-200">
																					<div className="truncate max-w-[120px]">
																						{user.name}
																					</div>
																				</TableCell>

																				<TableCell className="text-gray-500 dark:text-slate-400">
																					<div className="truncate max-w-[180px]">
																						{user.email}
																					</div>
																				</TableCell>
																				<TableCell className="text-gray-500 dark:text-slate-400">
																					<div className="truncate max-w-[180px]">
																						{user.phone}
																					</div>
																				</TableCell>
																				<TableCell>
																					{editingRoles[user.id] ? (
																						<div className="flex gap-2 items-center min-w-[200px]">
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
																									toast.loading(
																										"Updating role...",
																									);
																									singleUpdate.mutate({
																										userId: user.id,
																										roleName:
																											editingRoles[user.id]
																												.current,
																									});
																								}}
																								className="hover:bg-gray-100 dark:hover:bg-slate-900 flex-shrink-0"
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
																								className="hover:bg-gray-100 dark:hover:bg-slate-900 flex-shrink-0"
																							>
																								<X className="text-red-500 dark:text-red-400 h-4 w-4" />
																							</Button>
																						</div>
																					) : (
																						<div className="flex justify-between items-center min-w-[200px]">
																							<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 truncate max-w-[140px]">
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
																								className="hover:bg-gray-100 dark:hover:bg-slate-900 flex-shrink-0"
																							>
																								<Edit className="h-4 w-4" />
																							</Button>
																						</div>
																					)}
																				</TableCell>
																				<TableCell>
																					<div className="flex items-center gap-2">
																						<Badge
																							variant={
																								user.strikes.length === 0
																									? "outline"
																									: user.strikes.length < 3
																										? "secondary"
																										: "destructive"
																							}
																							className="px-2 py-1 text-sm font-medium min-w-[40px]"
																						>
																							{user.strikes.length}
																						</Badge>
																						<Button
																							variant="ghost"
																							size="icon"
																							onClick={() =>
																								openStrikeModal(
																									user as unknown as StrikeUser,
																								)
																							}
																							className="hover:bg-gray-100 dark:hover:bg-slate-900"
																						>
																							<Edit className="h-4 w-4" />
																						</Button>
																					</div>
																				</TableCell>
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															</div>
														</div>

														{users.totalPages > 1 && (
															<div className="flex justify-center">
																<Pagination className="mt-6">
																	<PaginationContent className="flex-wrap gap-1">
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

																		{(() => {
																			const pages = [];
																			const total = users.totalPages;
																			const maxVisible =
																				window.innerWidth < 640 ? 2 : 3;

																			if (total <= 5) {
																				for (let i = 1; i <= total; i++) {
																					pages.push(
																						<PaginationItem key={i}>
																							<PaginationLink
																								isActive={page === i}
																								onClick={() => setPage(i)}
																								className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																									page === i
																										? "bg-gray-100 dark:bg-slate-800"
																										: ""
																								}`}
																							>
																								{i}
																							</PaginationLink>
																						</PaginationItem>,
																					);
																				}
																			} else {
																				pages.push(
																					<PaginationItem key={1}>
																						<PaginationLink
																							isActive={page === 1}
																							onClick={() => setPage(1)}
																							className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																								page === 1
																									? "bg-gray-100 dark:bg-slate-800"
																									: ""
																							}`}
																						>
																							1
																						</PaginationLink>
																					</PaginationItem>,
																				);

																				if (page > maxVisible) {
																					pages.push(
																						<PaginationItem key="left-ellipsis">
																							<span className="px-2 text-gray-500 dark:text-slate-400">
																								...
																							</span>
																						</PaginationItem>,
																					);
																				}

																				const start = Math.max(2, page - 1);
																				const end = Math.min(
																					total - 1,
																					page + 1,
																				);

																				for (let i = start; i <= end; i++) {
																					pages.push(
																						<PaginationItem key={i}>
																							<PaginationLink
																								isActive={page === i}
																								onClick={() => setPage(i)}
																								className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																									page === i
																										? "bg-gray-100 dark:bg-slate-800"
																										: ""
																								}`}
																							>
																								{i}
																							</PaginationLink>
																						</PaginationItem>,
																					);
																				}

																				if (page < total - 2) {
																					pages.push(
																						<PaginationItem key="right-ellipsis">
																							<span className="px-2 text-gray-500 dark:text-slate-400">
																								...
																							</span>
																						</PaginationItem>,
																					);
																				}

																				if (total > 1) {
																					pages.push(
																						<PaginationItem key={total}>
																							<PaginationLink
																								isActive={page === total}
																								onClick={() => setPage(total)}
																								className={`cursor-pointer bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
																									page === total
																										? "bg-gray-100 dark:bg-slate-800"
																										: ""
																								}`}
																							>
																								{total}
																							</PaginationLink>
																						</PaginationItem>,
																					);
																				}
																			}

																			return pages;
																		})()}

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
															</div>
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
									</CardContent>
								</>
							)}
						</Card>
					</TabsContent>
				)}
			</Tabs>

			<Dialog open={addStrikeModalOpen} onOpenChange={setAddStrikeModalOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-black text-gray-900 dark:text-slate-200">
					<DialogHeader>
						<DialogTitle>Add Strike Reason</DialogTitle>
						<DialogDescription>
							Provide a short reason for adding a strike to this user.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						<label
							htmlFor="add-strike-reason"
							className="block text-sm font-medium text-gray-700 dark:text-slate-200"
						>
							Reason
						</label>
						<textarea
							id="add-strike-reason"
							value={newStrikeReason}
							onChange={(e) => setNewStrikeReason(e.target.value)}
							rows={4}
							className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g. NO SHOW"
						/>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setAddStrikeModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleConfirmAddStrike}
								disabled={!newStrikeReason.trim()}
							>
								{"Add Strike"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{isCoreModalOpen && (
				<Dialog open={isCoreModalOpen} onOpenChange={setIsCoreModalOpen}>
					<DialogContent className="max-w-md bg-white dark:bg-black text-gray-900 dark:text-slate-200">
						<DialogHeader>
							<DialogTitle>Add to Core Team</DialogTitle>
							<DialogDescription>
								Assign position and type for the selected users.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCoreSubmit}>
							<input
								type="hidden"
								name="userIds"
								value={JSON.stringify(selectedUsers.map((u) => u.id))}
							/>

							<div className="grid gap-4 mt-4">
								<div className="grid gap-1">
									<label htmlFor="position" className="text-sm font-medium">
										Position
									</label>
									<Input
										id="position"
										name="position"
										required
										placeholder="eg. Technical Head"
									/>
								</div>

								<div className="grid gap-1">
									<label htmlFor="type" className="text-sm font-medium">
										Type
									</label>
									<Select name="type" required>
										<SelectTrigger className="w-full bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700">
											<SelectValue placeholder="Select Type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="OFFICE_BEARER">
												Office Bearer
											</SelectItem>
											<SelectItem value="FACULTY_COORDINATOR">
												Faculty Coordinator
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="grid gap-1">
									<label htmlFor="year" className="text-sm font-medium">
										Year
									</label>
									<Select name="year" required>
										<SelectTrigger className="w-full bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700">
											<SelectValue placeholder="Select Year" />
										</SelectTrigger>
										<SelectContent>
											{Array.from({ length: 6 }, (_, i) => {
												const year = String(new Date().getFullYear() - i);
												return (
													<SelectItem key={year} value={year}>
														{year}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-1">
									<label htmlFor="priority" className="text-sm font-medium">
										Priority
									</label>
									<Input
										id="priority"
										name="priority"
										type="number"
										required
										placeholder="eg. 1"
									/>
								</div>
							</div>

							<div className="mt-6 flex justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									onClick={() => setIsCoreModalOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={addToCorePending}>
									Confirm
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			)}

			<Dialog open={strikeModalOpen} onOpenChange={setStrikeModalOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-black text-gray-900 dark:text-slate-200">
					<DialogHeader>
						<DialogTitle>Strike Details</DialogTitle>
						<DialogDescription>
							View and manage strikes and bans for the user.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-700 dark:text-slate-300">
								Strikes
							</span>
							<Badge className="text-sm">{strikeCount}</Badge>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-700 dark:text-slate-300">
								Bans
							</span>
							<Badge className="text-sm">{banCount}</Badge>
						</div>

						<div>
							<h4 className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">
								Reasons
							</h4>
							<ul className="list-disc ml-5 text-sm text-gray-700 dark:text-slate-300 space-y-2">
								{(strikeUser?.strikes ?? []).map((s) => (
									<li
										key={`${s.id}`}
										className="flex items-start justify-between gap-3"
									>
										<span className="mr-3">{s.reason}</span>
										<div className="flex-shrink-0">
											<Button
												variant="destructive"
												size="sm"
												onClick={() => {
													if (!strikeUser) return;
													toast.loading("Deleting strike...");
													removeStrikeReasonMutation.mutate(
														{ userId: strikeUser.id, strikeId: s.id },
														{
															onSuccess: () => {
																toast.dismiss();
																toast.success("Strike removed.");
																setStrikeModalOpen(false);
															},
															onError: () => {
																toast.dismiss();
																toast.error("Failed to remove strike.");
															},
														},
													);
												}}
											>
												Delete Strike
											</Button>
										</div>
									</li>
								))}
							</ul>
						</div>

						<div className="flex justify-end gap-2 mt-4">
							<Button onClick={handleIncreaseStrike}>Add Strike</Button>

							<Button variant="ghost" onClick={() => setStrikeModalOpen(false)}>
								Close
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
