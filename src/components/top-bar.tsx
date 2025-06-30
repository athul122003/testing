"use client";

import { Search, User } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { SidebarTrigger } from "~/components/ui/sidebar";

const searchItems = [
	{ title: "Dashboard", category: "Pages", id: "dashboard" },
	{ title: "Events", category: "Pages", id: "events" },
	{ title: "Blogs", category: "Pages", id: "blogs" },
	{ title: "Gallery", category: "Pages", id: "gallery" },
	{ title: "Payments", category: "Pages", id: "payments" },
	{ title: "Users", category: "Pages", id: "users" },
	{ title: "Settings", category: "Pages", id: "settings" },
];

interface TopBarProps {
	setActivePage: (page: string) => void;
}

export function TopBar({ setActivePage }: TopBarProps) {
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const filteredItems = searchItems.filter((item) =>
		item.title.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleSelect = (id: string) => {
		setActivePage(id);
		setSearchOpen(false);
		setSearchTerm("");
	};

	return (
		<>
			<header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
				<div className="flex items-center justify-between h-full px-6">
					<div className="flex items-center gap-4">
						<SidebarTrigger className="text-gray-600 dark:text-gray-400" />
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Search everything..."
								className="pl-10 w-80 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
								onClick={() => setSearchOpen(true)}
							/>
						</div>
					</div>

					<div className="flex items-center gap-4">
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
											Admin User
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											admin@example.com
										</p>
									</div>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuItem>Profile Settings</DropdownMenuItem>
								<DropdownMenuItem>Account</DropdownMenuItem>
								<DropdownMenuItem>Preferences</DropdownMenuItem>
								<DropdownMenuItem className="text-red-600">
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<Dialog open={searchOpen} onOpenChange={setSearchOpen}>
				<DialogContent className="max-w-md">
					<div className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Search pages..."
								className="pl-10"
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
										className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
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
