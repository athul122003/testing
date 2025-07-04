"use client";

import { useState } from "react";
import { BlogForm } from "~/components/blog1/blog-form";
import { BlogsPage } from "~/components/blog1/blogs-page";
import { DashboardContent } from "~/components/dashboard1/dashboard-content";
import { EventForm } from "~/components/event1/event-form";
import { EventsPage } from "~/components/event1/events-page";
import { GalleryPage } from "~/components/gallery1/gallery-page";
import { AppSidebar } from "~/components/others1/app-sidebar";
import { TopBar } from "~/components/others1/top-bar";
import { PaymentsPage } from "~/components/payments1/payments-page";
import { SettingsPage } from "~/components/settings1/settings-page";
import { UsersPage } from "~/components/user1/users-page";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

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
