"use client";

import { ArrowLeft, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

const eventTypes = ["SOLO", "TEAM"];
const eventCategories = ["WORKSHOP", "COMPETITION", "HACKATHON", "SPECIAL"];
const eventStates = ["DRAFT", "PUBLISHED", "LIVE", "COMPLETED"];

import { toast } from "sonner";
import { createEventAction, editEventAction } from "~/lib/actions/event";
import type {
	EventCategory,
	EventState,
	EventType,
} from "../../../generated/prisma";

interface EventFormProps {
	setActivePage: (page: string) => void;
	// biome-ignore lint/suspicious/noExplicitAny: DEFINE TYPE
	editingEvent: any;
	// biome-ignore lint/suspicious/noExplicitAny: DEFINE TYPE AGAIN
	setEditingEvent: (event: any) => void;
}

export function EventForm({
	setActivePage,
	editingEvent,
	setEditingEvent,
}: EventFormProps) {
	const [formData, setFormData] = useState({
		name: "",
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
				description: editingEvent.description || "",
				venue: editingEvent.venue || "",
				eventType: editingEvent.eventType || "WORKSHOP",
				category: editingEvent.category || "TECHNICAL",
				fromDate: editingEvent.fromDate?.slice(0, 16) || "",
				toDate: editingEvent.toDate?.slice(0, 16) || "",
				deadline: editingEvent.deadline?.slice(0, 16) || "",
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
			setActivePage("events-page");
		} else {
			toast.error(result.error || "Failed to save event");
			console.log(result.issues);
		}
	};

	const handleCancel = () => {
		setActivePage("events");
		setEditingEvent(null);
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-4">
				<Button variant="ghost" onClick={handleCancel} className="p-2">
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-4xl font-bold text-slate-900 dark:text-white">
						{editingEvent ? "Edit Event" : "Create New Event"}
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						{editingEvent
							? "Update event details"
							: "Fill in the details to create a new event"}
					</p>
				</div>
			</div>

			<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
				<CardHeader>
					<CardTitle className="text-xl text-slate-900 dark:text-white">
						Event Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-2 gap-6">
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

					<div className="grid grid-cols-3 gap-4">
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

					<div className="grid grid-cols-3 gap-4">
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

					<div className="grid grid-cols-3 gap-4">
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

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="flcAmount">FLC Member Amount ($)</Label>
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
							<Label htmlFor="nonFlcAmount">Non-FLC Amount ($)</Label>
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
						<Label>Event Image</Label>
						<div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer">
							<Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
							<p className="text-slate-600 dark:text-slate-400">
								Click to upload or drag and drop
							</p>
							<p className="text-sm text-slate-500 dark:text-slate-500">
								PNG, JPG up to 10MB
							</p>
						</div>
					</div>

					<div className="flex justify-end space-x-3 pt-6 border-t">
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
