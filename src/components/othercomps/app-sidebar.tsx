"use client";

import gsap from "gsap";
import {
	Calendar,
	CreditCard,
	FileText,
	ImageIcon,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "~/components/ui/sidebar";
import * as ToolTip from "../ui/tooltip";
import { useDashboardData } from "~/providers/dashboardDataContext";
import { permissionKeys } from "~/actions/middleware/routePermissions";

interface AppSidebarProps {
	activePage: string;
	setActivePage: (page: string) => void;
}

export function AppSidebar({ activePage, setActivePage }: AppSidebarProps) {
	const { hasPerm } = useDashboardData();

	const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	const indicatorRef = useRef<HTMLDivElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// UPDATE FOR PERMISSION BASED RENDERING
	const menuItems = [
		{ title: "", icon: LayoutDashboard, id: "dashboard" },
		{ title: "", icon: Calendar, id: "events" },
		{ title: "", icon: FileText, id: "blogs" },
		{ title: "", icon: ImageIcon, id: "gallery" },
		{ title: "", icon: CreditCard, id: "payments" },
		...(hasPerm(
			permissionKeys.MANAGE_USER_ROLES,
			permissionKeys.MANAGE_ROLE_PERMISSIONS,
		)
			? [{ title: "", icon: Users, id: "users" }]
			: []), // Users menu item only if user has permission
		{ title: "", icon: Settings, id: "settings" },
	];

	const moveIndicator = () => {
		const activeBtn = itemRefs.current[activePage];
		const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
		if (activeBtn && indicatorRef.current) {
			const { top, height } = activeBtn.getBoundingClientRect();
			gsap.to(indicatorRef.current, {
				top: top - containerTop,
				height,
				duration: 0.1,
				ease: "",
			});
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need of exhaustive dependencies>
	useLayoutEffect(() => {
		moveIndicator();
		const resizeObserver = new ResizeObserver(() => moveIndicator());
		if (containerRef.current) resizeObserver.observe(containerRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need of exhaustive dependencies>
	useEffect(() => {
		moveIndicator();
	}, [activePage]);

	return (
		<Sidebar className="border-r-0 bg-white dark:bg-black">
			<SidebarContent className="p-4 bg-white dark:bg-black">
				<div ref={containerRef} className="relative">
					<div
						ref={indicatorRef}
						className="absolute left-0 top-0 h-8 w-8 rounded-xl bg-gradient-to-b from-blue-500 to-purple-600 transition-all"
						style={{
							top: 0,
							height: 32,
						}}
					/>
				</div>
				<SidebarMenu className="space-y-2 flex flex-col justify-between my-12 h-full">
					{menuItems.map((item) => (
						<SidebarMenuItem key={item.id}>
							<ToolTip.Tooltip>
								<ToolTip.TooltipTrigger asChild>
									<SidebarMenuButton
										ref={(el) => {
											itemRefs.current[item.id] = el;
										}}
										isActive={activePage === item.id}
										onClick={() => setActivePage(item.id)}
									>
										<item.icon className={`h-5 w-5`} />
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
