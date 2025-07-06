"use client";

import {
	Calendar,
	CreditCard,
	FileText,
	ImageIcon,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "~/components/ui/sidebar";
import * as ToolTip from "../ui/tooltip";

const menuItems = [
	{ title: "", icon: LayoutDashboard, id: "dashboard" },
	{ title: "", icon: Calendar, id: "events" },
	{ title: "", icon: FileText, id: "blogs" },
	{ title: "", icon: ImageIcon, id: "gallery" },
	{ title: "", icon: CreditCard, id: "payments" },
	{ title: "", icon: Users, id: "users" },
	{ title: "", icon: Settings, id: "settings" },
];

interface AppSidebarProps {
	activePage: string;
	setActivePage: (page: string) => void;
}

export function AppSidebar({ activePage, setActivePage }: AppSidebarProps) {
	return (
		<Sidebar className="border-r-0 bg-white dark:bg-black">
			{/* <SidebarHeader
				className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
			>
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
						<LayoutDashboard className="w-4 h-4 text-white" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h2>
						<p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
					</div>
				</div>
			</SidebarHeader> */}
			<SidebarContent className="p-4 bg-white dark:bg-black">
				<SidebarMenu className="space-y-2 flex flex-col justify-between h-full mt-4">
					{menuItems.map((item) => (
						<SidebarMenuItem key={item.id}>
							<ToolTip.Tooltip>
								<ToolTip.TooltipTrigger asChild>
									<SidebarMenuButton
										isActive={activePage === item.id}
										onClick={() => setActivePage(item.id)}
										className={`w-8 h-12 rounded-xl transition-all duration-200
											${
												activePage === item.id
													? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
													: "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-200 dark:hover:bg-gray-900"
											}`}
									>
										<item.icon className="h-5 w-5 text-black dark:text-white" />
										<span className="font-medium">{item.title}</span>
									</SidebarMenuButton>
								</ToolTip.TooltipTrigger>
								<ToolTip.TooltipContent className="bg-white dark:bg-black translate-x-1/2 text-gray-900 dark:text-white rounded-lg shadow-lg">
									{item.id.charAt(0).toUpperCase() + item.id.slice(1)}
								</ToolTip.TooltipContent>
							</ToolTip.Tooltip>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
