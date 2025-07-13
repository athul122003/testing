"use client";

import { ChevronRight, Home } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "../ui/button";

interface DashboardBreadCrumbItem {
	title: string;
}

interface DashboardBreadCrumbProps {
	items: DashboardBreadCrumbItem[];
	setActivePage: (page: string) => void;
}

export function DashboardBreadCrumb({
	items,
	setActivePage,
}: DashboardBreadCrumbProps) {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbLink
					asChild
					className="flex items-center gap-1 hover:text-gray-400 dark:hover:text-gray-200"
				>
					<Button onClick={() => setActivePage("dashboard")} variant="ghost">
						<Home className="h-4 w-4" />
						<span className="hidden md:inline">Home</span>
					</Button>
				</BreadcrumbLink>
				{items.map((item, index) => (
					<div key={item.title} className="flex items-center gap-2">
						<BreadcrumbSeparator>
							<ChevronRight className="h-4 w-4 text-gray-400" />
						</BreadcrumbSeparator>
						{index === items.length - 1 ? (
							<BreadcrumbPage className="font-medium">
								{item.title}
							</BreadcrumbPage>
						) : (
							<BreadcrumbLink
								asChild
								className="hover:text-gray-200 dark:hover:text-black cursor-pointer"
							>
								<Button
									onClick={() => {
										console.log(`Navigating to ${item.title}`);
										setActivePage(item.title.toLowerCase());
									}}
								>
									{item.title}
								</Button>
							</BreadcrumbLink>
						)}
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
