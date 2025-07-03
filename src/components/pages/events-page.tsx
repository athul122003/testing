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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	deleteEventAction,
	editEventAction,
	getAllEvents,
	publishEventAction,
} from "~/lib/actions/event";

interface EventsPageProps {
	setActivePage: (page: string) => void;
	// biome-ignore lint/suspicious/noExplicitAny: FIX THIS LATER
	setEditingEvent: (event: any) => void;
}

export function EventsPage({
	setActivePage,
	setEditingEvent,
}: EventsPageProps) {
	const [events, setEvents] = useState<any[]>([]);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	useEffect(() => {
		async function fetchEvents() {
			// setLoading(true);
			const res = await getAllEvents();
			if (res.success) {
				setEvents(res.data);
			} else {
				console.error("Failed to load events:", res.error);
			}
			// setLoading(false);
		}

		fetchEvents();
	}, []);

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

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
						Events
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Manage and organize your events
					</p>
				</div>
				<Button
					onClick={handleCreateEvent}
					className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
				>
					<Plus className="h-4 w-4 mr-2" />
					Create Event
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{events.map((event) => (
					<Card
						key={event.id}
						className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
						onClick={() => handleEventClick(event)}
					>
						<div className="relative">
							<Image
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
								<div className="bg-white/90 dark:bg-slate-800/90 rounded-full p-2">
									<Eye className="h-4 w-4" />
								</div>
							</div>
						</div>
						<CardContent className="p-6">
							<div className="space-y-4">
								<div>
									<h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
										{event.name}
									</h3>
									<p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
										{event.description}
									</p>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
										<MapPin className="h-4 w-4" />
										{event.venue}
									</div>
									<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
										<Clock className="h-4 w-4" />
										{new Date(event.fromDate).toLocaleDateString()} -{" "}
										{new Date(event.toDate).toLocaleDateString()}
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4 text-sm">
										<span className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											{event.participants}/{event.maxTeams}
										</span>
										{(event.flcAmount > 0 || event.nonFlcAmount > 0) && (
											<span className="flex items-center gap-1">
												<DollarSign className="h-4 w-4" />${event.flcAmount}/$
												{event.nonFlcAmount}
											</span>
										)}
									</div>
								</div>

								<div className="flex gap-2">
									<Badge variant="secondary">{event.eventType}</Badge>
									<Badge variant="outline">{event.category}</Badge>
									{event.isMembersOnly && (
										<Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
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
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white dark:bg-slate-900 dark:text-white">
					<DialogHeader>
						<DialogTitle className="text-2xl text-white">
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
										<h3 className="text-lg font-semibold text-white mb-2">
											Event Details
										</h3>
										<p className="text-slate-300">
											{selectedEvent.description}
										</p>
									</div>

									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4 text-slate-400" />
											<span className="text-sm text-slate-200">
												{selectedEvent.venue}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-slate-400" />
											<span className="text-sm text-slate-200">
												{new Date(selectedEvent.fromDate).toLocaleString()} -{" "}
												{new Date(selectedEvent.toDate).toLocaleString()}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-slate-400" />
											<span className="text-sm text-slate-200">
												Registration Deadline:{" "}
												{new Date(selectedEvent.deadline).toLocaleString()}
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-white mb-3">
											Registration Info
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-sm text-slate-300">
													Max Teams:
												</span>
												<span className="text-sm font-medium text-white">
													{selectedEvent.maxTeams}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-slate-300">
													Team Size:
												</span>
												<span className="text-sm font-medium text-white">
													{selectedEvent.minTeamSize} -{" "}
													{selectedEvent.maxTeamSize}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-slate-300">
													Current Participants:
												</span>
												<span className="text-sm font-medium text-white">
													{selectedEvent.participants}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-slate-300">
													Members Only:
												</span>
												<span className="text-sm font-medium text-white">
													{selectedEvent.isMembersOnly ? "Yes" : "No"}
												</span>
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-lg font-semibold text-white mb-3">
											Pricing
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-sm text-slate-300">
													FLC Members:
												</span>
												<span className="text-sm font-medium text-white">
													${selectedEvent.flcAmount}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-slate-300">Non-FLC:</span>
												<span className="text-sm font-medium text-white">
													${selectedEvent.nonFlcAmount}
												</span>
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<Badge variant="secondary">{selectedEvent.eventType}</Badge>
										<Badge variant="primary">{selectedEvent.category}</Badge>
									</div>
								</div>
							</div>

							<div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
								{selectedEvent.state === "DRAFT" && (
									<Button
										onClick={() => handlePublishEvent(selectedEvent.id)}
										className="bg-green-600 hover:bg-green-700 text-white"
									>
										Publish Event
									</Button>
								)}
								<Button
									variant="secondary"
									onClick={() => handleEditEvent(selectedEvent)}
								>
									Edit Event
								</Button>
								<Button
									variant="destructive"
									onClick={() => handleDeleteEvent(selectedEvent.id)}
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
