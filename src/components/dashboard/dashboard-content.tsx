"use client";

import {
	Activity,
	Calendar,
	FileText,
	ImageIcon,
	IndianRupeeIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useDashboardData } from "~/providers/dashboardDataContext";
import { ComponentLoading } from "../ui/loader";
import { useEffect, useState } from "react";

const stats = [
	{
		id: "events",
		title: "Total Events",
		value: "0",
		icon: Calendar,
		color: "from-blue-500 to-blue-600",
	},
	{
		id: "blogs",
		title: "Blog Posts",
		value: "0",
		icon: FileText,
		color: "from-green-500 to-green-600",
	},
	{
		id: "gallery",
		title: "Gallery Items",
		value: "0",
		icon: ImageIcon,
		color: "from-purple-500 to-purple-600",
	},
	{
		id: "payments",
		title: "Total Revenue",
		value: "0",
		icon: IndianRupeeIcon,
		color: "from-yellow-500 to-yellow-600",
	},
];

const recentEvents: any[] = [];

const recentActivity: any[] = [];

export function DashboardContent() {
	const [isLoading, setIsLoading] = useState(true);
	const { summaryStatsQuery, eventsQuery } = useDashboardData();
	const { data: summaryStatsData, isLoading: summaryLoading } =
		summaryStatsQuery;
	const summaryStats = summaryStatsData ?? {
		totalRevenue: 0,
	};
	const { data: eventsData, isLoading: eventsLoading } = eventsQuery;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need of exhaustive dependencies>
	useEffect(() => {
		if (!summaryLoading && !eventsLoading) {
			setIsLoading(false);
		}
	}, [summaryLoading, eventsLoading]);

	stats.find((stat) => stat.id === "payments")!.value =
		summaryStats.totalRevenue.toLocaleString("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 0,
		});

	stats.find((stat) => stat.id === "events")!.value =
		eventsData?.data.length.toString() || "0";

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
					Dashboard
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Welcome back! Here's what's happening with your platform.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
				{stats.map((stat) => (
					<Card
						key={stat.title}
						className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-900"
					>
						<div
							className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}
						/>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
								{stat.title}
							</CardTitle>
							<div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
								<stat.icon className="h-4 w-4 text-white" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{isLoading ? <ComponentLoading size="sm" /> : stat.value}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* <div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
							<Calendar className="h-5 w-5" />
							Recent Events
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentEvents.map((event) => (
								<div
									key={event.name}
									className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								>
									<div className="flex-1">
										<h4 className="font-medium text-gray-900 dark:text-white">
											{event.name}
										</h4>
										<p className="text-sm text-gray-500 dark:text-gray-400">
											{event.date} • {event.attendees} attendees
										</p>
									</div>
									<div
										className={`px-3 py-1 rounded-full text-xs font-medium ${
											event.status === "Published"
												? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
												: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
										}`}
									>
										{event.status}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
							<Activity className="h-5 w-5" />
							Recent Blogs
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentActivity.map((activity) => (
								<div
									key={`${activity.action}-${activity.time}`}
									className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								>
									<div
										className={`w-2 h-2 rounded-full ${
											activity.type === "user"
												? "bg-blue-500"
												: activity.type === "payment"
													? "bg-green-500"
													: activity.type === "event"
														? "bg-purple-500"
														: "bg-orange-500"
										}`}
									/>
									<div className="flex-1">
										<p className="text-sm font-medium text-gray-900 dark:text-white">
											{activity.action}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{activity.user} • {activity.time}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div> */}
		</div>
	);
}
