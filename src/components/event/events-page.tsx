"use client";

import {
	Calendar,
	Clock,
	DollarSign,
	Eye,
	IndianRupee,
	MapPin,
	Plus,
	Users,
} from "lucide-react";
import Image from "next/image";
import { permissionKeys as perm } from "~/actions/middleware/routePermissions";
import { useEffect, useState } from "react";
import { ExtendedEvent, toggleEventStatus } from "~/actions/event";
import { toast } from "sonner";
import { deleteEventAction, publishEventAction } from "~/actions/event";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useDashboardData } from "~/providers/dashboardDataContext";
import { ComponentLoading } from "../ui/component-loading";
import { PrizeType } from "@prisma/client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { AccessDenied } from "../othercomps/access-denied";
import { HTMLContent } from "~/components/ui/html-content";

interface EventsPageProps {
	setActivePage: (page: string) => void;
	setEditingEvent: (event: any) => void;
}

export function EventsPage({
	setActivePage,
	setEditingEvent,
}: EventsPageProps) {
	const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(
		null,
	);
	const [allYears, setAllYears] = useState<string[]>([]);
	const [selectedYear, setSelectedYear] = useState("2025");
	const [statusModalOpen, setStatusModalOpen] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const { hasPerm, eventsQuery, refetchEvents, isOrganiser, setEventYear } =
		useDashboardData();
	const canManageEvents = hasPerm(perm.MANAGE_EVENTS);
	const { data: eventsData, isLoading } = eventsQuery;

	const events = eventsData?.data || [];

	useEffect(() => {
		if (eventsData?.success === true && Array.isArray(eventsData.years)) {
			setAllYears(
				new Set(eventsData.years).size > 0
					? ["ALL", ...eventsData.years.map((year: number) => year.toString())]
					: ["All"],
			);
		} else {
			setAllYears(["2025"]);
		}
	}, [eventsData]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need of deps>
	useEffect(() => {
		if (selectedYear === "ALL") {
			setEventYear(null);
		} else {
			setEventYear(Number(selectedYear));
		}
	}, [selectedYear]);

	const handleCreateEvent = () => {
		setEditingEvent(null);
		setActivePage("event-form");
	};

	const handleToggleEventStatus = async (eventId: number) => {
		console.log("Toggling event status for ID:", eventId);
		if (selectedEvent === null) return;
		const res = await toggleEventStatus(eventId);
		toast.success(`Event status updated to ${res.event?.state}`);
		setSelectedEvent((prev) => {
			if (!prev || !res.event?.state) return prev;
			return {
				...prev,
				state: res.event.state,
			};
		});
		if (refetchEvents) {
			refetchEvents();
		}
		setStatusModalOpen(false);
	};

	const handleEditEvent = (event: ExtendedEvent) => {
		const eventForForm = {
			...event,
			fromDate: event.fromDate.toISOString().slice(0, 16), // for datetime-local input
			toDate: event.toDate.toISOString().slice(0, 16),
			deadline: event.deadline ? event.deadline.toISOString().slice(0, 16) : "",
			prizes: Object.values(PrizeType).map((type) => ({
				prizeType: type,
				flcPoints:
					event?.prizes?.find((p) => p.prizeType === type)?.flcPoints || 0,
			})),
		};
		setEditingEvent(eventForForm);
		setActivePage("event-form");
		setIsDetailOpen(false);
	};

	const handleDeleteEvent = async (eventId: number) => {
		const res = await deleteEventAction(eventId);
		if (res.success) {
			toast.success("Event deleted successfully.");
			setIsDetailOpen(false);
			if (refetchEvents) {
				refetchEvents();
			}
		} else {
			toast.error(res.error || "Failed to delete event");
		}
		setIsDetailOpen(false);
	};

	const handlePublishEvent = async (eventId: number) => {
		const res = await publishEventAction(eventId);
		if (res.success) {
			toast.success(`Event "${res?.event?.name}" published`);
			if (refetchEvents) {
				refetchEvents();
			}
			setIsDetailOpen(false);
		} else {
			toast.error(res.error || "Failed to publish event");
		}
	};

	const handleEventClick = (event: ExtendedEvent) => {
		setSelectedEvent(event);
		setIsDetailOpen(true);
	};

	const handleViewParticipants = (event: ExtendedEvent) => {
		setEditingEvent(event);
		setActivePage("event-participants");
		setIsDetailOpen(false);
	};

	const handleAttendance = (event: ExtendedEvent) => {
		setEditingEvent(event);
		setActivePage("event-attendance");
		setIsDetailOpen(false);
	};

	const handleManageDocuments = (event: ExtendedEvent) => {
		setEditingEvent(event);
		setActivePage("event-documents");
		setIsDetailOpen(false);
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
	if (!canManageEvents && !isOrganiser) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh]">
				<AccessDenied />
				<p className="text-gray-500 dark:text-slate-400 text-center max-w-xs">
					You do not have permission to manage events.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return <ComponentLoading message="Loading Events" />;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-200">
						Events
					</h1>
					<p className="text-sm md:text-base text-gray-600 dark:text-slate-400">
						Manage and organize your events
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex items-center gap-3">
						<Select
							value={selectedYear.toString()}
							onValueChange={(value) =>
								setSelectedYear(value === "ALL" ? "ALL" : value)
							}
						>
							<SelectTrigger className="w-32 border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200">
								<SelectValue placeholder="Year" />
							</SelectTrigger>
							<SelectContent>
								{allYears.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button
						onClick={handleCreateEvent}
						className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create Event
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
								width={530}
								height={635}
								src={event.imgSrc || "/placeholder.svg"}
								alt={event.name}
								className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
							<div
								className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStateColor(
									event.state,
								)}`}
							>
								{event.state}
							</div>
							<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div className="bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full p-2">
									<Eye className="h-4 w-4 text-gray-700 dark:text-slate-200" />
								</div>
							</div>
						</div>
						<CardContent className="p-4 sm:p-6">
							<div className="space-y-4">
								<div>
									<h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-200 mb-2">
										{event.name}
									</h3>
									<div className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
										<HTMLContent
											content={event.description || ""}
											className="prose-sm"
										/>
									</div>
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
											{event.confirmedTeams}/{event.maxTeams}
										</span>
										{(event.flcAmount > 0 || event.nonFlcAmount > 0) && (
											<span className="flex items-center gap-1">
												<IndianRupee className="h-4 w-4" />₹{event.flcAmount}/₹
												{event.nonFlcAmount}
											</span>
										)}
									</div>
								</div>

								<div className="flex gap-2 flex-wrap">
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

			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
					<DialogHeader>
						<DialogTitle className="text-xl sm:text-2xl text-gray-900 dark:text-slate-200">
							{selectedEvent?.name}
						</DialogTitle>
					</DialogHeader>
					{selectedEvent && (
						<div className="space-y-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
								<div className="relative">
									<Image
										width={530}
										height={635}
										src={selectedEvent.imgSrc || "/placeholder.svg"}
										alt={selectedEvent.name}
										className="w-full aspect-square object-cover rounded-lg"
									/>
									<div
										className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStateColor(
											selectedEvent.state,
										)}`}
									>
										{selectedEvent.state}
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2">
											Event Details
										</h3>
										<div className="text-gray-600 dark:text-slate-400">
											<HTMLContent
												content={selectedEvent.description || ""}
												className=""
											/>
										</div>
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
												{selectedEvent?.deadline
													? new Date(selectedEvent.deadline).toLocaleString()
													: "N/A"}
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
										Registration Info
									</h3>
									<div className="space-y-2">
										{[
											["Max Teams", selectedEvent.maxTeams],
											[
												"Team Size",
												`${selectedEvent.minTeamSize} - ${selectedEvent.maxTeamSize}`,
											],
											["Confirmed Teams", selectedEvent.confirmedTeams],
											[
												"Members Only",
												selectedEvent.isMembersOnly ? "Yes" : "No",
											],
										].map(([label, value], i) => (
											<div
												className="flex justify-between"
												key={`${i}-${label}`}
											>
												<span className="text-sm text-gray-600 dark:text-slate-400">
													{label}:
												</span>
												<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
													{value}
												</span>
											</div>
										))}
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
								{selectedEvent.prizes && selectedEvent.prizes.length > 0 && (
									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
											FLC Points Allocation
										</h3>
										<div className="space-y-2">
											{selectedEvent.prizes.map((prize) => (
												<div key={prize.id} className="flex justify-between">
													<span className="text-sm text-gray-600 dark:text-slate-400">
														{prize.prizeType}
													</span>
													<span className="text-sm font-medium text-gray-900 dark:text-slate-200">
														{prize.flcPoints} pts
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								<div className="flex gap-2 flex-wrap">
									<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800">
										{selectedEvent.eventType}
									</Badge>
									<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800">
										{selectedEvent.category}
									</Badge>
								</div>
							</div>

							<div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
								<div className="flex flex-row justify-end gap-3">
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
								<div className="flex flex-row justify-end gap-3">
									<Button
										type="button"
										onClick={() => handleManageDocuments(selectedEvent)}
										className="bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800"
									>
										Manage Documents
									</Button>
									{selectedEvent.state !== "COMPLETED" ? (
										<Button
											type="button"
											onClick={() => setStatusModalOpen(true)}
											className="bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800"
										>
											{selectedEvent.state === "DRAFT"
												? "Publish Event"
												: selectedEvent.state === "PUBLISHED"
													? "Mark as Live"
													: selectedEvent.state === "LIVE"
														? "Mark as Completed"
														: null}
										</Button>
									) : (
										<div>
											<p className="text-green-700 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
												Event is Completed
											</p>
										</div>
									)}
									<Button
										type="button"
										onClick={() => handleViewParticipants(selectedEvent)}
										className="bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800"
									>
										View Participants
									</Button>
									{(selectedEvent.state === "LIVE" ||
										selectedEvent.state === "PUBLISHED") && (
										<Button
											onClick={() => handleAttendance(selectedEvent)}
											className="bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-800"
										>
											Mark Attendance
										</Button>
									)}
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{statusModalOpen && (
				<Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
					<DialogContent className="max-w-sm">
						<DialogHeader>
							<DialogTitle className="text-lg font-semibold text-gray-900 dark:text-slate-200">
								{selectedEvent?.state === "DRAFT"
									? "Mark Event as Published"
									: selectedEvent?.state === "PUBLISHED"
										? "Mark Event as Live"
										: selectedEvent?.state === "LIVE"
											? "Mark Event as Completed"
											: null}
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<p className="text-gray-600 dark:text-slate-400">
								Are you sure you want to toggle the status of this event?
							</p>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setStatusModalOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={() => {
										if (selectedEvent && typeof selectedEvent.id === "number") {
											handleToggleEventStatus(selectedEvent.id);
										}
									}}
								>
									{selectedEvent?.state === "DRAFT"
										? "Publish Event"
										: selectedEvent?.state === "PUBLISHED"
											? "Mark as Live"
											: selectedEvent?.state === "LIVE"
												? "Mark as Completed"
												: null}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
