"use client";

import { ArrowLeft, Save, Upload } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/lib/api";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { permissionKeys as perm } from "~/actions/middleware/routePermissions";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

const eventTypes = ["SOLO", "TEAM"];
const eventCategories = ["WORKSHOP", "COMPETITION", "HACKATHON", "SPECIAL"];
const eventStates = ["DRAFT", "PUBLISHED", "LIVE", "COMPLETED"];

import type { EventCategory, EventState, EventType } from "@prisma/client";
import Image from "next/image";
import { toast } from "sonner";
import { createEventAction, editEventAction } from "~/actions/event";
import { uploadImageToCloudinary } from "~/lib/cloudinaryImageUploader";
import { useDashboardData } from "~/providers/dashboardDataContext";

interface EventFormProps {
	setActivePage: (page: string) => void;
	// biome-ignore lint/suspicious/noExplicitAny: DEFINE TYPE
	editingEvent: any;
	// biome-ignore lint/suspicious/noExplicitAny: DEFINE TYPE AGAIN
	setEditingEvent: (event: any) => void;
}

function toDatetimeLocalString(dateInput: Date | string | undefined): string {
	if (!dateInput) return "";
	const date = new Date(dateInput);

	// Offset the date into local time (reverse the UTC shift)
	const tzOffset = date.getTimezoneOffset() * 60000;
	const localDate = new Date(date.getTime() - tzOffset);

	const year = localDate.getFullYear();
	const month = String(localDate.getMonth() + 1).padStart(2, "0");
	const day = String(localDate.getDate()).padStart(2, "0");
	const hours = String(localDate.getHours()).padStart(2, "0");
	const minutes = String(localDate.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function EventForm({
	setActivePage,
	editingEvent,
	setEditingEvent,
}: EventFormProps) {
	const { refetchEvents, hasPerm } = useDashboardData();
	const [formData, setFormData] = useState({
		name: "",
		imgSrc: "",
		description: "",
		venue: "",
		eventType: "WORKSHOP" as EventType,
		category: "TECHNICAL" as EventCategory,
		fromDate: "",
		toDate: "",
		deadline: "",
		maxTeams: "",
		minTeamSize: "1",
		maxTeamSize: "1",
		isMembersOnly: false,
		flcAmount: "",
		nonFlcAmount: "",
		state: "DRAFT" as EventState,
	});

	useEffect(() => {
		if (editingEvent) {
			setFormData({
				name: editingEvent.name || "",
				imgSrc: editingEvent.imgSrc || "",
				description: editingEvent.description || "",
				venue: editingEvent.venue || "",
				eventType: editingEvent.eventType || "WORKSHOP",
				category: editingEvent.category || "TECHNICAL",
				fromDate: toDatetimeLocalString(editingEvent.fromDate),
				toDate: toDatetimeLocalString(editingEvent.toDate),
				deadline: toDatetimeLocalString(editingEvent.deadline),
				maxTeams: editingEvent.maxTeams?.toString() || "",
				minTeamSize: editingEvent.minTeamSize?.toString() || "1",
				maxTeamSize: editingEvent.maxTeamSize?.toString() || "1",
				isMembersOnly: editingEvent.isMembersOnly || false,
				flcAmount: editingEvent.flcAmount?.toString() || "",
				nonFlcAmount: editingEvent.nonFlcAmount?.toString() || "",
				state: editingEvent.state || "DRAFT",
			});
		}
	}, [editingEvent]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		const start = new Date(formData.fromDate);
		const end = new Date(formData.toDate);
		const deadline = new Date(formData.deadline);

		if (start > end) {
			toast.error("From date must be before To date.");
			return;
		}
		if (deadline > start || deadline > end) {
			toast.error("Deadline must be before event dates.");
			return;
		}
		if (formData.eventType === "SOLO") {
			if (
				Number(formData.minTeamSize) > 1 ||
				Number(formData.maxTeamSize) > 1
			) {
				toast.error("SOLO events must have team size = 1");
				return;
			}
		}
		if (parseInt(formData.nonFlcAmount) > 0 && formData.isMembersOnly) {
			toast.error("Non-FLC amount cannot be set for members-only events.");
			return;
		}
		if (Number(formData.maxTeams) === 0) {
			toast.error("Max teams must be at least 1.");
			return;
		}
		if (Number(formData.minTeamSize) < 1 || Number(formData.maxTeamSize) < 1) {
			toast.error("Team sizes must be at least 1.");
			return;
		}
		if (Number(formData.minTeamSize) > Number(formData.maxTeamSize)) {
			toast.error(
				"Minimum team size cannot be greater than maximum team size.",
			);
			return;
		}

		const payload = {
			...formData,
			maxTeams: Number(formData.maxTeams),
			minTeamSize: Number(formData.minTeamSize),
			maxTeamSize: Number(formData.maxTeamSize),
			flcAmount: Number(formData.flcAmount),
			nonFlcAmount: Number(formData.nonFlcAmount),
		};

		const result = editingEvent?.id
			? await editEventAction(editingEvent.id, payload)
			: await createEventAction(payload);

		if (result.success) {
			toast.success(editingEvent ? "Event updated" : "Event created");
			setEditingEvent(null);
			refetchEvents?.();
			setActivePage("events");
		} else {
			toast.error(result.error || "Failed to save event");
			console.log(result.issues);
		}
	};

	const handleCancel = () => {
		setActivePage("events");
		setEditingEvent(null);
	};

	const [uploading, setUploading] = useState(false);

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
				<Button variant="ghost" onClick={handleCancel} className="p-2">
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
						{editingEvent ? "Edit Event" : "Create New Event"}
					</h1>
					<p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
						{editingEvent
							? "Update event details"
							: "Fill in the details to create a new event"}
					</p>
				</div>
			</div>
			{hasPerm(perm.MANAGE_EVENTS) && editingEvent.id && (
				<AddOrganisersSection eventId={editingEvent.id} />
			)}
			<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
				<CardHeader>
					<CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">
						Event Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label htmlFor="name">Event Name *</Label>
							<Input
								id="name"
								placeholder="Enter event name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="venue">Venue *</Label>
							<Input
								id="venue"
								placeholder="Event venue"
								value={formData.venue}
								onChange={(e) =>
									setFormData({ ...formData, venue: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							placeholder="Event description"
							rows={4}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Event Type</Label>
							<Select
								value={formData.eventType}
								onValueChange={(value) =>
									setFormData({ ...formData, eventType: value as EventType })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{eventTypes.map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Category</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData({ ...formData, category: value as EventCategory })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{eventCategories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={formData.state}
								onValueChange={(value) =>
									setFormData({ ...formData, state: value as EventState })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{eventStates.map((state) => (
										<SelectItem key={state} value={state}>
											{state}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="fromDate">From Date & Time *</Label>
							<Input
								id="fromDate"
								type="datetime-local"
								value={formData.fromDate}
								onChange={(e) =>
									setFormData({ ...formData, fromDate: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="toDate">To Date & Time *</Label>
							<Input
								id="toDate"
								type="datetime-local"
								value={formData.toDate}
								onChange={(e) =>
									setFormData({ ...formData, toDate: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="deadline">Registration Deadline</Label>
							<Input
								id="deadline"
								type="datetime-local"
								value={formData.deadline}
								onChange={(e) =>
									setFormData({ ...formData, deadline: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="maxTeams">Max Teams</Label>
							<Input
								id="maxTeams"
								type="number"
								placeholder="Maximum teams"
								value={formData.maxTeams}
								onChange={(e) =>
									setFormData({ ...formData, maxTeams: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="minTeamSize">Min Team Size</Label>
							<Input
								id="minTeamSize"
								type="number"
								value={formData.minTeamSize}
								onChange={(e) =>
									setFormData({ ...formData, minTeamSize: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="maxTeamSize">Max Team Size</Label>
							<Input
								id="maxTeamSize"
								type="number"
								value={formData.maxTeamSize}
								onChange={(e) =>
									setFormData({ ...formData, maxTeamSize: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="membersOnly"
							checked={formData.isMembersOnly}
							onCheckedChange={(checked) =>
								setFormData({ ...formData, isMembersOnly: checked })
							}
						/>
						<Label htmlFor="membersOnly">Members Only Event</Label>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="flcAmount">FLC Member Amount in rs</Label>
							<Input
								id="flcAmount"
								type="number"
								placeholder="Amount for FLC members"
								value={formData.flcAmount}
								onChange={(e) =>
									setFormData({ ...formData, flcAmount: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="nonFlcAmount">Non-FLC Amount in rs</Label>
							<Input
								id="nonFlcAmount"
								type="number"
								placeholder="Amount for non-FLC members"
								value={formData.nonFlcAmount}
								onChange={(e) =>
									setFormData({ ...formData, nonFlcAmount: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="imgUpload">Event Image</Label>
						<button
							type="button"
							className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer"
							onClick={() => document.getElementById("imgUpload")?.click()}
							onDragOver={(e) => e.preventDefault()}
							onDrop={async (e) => {
								e.preventDefault();
								const file = e.dataTransfer.files?.[0];
								if (!file) return;

								if (file.size > 1024 * 1024) {
									toast.error("Image size must be less than 1MB.");
									return;
								}

								setUploading(true);
								try {
									const url = await uploadImageToCloudinary(file);
									setFormData((prev) => ({ ...prev, imgSrc: url }));
									toast.success("Image uploaded successfully!");
								} catch (err) {
									console.error(err);
									toast.error("Image upload failed.");
								} finally {
									setUploading(false);
								}
							}}
						>
							{uploading ? (
								<div className="flex flex-col items-center justify-center">
									<svg
										className="animate-spin h-8 w-8 text-slate-400 mb-2"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<title>Loading spinner</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8v8z"
										></path>
									</svg>
									<p className="text-slate-600 dark:text-slate-400">
										Uploading...
									</p>
								</div>
							) : formData.imgSrc ? (
								<Image
									width={250}
									height={315}
									src={formData.imgSrc}
									alt="Uploaded preview"
									className="mx-auto object-cover rounded-lg"
								/>
							) : (
								<>
									<Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
									<p className="text-slate-600 dark:text-slate-400">
										Click to upload or drag and drop
									</p>
									<p className="text-sm text-slate-500 dark:text-slate-500">
										PNG, JPG up to 1MB
									</p>
								</>
							)}
						</button>
						<input
							id="imgUpload"
							type="file"
							accept="image/*"
							className="hidden"
							onChange={async (e) => {
								const file = e.target.files?.[0];
								if (!file) return;

								if (file.size > 1024 * 1024) {
									toast.error("Image size must be less than 1MB.");
									return;
								}

								setUploading(true);
								try {
									const url = await uploadImageToCloudinary(file);
									setFormData((prev) => ({ ...prev, imgSrc: url }));
									toast.success("Image uploaded successfully!");
								} catch (err) {
									console.error(err);
									toast.error("Image upload failed.");
								} finally {
									setUploading(false);
								}
							}}
						/>
					</div>

					<div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
						<Button variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
						>
							<Save className="h-4 w-4 mr-2" />
							{editingEvent ? "Update Event" : "Create Event"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

type User = {
	id: number;
	name: string;
	email: string;
	usn: string;
};

export function AddOrganisersSection({ eventId }: { eventId: number }) {
	const [usn, setUsn] = useState("");
	const [searchResult, setSearchResult] = useState<User | null>(null);
	const [errorMsg, setErrorMsg] = useState("");
	const [loading, setLoading] = useState(false);
	const [existingOrganisers, setExistingOrganisers] = useState<User[]>([]);

	// 🔄 Load organisers
	const fetchOrganisers = useCallback(async () => {
		const res = await api.event.getOrganisers(eventId);
		if (res.success) {
			setExistingOrganisers(res.data || []);
		} else {
			toast.error("Failed to load organisers.");
		}
	}, [eventId]);

	useEffect(() => {
		fetchOrganisers();
	}, [fetchOrganisers]);

	// 🔍 Search by USN
	const handleSearch = async () => {
		setLoading(true);
		setErrorMsg("");
		setSearchResult(null);

		const res = await api.user.searchUserByUsn({
			usn: usn.trim().toLowerCase(),
		});

		if (!res.success || !res.data) {
			setErrorMsg("User not found");
		} else if (existingOrganisers.some((org) => org.id === res.data.id)) {
			setErrorMsg("User is already an organiser");
		} else {
			setSearchResult(res.data);
		}

		setLoading(false);
	};

	// ➕ Add organiser
	const handleAddOrganiser = async () => {
		if (!searchResult) return;

		const res = await api.event.addOrganisers({
			eventId,
			userIds: [searchResult.id],
		});

		if (res.success) {
			toast.success("Organiser added successfully");
			setSearchResult(null);
			setUsn("");
			fetchOrganisers();
		} else {
			toast.error(res.error || "Failed to add organiser");
		}
	};

	// ❌ Remove organiser
	const handleRemoveOrganiser = async (userId: number) => {
		const res = await api.event.removeOrganiser({ eventId, userId });

		if (res.success) {
			toast.success("Organiser removed");
			fetchOrganisers();
		} else {
			toast.error("Failed to remove organiser");
		}
	};

	return (
		<div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 mt-4">
			<p className="text-base font-semibold">Event Organisers</p>

			{existingOrganisers.length > 0 ? (
				<ul className="space-y-1">
					{existingOrganisers.map((org) => (
						<li key={org.id} className="flex justify-between items-center">
							<span>
								{org.name} ({org.email}) - <strong>{org.usn}</strong>
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleRemoveOrganiser(org.id)}
							>
								<Trash2 className="w-4 h-4 text-red-500" />
							</Button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground italic text-xs">
					No organisers added yet.
				</p>
			)}

			<hr className="my-4" />

			<p className="text-base font-semibold">Add Organiser by USN</p>
			<div className="flex gap-2">
				<Input
					value={usn}
					onChange={(e) => setUsn(e.target.value)}
					placeholder="Enter USN"
				/>
				<Button onClick={handleSearch} disabled={loading}>
					{loading ? "Searching..." : "Search"}
				</Button>
			</div>

			{errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}

			{searchResult && (
				<div className="mt-2 border p-3 rounded-md bg-muted">
					<p>
						<strong>Name:</strong> {searchResult.name}
					</p>
					<p>
						<strong>Email:</strong> {searchResult.email}
					</p>
					<p>
						<strong>USN:</strong> {searchResult.usn}
					</p>
					<Button className="mt-3" onClick={handleAddOrganiser}>
						Add as Organiser
					</Button>
				</div>
			)}
		</div>
	);
}
