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
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "~/components/ui/sidebar";

const menuItems = [
	{ title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
	{ title: "Events", icon: Calendar, id: "events" },
	{ title: "Blogs", icon: FileText, id: "blogs" },
	{ title: "Gallery", icon: ImageIcon, id: "gallery" },
	{ title: "Payments", icon: CreditCard, id: "payments" },
	{ title: "Users", icon: Users, id: "users" },
	{ title: "Settings", icon: Settings, id: "settings" },
];

interface AppSidebarProps {
	activePage: string;
	setActivePage: (page: string) => void;
}

export function AppSidebar({ activePage, setActivePage }: AppSidebarProps) {
	return (
		<Sidebar className="border-r-0" style={{ backgroundColor: "#000000" }}>
			<SidebarHeader
				className="p-6 border-b border-gray-800"
				style={{ backgroundColor: "#000000" }}
			>
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
						<LayoutDashboard className="w-4 h-4 text-white" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-white">Admin Panel</h2>
						<p className="text-xs text-gray-400">Management System</p>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className="p-4" style={{ backgroundColor: "#000000" }}>
				<SidebarMenu className="space-y-2">
					{menuItems.map((item) => (
						<SidebarMenuItem key={item.id}>
							<SidebarMenuButton
								isActive={activePage === item.id}
								onClick={() => setActivePage(item.id)}
								className={`w-full h-12 rounded-xl transition-all duration-200 ${
									activePage === item.id
										? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
										: "text-gray-300 hover:text-white hover:bg-gray-900"
								}`}
							>
								<item.icon className="h-5 w-5" />
								<span className="font-medium">{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
