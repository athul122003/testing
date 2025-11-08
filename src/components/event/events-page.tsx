"use client";

import {
	Activity,
	Calendar,
	Clock,
	DollarSign,
	Download,
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
	const [deleteEventModal, setDeleteEventModal] = useState(false);
	const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
	const [deletionLoading, setDeletionLoading] = useState(false);
	const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
	const [allYears, setAllYears] = useState<string[]>([]);
	const [selectedYear, setSelectedYear] = useState("2025");
	const [statusModalOpen, setStatusModalOpen] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const {
		hasPerm,
		eventsQuery,
		refetchEvents,
		isOrganiser,
		setEventYear,
		refetchUsers,
	} = useDashboardData();
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

	const handleToggleEventStatus = async (
		eventId: number,
		enableStrikeAdditionOnCompletion?: boolean,
	) => {
		console.log("Toggling event status for ID:", eventId);
		if (selectedEvent === null) return;
		const res = await toggleEventStatus(
			eventId,
			enableStrikeAdditionOnCompletion,
		);
		if (enableStrikeAdditionOnCompletion) {
			refetchUsers?.();
		}
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
		try {
			setDeletionLoading(true);
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
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: typeof error === "string"
						? error
						: "Failed to delete event",
			);
			console.error("Delete event error:", error);
		} finally {
			setDeletionLoading(false);
			setDeleteEventId(null);
			setIsDetailOpen(false);
		}
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
	const handleAssignWinner = (event: ExtendedEvent) => {
		setEditingEvent(event);
		setActivePage("event-winner");
		setIsDetailOpen(false);
	};

	const handleAttendance = (event: ExtendedEvent) => {
		setEditingEvent(event);
		setActivePage("event-attendance");
		setIsDetailOpen(false);
	};

	const handleManageDocuments = (event: any) => {
		console.log("Managing documents for event:", event);
		setEditingEvent(event);
		setActivePage("event-documents");
		setIsDetailOpen(false);
	};

	const handleGenerateReport = (event: ExtendedEvent) => {
		setEditingEvent(event);
		setActivePage("event-final-report");
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
				<DialogContent className="w-[95vw] max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200 p-4 sm:p-6">
					<DialogHeader className="pb-4">
						<DialogTitle className="text-lg sm:text-xl md:text-2xl text-gray-900 dark:text-slate-200 break-words">
							{selectedEvent?.name}
						</DialogTitle>
					</DialogHeader>
					{selectedEvent && (
						<div className="space-y-4 sm:space-y-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
								<div className="relative order-1 lg:order-1">
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

								<div className="space-y-4 order-2 lg:order-2">
									<div>
										<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2">
											Event Details
										</h3>
										<div className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
											<HTMLContent
												content={selectedEvent.description || ""}
												className=""
											/>
										</div>
									</div>

									<div className="space-y-2 sm:space-y-3">
										<div className="flex items-start gap-2">
											<MapPin className="h-4 w-4 text-gray-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
											<span className="text-xs sm:text-sm text-gray-900 dark:text-slate-200 break-words">
												{selectedEvent.venue}
											</span>
										</div>
										<div className="flex items-start gap-2">
											<Calendar className="h-4 w-4 text-gray-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
											<span className="text-xs sm:text-sm text-gray-900 dark:text-slate-200 break-words">
												{new Date(selectedEvent.fromDate).toLocaleString()} -{" "}
												{new Date(selectedEvent.toDate).toLocaleString()}
											</span>
										</div>
										<div className="flex items-start gap-2">
											<Clock className="h-4 w-4 text-gray-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
											<span className="text-xs sm:text-sm text-gray-900 dark:text-slate-200 break-words">
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
									<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
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
												className="flex justify-between text-xs sm:text-sm"
												key={`${i}-${label}`}
											>
												<span className="text-gray-600 dark:text-slate-400">
													{label}:
												</span>
												<span className="font-medium text-gray-900 dark:text-slate-200">
													{value}
												</span>
											</div>
										))}
									</div>
								</div>

								<div>
									<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
										Pricing
									</h3>
									<div className="space-y-2">
										<div className="flex justify-between text-xs sm:text-sm">
											<span className="text-gray-600 dark:text-slate-400">
												FLC Members:
											</span>
											<span className="font-medium text-gray-900 dark:text-slate-200">
												₹{selectedEvent.flcAmount}
											</span>
										</div>
										<div className="flex justify-between text-xs sm:text-sm">
											<span className="text-gray-600 dark:text-slate-400">
												Non-FLC:
											</span>
											<span className="font-medium text-gray-900 dark:text-slate-200">
												₹{selectedEvent.nonFlcAmount}
											</span>
										</div>
									</div>
								</div>
								{selectedEvent.prizes && selectedEvent.prizes.length > 0 && (
									<div>
										<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">
											FLC Points Allocation
										</h3>
										<div className="space-y-2">
											{selectedEvent.prizes.map((prize) => (
												<div
													key={prize.id}
													className="flex justify-between text-xs sm:text-sm"
												>
													<span className="text-gray-600 dark:text-slate-400">
														{prize.prizeType}
													</span>
													<span className="font-medium text-gray-900 dark:text-slate-200">
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
								<div className="flex flex-col sm:flex-col lg:flex-row justify-end gap-2 sm:gap-3">
									<Button
										onClick={() => handleEditEvent(selectedEvent)}
										className="w-full sm:w-auto bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800 text-sm py-2"
									>
										Edit Event
									</Button>

									<Button
										type="button"
										onClick={() => handleManageDocuments(selectedEvent)}
										className="w-full sm:w-auto bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800 text-sm py-2"
									>
										Manage Documents
									</Button>
									{selectedEvent.state === "LIVE" && (
										<Button
											type="button"
											onClick={() => handleAssignWinner(selectedEvent)}
											className="w-full sm:w-auto bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-800 text-sm py-2"
										>
											Assign Winners
										</Button>
									)}
									{selectedEvent.state !== "COMPLETED" ? (
										<Button
											type="button"
											onClick={() => setStatusModalOpen(true)}
											className="w-full sm:w-auto bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800 text-sm py-2"
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
										<div className="flex flex-col sm:flex-row items-center gap-2">
											<p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-full text-center">
												Event is Completed
											</p>
											<Button
												type="button"
												onClick={() => handleGenerateReport(selectedEvent)}
												className="w-full sm:w-auto bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-800 text-sm py-2"
											>
												Generate Final Report
											</Button>
										</div>
									)}
								</div>

								<div className="flex flex-col sm:flex-col lg:flex-row justify-end gap-2 sm:gap-3">
									<Button
										type="button"
										onClick={() => handleViewParticipants(selectedEvent)}
										className="w-full sm:w-auto bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-300 dark:border-slate-800 text-sm py-2"
									>
										View Participants
									</Button>
									{(selectedEvent.state === "LIVE" ||
										selectedEvent.state === "PUBLISHED") && (
										<Button
											onClick={() => handleAttendance(selectedEvent)}
											className="w-full sm:w-auto bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-800 text-sm py-2"
										>
											Mark Attendance
										</Button>
									)}
									<Button
										onClick={() => {
											setDeleteEventId(selectedEvent.id);
											setDeleteEventModal(true);
										}}
										className="w-full sm:w-auto bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-800 text-sm py-2"
									>
										Delete Event
									</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{deleteEventModal && (
				<Dialog open={deleteEventModal} onOpenChange={setDeleteEventModal}>
					<DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
						<DialogHeader className="pb-4">
							<DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200">
								Delete Event
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
								Are you sure you want to delete this event? This action cannot
								be undone.
							</p>

							<div className="space-y-2">
								<div className="text-sm font-medium text-gray-900 dark:text-slate-200">
									Event to delete:
								</div>
								<div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-md border border-gray-300 dark:border-slate-700">
									<p className="text-sm font-medium text-gray-900 dark:text-slate-200 select-none break-words">
										{selectedEvent?.name} (ID: {selectedEvent?.id})
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="delete-confirmation"
									className="text-sm font-medium text-gray-900 dark:text-slate-200 block"
								>
									Type exactly as above to confirm deletion:
								</label>
								<input
									id="delete-confirmation"
									type="text"
									value={deleteConfirmationText}
									onChange={(e) => setDeleteConfirmationText(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
									placeholder="Enter event name and ID"
								/>
							</div>

							<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										setDeleteEventModal(false);
										setDeleteConfirmationText("");
									}}
									className="w-full sm:w-auto order-2 sm:order-1 text-sm py-2"
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									disabled={
										deletionLoading ||
										deleteConfirmationText !==
											`${selectedEvent?.name} (ID: ${selectedEvent?.id})`
									}
									onClick={() => {
										if (deleteEventId !== null) {
											handleDeleteEvent(deleteEventId);
										}
										setDeleteEventModal(false);
										setDeleteConfirmationText("");
									}}
									className="w-full sm:w-auto order-1 sm:order-2 text-sm py-2"
								>
									{deletionLoading ? "Deleting..." : "Confirm Deletion"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{statusModalOpen && (
				<Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
					<DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
						<DialogHeader className="pb-4">
							<DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 break-words">
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
							<p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
								Are you sure you want to toggle the status of this event?
							</p>
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div className="min-w-0 flex-1">
									<div className="font-medium text-gray-900 dark:text-slate-200">
										Enable strike addition for participants
									</div>
									<p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 whitespace-normal break-words">
										When enabled, finishing this event will add a strike to
										absentee participants (More than 3 strikes will revoke
										membership)
									</p>
								</div>

								{(() => {
									const disabled = !(selectedEvent?.state === "LIVE");

									return (
										<button
											type="button"
											role="switch"
											aria-checked={
												selectedEvent?.enableStrikeAdditionOnCompletion
											}
											disabled={disabled}
											onClick={() => {
												if (disabled || !selectedEvent) return;
												const newVal =
													!selectedEvent.enableStrikeAdditionOnCompletion;
												setSelectedEvent((prev) => {
													if (!prev) return prev;
													return {
														...prev,
														enableStrikeAdditionOnCompletion: newVal,
													};
												});
											}}
											className={`shrink-0 relative w-12 h-7 p-0 rounded-full flex items-center justify-start ${
												disabled
													? "opacity-50 cursor-not-allowed"
													: "cursor-pointer"
											} ${selectedEvent?.enableStrikeAdditionOnCompletion ? "bg-emerald-500" : "bg-gray-200 dark:bg-slate-800"}`}
										>
											<span className="sr-only">Enable strike addition</span>
											<span
												aria-hidden
												className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ml-1 ${
													selectedEvent?.enableStrikeAdditionOnCompletion
														? "translate-x-5"
														: "translate-x-0"
												}`}
											/>
										</button>
									);
								})()}
							</div>
							<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
								<Button
									variant="outline"
									onClick={() => setStatusModalOpen(false)}
									className="w-full sm:w-auto order-2 sm:order-1 text-sm py-2"
								>
									Cancel
								</Button>
								<Button
									onClick={() => {
										if (selectedEvent && typeof selectedEvent.id === "number") {
											handleToggleEventStatus(
												selectedEvent.id,
												selectedEvent.enableStrikeAdditionOnCompletion,
											);
										}
									}}
									className="w-full sm:w-auto order-1 sm:order-2 text-sm py-2"
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
