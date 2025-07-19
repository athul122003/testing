"use client";

import type { Blog } from "@prisma/client"; // TODO [RAHUL]: Check functionality once again if anything breaks or not, have put this import to avoid type errors
import { useState } from "react";
import { BlogForm } from "~/components/blog/blog-form";
import { BlogsPage } from "~/components/blog/blogs-page";
import { DashboardContent } from "~/components/dashboard/dashboard-content";
import { EventForm } from "~/components/event/event-form";
import { EventsPage } from "~/components/event/events-page";
import { EventParticipants } from "~/components/event/event-participants";
import { EventAttendance } from "~/components/event/event-attendance";
import { GalleryPage } from "~/components/gallery/gallery-page";
import { AppSidebar } from "~/components/othercomps/app-sidebar";
import { TopBar } from "~/components/othercomps/top-bar";
import { PaymentsPage } from "~/components/payments/payments-page";
import { SettingsPage } from "~/components/settings/settings-page";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { UsersPage } from "~/components/user1/users-page";
import { useDashboardData } from "~/providers/dashboardDataContext";
import { permissionKeys as perm } from "~/actions/middleware/routePermissions";

export function Dashboard() {
	const { hasPerm } = useDashboardData();
	const [activePage, setActivePage] = useState("dashboard");
	const [editingEvent, setEditingEvent] = useState(null);
	const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

	const renderPage = () => {
		switch (activePage) {
			case "dashboard":
				return <DashboardContent />;
			case "events":
				return (
					<EventsPage
						setActivePage={setActivePage}
						setEditingEvent={setEditingEvent}
					/>
				);
			case "event-form":
				return (
					<EventForm
						setActivePage={setActivePage}
						editingEvent={editingEvent}
						setEditingEvent={setEditingEvent}
					/>
				);
			case "event-participants":
				return <EventParticipants editingEvent={editingEvent} />;
			case "event-attendance":
				return <EventAttendance editingEvent={editingEvent} />;
			case "blogs":
				return (
					<BlogsPage
						setActivePage={setActivePage}
						setEditingBlog={setEditingBlog}
					/>
				);
			case "blog-form":
				return (
					<BlogForm
						setActivePage={setActivePage}
						editingBlog={editingBlog}
						setEditingBlog={setEditingBlog}
					/>
				);
			case "gallery":
				return <GalleryPage />;
			case "payments":
				return <PaymentsPage />;
			case "users":
				if (hasPerm(perm.MANAGE_USER_ROLES, perm.MANAGE_ROLE_PERMISSIONS)) {
					return <UsersPage />;
				} else {
					setActivePage("dashboard");
					return <DashboardContent />;
				}
			case "settings":
				return <SettingsPage />;
			default:
				return <DashboardContent />;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-black">
			<SidebarProvider defaultOpen={true}>
				<AppSidebar activePage={activePage} setActivePage={setActivePage} />
				<SidebarInset>
					<TopBar activePage={activePage} setActivePage={setActivePage} />
					<main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-gray-950 min-h-[calc(100vh-4rem)]">
						<div className="max-w-7xl mx-auto">{renderPage()}</div>
					</main>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
