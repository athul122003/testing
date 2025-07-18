"use client";

import { Moon, Search, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { signOut, useSession } from "next-auth/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { DashboardBreadCrumb } from "../customcomps/dashboardBreadCrumb";
import { permissionKeys } from "~/actions/middleware/routePermissions";

interface TopBarProps {
	activePage: string;
	setActivePage: (page: string) => void;
}

const navigationMap: Record<string, { title: string }> = {
	dashboard: { title: "Dashboard" },
	events: { title: "Events" },
	blogs: { title: "Blogs" },
	gallery: { title: "Gallery" },
	payments: { title: "Payments" },
	users: { title: "Users" },
	"blog-form": { title: "Blog Form" },
	"event-form": { title: "Event Form" },
};
import { useDashboardData } from "~/providers/dashboardDataContext";

export function TopBar({ activePage, setActivePage }: TopBarProps) {
	const { data: session } = useSession();
	const { user, role, hasPerm } = useDashboardData();
	const searchItems = [
		{ title: "Dashboard", category: "Pages", id: "dashboard" },
		{ title: "Events", category: "Pages", id: "events" },
		{ title: "Blogs", category: "Pages", id: "blogs" },
		{ title: "Gallery", category: "Pages", id: "gallery" },
		{ title: "Payments", category: "Pages", id: "payments" },
		...(hasPerm(
			permissionKeys.MANAGE_USER_ROLES,
			permissionKeys.MANAGE_ROLE_PERMISSIONS,
		)
			? [{ title: "Users", category: "Pages", id: "users" }]
			: []), //  Only show if permission exists
		{ title: "Settings", category: "Pages", id: "settings" },
	];

	const [searchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const { theme, setTheme } = useTheme();

	const generateBreadcrumbItems = () => {
		if (activePage === "dashboard") {
			return [];
		}
		const current = navigationMap[activePage];
		if (!current) {
			return [];
		}
		const items = [{ title: current.title }];
		if (activePage === "event-form") {
			items.unshift({ title: "Events" });
		}
		if (activePage === "blog-form") {
			items.unshift({ title: "Blogs" });
		}
		return items;
	};

	const filteredItems = searchItems.filter((item) =>
		item.title.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleSelect = (id: string) => {
		setActivePage(id);
		setSearchOpen(false);
		setSearchTerm("");
	};

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<>
			<header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
				<div className="relative flex items-center h-full px-6">
					<div className="flex items-center gap-4 min-w-[120px]">
						<DashboardBreadCrumb
							items={generateBreadcrumbItems()}
							setActivePage={setActivePage}
						/>
					</div>
					<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Search everything..."
								className="pl-10 w-80 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
								onClick={() => setSearchOpen(true)}
								readOnly
							/>
						</div>
					</div>
					<div className="flex items-center gap-4 ml-auto">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								console.log("Toggling theme", theme);
								toggleTheme();
							}}
							className="h-9 w-9 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="sr-only">Toggle theme</span>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg p-2 transition-colors">
									<Avatar className="h-8 w-8">
										<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
											<User className="h-4 w-4" />
										</AvatarFallback>
									</Avatar>
									<div className="text-left">
										<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
											{`${user?.name} || ID: ${user?.id}`}
										</p>

										<p className="text-xs text-gray-500 dark:text-gray-400">
											{user?.email} || {role}
										</p>
									</div>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
							>
								<DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
									Profile Settings
								</DropdownMenuItem>
								<DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
									Account
								</DropdownMenuItem>
								<DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
									Preferences
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={async () => {
										try {
											const res = await fetch("/api/auth/revoke", {
												method: "POST",
												headers: {
													"Content-Type": "application/json",
												},
												body: JSON.stringify({ userId: session?.user.id }),
											});

											if (!res.ok) {
												throw new Error("Failed to revoke refresh tokens");
											}

											toast.success("Signed out successfully!");
											await signOut({ callbackUrl: "/auth/login" });
										} catch (err) {
											console.error("Sign out failed:", err);
											toast.error("Error signing out");
										}
									}}
									className="text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
								>
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<Dialog open={searchOpen} onOpenChange={setSearchOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
					<div className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Search pages..."
								className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:bg-gray-50 dark:focus:bg-gray-800 focus:border-blue-600"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							{filteredItems.length > 0 ? (
								filteredItems.map((item) => (
									<button
										key={item.title}
										type="button"
										className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-900 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
										onClick={() => handleSelect(item.id)}
									>
										{item.title}
									</button>
								))
							) : (
								<div className="p-2 text-gray-500 text-center">
									No results found
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
