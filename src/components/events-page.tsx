"use client";

import { Calendar, DollarSign, Plus, Upload, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
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

export function EventsPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [paymentRequired, setPaymentRequired] = useState(false);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Events</h1>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Create Event
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Create New Event</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="title">Event Title</Label>
									<Input id="title" placeholder="Enter event title" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="date">Date & Time</Label>
									<Input id="date" type="datetime-local" />
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									placeholder="Event description"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="team-size">Team Size</Label>
									<Input
										id="team-size"
										type="number"
										placeholder="Max participants"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="event-type">Event Type</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="individual">Individual</SelectItem>
											<SelectItem value="team">Team</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id="payment"
									checked={paymentRequired}
									onCheckedChange={setPaymentRequired}
								/>
								<Label htmlFor="payment">Payment Required</Label>
							</div>

							{paymentRequired && (
								<div className="space-y-2">
									<Label htmlFor="amount">Payment Amount</Label>
									<Input id="amount" type="number" placeholder="Enter amount" />
								</div>
							)}

							<div className="space-y-2">
								<Label>Event Image</Label>
								<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
									<Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
									<p className="text-sm text-gray-500">
										Click to upload or drag and drop
									</p>
								</div>
							</div>

							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setIsCreateOpen(false)}
								>
									Cancel
								</Button>
								<Button onClick={() => setIsCreateOpen(false)}>
									Create Event
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							Tech Conference 2024
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-2">
							Jan 15, 2024 • 10:00 AM
						</p>
						<p className="text-sm mb-2">
							Annual technology conference featuring latest trends
						</p>
						<div className="flex items-center gap-4 text-sm">
							<span className="flex items-center gap-1">
								<Users className="h-3 w-3" />
								50/100
							</span>
							<span className="flex items-center gap-1">
								<DollarSign className="h-3 w-3" />
								$99
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
