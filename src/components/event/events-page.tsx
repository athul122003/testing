// @ts-nocheck

"use client";

import {
	Calendar,
	Clock,
	DollarSign,
	Eye,
	MapPin,
	Plus,
	Users,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { deleteEventAction, publishEventAction } from "~/actions/event";
import { useEvents } from "~/actions/tanstackHooks/events-queries";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { ComponentLoading } from "../ui/component-loading";

interface EventsPageProps {
	setActivePage: (page: string) => void;
	// biome-ignore lint/suspicious/noExplicitAny: FIX THIS LATER
	setEditingEvent: (event: any) => void;
}

export function EventsPage({
	setActivePage,
	setEditingEvent,
}: EventsPageProps) {
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const { data: eventsData, isLoading } = useEvents();

	const events = eventsData?.data || [];

	const handleCreateEvent = () => {
		setEditingEvent(null);
		setActivePage("event-form");
	};

	const handleEditEvent = (event: Event) => {
		const eventForForm = {
			...event,
			fromDate: event.fromDate.toISOString().slice(0, 16), // for datetime-local input
			toDate: event.toDate.toISOString().slice(0, 16),
			deadline: event.deadline ? event.deadline.toISOString().slice(0, 16) : "",
		};

		setEditingEvent(eventForForm);
		setActivePage("event-form");
		setIsDetailOpen(false);
	};

	const handleDeleteEvent = async (eventId) => {
		const res = await deleteEventAction(eventId);
		if (res.success) {
			toast.success("Event deleted successfully.");
			setEvents((prev) => prev.filter((e) => e.id !== eventId));
			setIsDetailOpen(false);
		} else {
			toast.error(res.error || "Failed to delete event");
		}
		setEvents(events.filter((event) => event.id !== eventId));
		setIsDetailOpen(false);
	};

	const handlePublishEvent = async (eventId: number) => {
		const res = await publishEventAction(eventId);
		if (res.success) {
			toast.success(`Event "${res.event.name}" published`);
			setEvents((prev) =>
				prev.map((e) => (e.id === eventId ? { ...e, state: "PUBLISHED" } : e)),
			);
			setIsDetailOpen(false);
		} else {
			toast.error(res.error || "Failed to publish event");
		}
	};

	const handleEventClick = (event) => {
		setSelectedEvent(event);
		setIsDetailOpen(true);
	};

	const getStateColor = (state: string) => {
		switch (state) {
			case "PUBLISHED":
				return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
			case "DRAFT":
				return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
			case "CANCELLED":
				return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
			case "COMPLETED":
				return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
			default:
				return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
		}
	};

	if (isLoading) {
		return <ComponentLoading message="Loading Events" />;
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
						Events
					</h1>
					<p className="text-gray-600 dark:text-slate-400">
						Manage and organize your events
					</p>
				</div>
				<Button
					onClick={handleCreateEvent}
					className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg"
				>
					<Plus className="h-4 w-4 mr-2" />
					Create Event
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{events.map((event) => (
					<Card
						key={event.id}
						className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
						onClick={() => handleEventClick(event)}
					>
						<div className="relative">
							<Image
								objectFit="cover"
								priority
								width={400}
								height={300}
								src={event.imgSrc || "/placeholder.svg"}
								alt={event.name}
								className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
							<div
								className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStateColor(event.state)}`}
							>
								{event.state}
							</div>
							<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div className="bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full p-2">
									<Eye className="h-4 w-4 text-gray-700 dark:text-slate-200" />
								</div>
							</div>
						</div>
						<CardContent className="p-6">
							<div className="space-y-4">
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-slate-200 mb-2">
										{event.name}
									</h3>
									<p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
										{event.description}
									</p>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
										<MapPin className="h-4 w-4" />
										{event.venue}
									</div>
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
										<Clock className="h-4 w-4" />
										{new Date(event.fromDate).toLocaleDateString()} -{" "}
										{new Date(event.toDate).toLocaleDateString()}
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
										<span className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											{event.participants}/{event.maxTeams}
										</span>
										{(event.flcAmount > 0 || event.nonFlcAmount > 0) && (
											<span className="flex items-center gap-1">
												<DollarSign className="h-4 w-4" />₹{event.flcAmount}/₹
												{event.nonFlcAmount}
											</span>
										)}
									</div>
								</div>

								<div className="flex gap-2">
									<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800">
										{event.eventType}
									</Badge>
									<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800">
										{event.category}
									</Badge>
									{event.isMembersOnly && (
										<Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
											Members Only
										</Badge>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Event Detail Modal */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
					<DialogHeader>
						<DialogTitle className="text-2xl text-gray-900 dark:text-slate-200">
							{selectedEvent?.name}
						</DialogTitle>
					</DialogHeader>
					{selectedEvent && (
						<div className="space-y-6">
							<div className="relative">
								<Image
									width={400}
									height={300}
									src={selectedEvent.imgSrc || "/placeholder.svg"}
									alt={selectedEvent.name}
									className="w-full h-64 object-cover rounded-lg"
								/>
								<div
									className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStateColor(selectedEvent.state)}`}
								>
									{selectedEvent.state}
								</div>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2">
											Event Details
										</h3>
										<p className="text-gray-600 dark:text-slate-400">
											{selectedEvent.description}
										</p>
									</div>

									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4 text-gray-500 dark:text-slate-400" />
											<span className="text-sm text-gray-900 dark:text-slate-200">
												{selectedEvent.venue}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-gray-500 dark:text-slate-400" />
											<span className="text-sm text-gray-900 dark:text-slate-200">
												{new Date(selectedEvent.fromDate).toLocaleString()} -{" "}
												{new Date(selectedEvent.toDate).toLocaleString()}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-gray-500 dark:text-slate-400" />
											<span className="text-sm text-gray-900 dark:text-slate-200">
												Registration Deadline:{" "}
												{new Date(selectedEvent.deadline).toLocaleString()}
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
											Registration Info
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Max Teams:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													{selectedEvent.maxTeams}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Team Size:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													{selectedEvent.minTeamSize} -{" "}
													{selectedEvent.maxTeamSize}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Current Participants:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													{selectedEvent.participants}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Members Only:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													{selectedEvent.isMembersOnly ? "Yes" : "No"}
												</span>
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
											Pricing
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													FLC Members:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													₹{selectedEvent.flcAmount}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Non-FLC:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													₹{selectedEvent.nonFlcAmount}
												</span>
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800">
											{selectedEvent.eventType}
										</Badge>
										<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800">
											{selectedEvent.category}
										</Badge>
									</div>
								</div>
							</div>

							<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
								{selectedEvent.state === "DRAFT" && (
									<Button
										onClick={() => handlePublishEvent(selectedEvent.id)}
										className="bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-800"
									>
										Publish Event
									</Button>
								)}
								<Button
									onClick={() => handleEditEvent(selectedEvent)}
									className="bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800"
								>
									Edit Event
								</Button>
								<Button
									onClick={() => handleDeleteEvent(selectedEvent.id)}
									className="bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-800"
								>
									Delete Event
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
