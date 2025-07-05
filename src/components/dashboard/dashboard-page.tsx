"use client";

import { useState } from "react";
import { BlogForm } from "~/components/blog/blog-form";
import { BlogsPage } from "~/components/blog/blogs-page";
import { DashboardContent } from "~/components/dashboard/dashboard-content";
import { EventForm } from "~/components/event/event-form";
import { EventsPage } from "~/components/event/events-page";
import { GalleryPage } from "~/components/gallery/gallery-page";
import { AppSidebar } from "~/components/othercomps/app-sidebar";
import { TopBar } from "~/components/othercomps/top-bar";
import { PaymentsPage } from "~/components/payments/payments-page";
import { SettingsPage } from "~/components/settings/settings-page";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { UsersPage } from "~/components/user1/users-page";

export function Dashboard() {
	const [activePage, setActivePage] = useState("dashboard");
	const [editingEvent, setEditingEvent] = useState(null);
	const [editingBlog, setEditingBlog] = useState(null);

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
				return <UsersPage />;
			case "settings":
				return <SettingsPage />;
			default:
				return <DashboardContent />;
		}
	};

	return (
		<div className="dark min-h-screen bg-gray-50 dark:bg-black">
			<SidebarProvider defaultOpen={true}>
				<AppSidebar activePage={activePage} setActivePage={setActivePage} />
				<SidebarInset>
					<TopBar setActivePage={setActivePage} />
					<main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-gray-950 min-h-[calc(100vh-4rem)]">
						<div className="max-w-7xl mx-auto">{renderPage()}</div>
					</main>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
