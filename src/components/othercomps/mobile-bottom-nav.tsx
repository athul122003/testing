"use client";

import {
	Calendar,
	CreditCard,
	FileText,
	LayoutDashboard,
	Menu,
	Settings,
	Users,
} from "lucide-react";
import { useState } from "react";
import { permissionKeys } from "~/actions/middleware/routePermissions";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { useDashboardData } from "~/providers/dashboardDataContext";

interface MobileBottomNavProps {
	activePage: string;
	setActivePage: (page: string) => void;
}

export function MobileBottomNav({
	activePage,
	setActivePage,
}: MobileBottomNavProps) {
	const { hasPerm } = useDashboardData();
	const [isOpen, setIsOpen] = useState(false);

	const menuItems = [
		{ title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
		{ title: "Events", icon: Calendar, id: "events" },
		{ title: "Blogs", icon: FileText, id: "blogs" },
		{ title: "Payments", icon: CreditCard, id: "payments" },
		...(hasPerm(
			permissionKeys.MANAGE_USER_ROLES,
			permissionKeys.MANAGE_ROLE_PERMISSIONS,
		)
			? [{ title: "Users", icon: Users, id: "users" }]
			: []),
		{ title: "Settings", icon: Settings, id: "settings" },
	];

	// Show first 4 items in bottom nav, rest in menu
	const bottomNavItems = menuItems.slice(0, 4);
	const menuSheetItems = menuItems.slice(4);

	const handleNavClick = (pageId: string) => {
		setActivePage(pageId);
		setIsOpen(false);
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50">
			<div className="grid grid-cols-5 h-16">
				{bottomNavItems.map((item) => (
					<Button
						key={item.id}
						variant="ghost"
						className={`h-full rounded-none flex flex-col items-center justify-center gap-1 text-xs ${
							activePage === item.id
								? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
								: "text-gray-600 dark:text-gray-400"
						}`}
						onClick={() => handleNavClick(item.id)}
					>
						<item.icon className="h-5 w-5" />
						<span className="truncate">{item.title}</span>
					</Button>
				))}

				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							className="h-full rounded-none flex flex-col items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400"
						>
							<Menu className="h-5 w-5" />
							<span>More</span>
						</Button>
					</SheetTrigger>
					<SheetContent
						side="bottom"
						className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-t-2xl"
					>
						<SheetHeader>
							<SheetTitle className="text-gray-900 dark:text-gray-100 text-center">
								Navigation Menu
							</SheetTitle>
						</SheetHeader>
						<div className="grid gap-2 py-6">
							{menuSheetItems.map((item) => (
								<Button
									key={item.id}
									variant="ghost"
									className={`justify-start gap-3 h-12 text-left ${
										activePage === item.id
											? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
											: "text-gray-900 dark:text-gray-100"
									}`}
									onClick={() => handleNavClick(item.id)}
								>
									<item.icon className="h-5 w-5" />
									{item.title}
								</Button>
							))}
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
}
