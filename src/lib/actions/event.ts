"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { createEventZ } from "~/zod/eventZ";
import {
	EventCategory,
	EventState,
	EventType,
} from "../../../generated/prisma";

export type CreateEventInput = z.infer<typeof createEventZ>;

export async function createEventAction(values: CreateEventInput) {
	try {
		const validated = createEventZ.parse(values);

		const event = await db.event.create({
			data: {
				name: validated.name,
				slug: validated.slug ?? undefined,
				imgSrc: validated.imgSrc,
				description: validated.description,
				venue: validated.venue,
				eventType: validated.eventType,
				category: validated.category,
				state: validated.state ?? EventState.DRAFT,
				fromDate: new Date(validated.fromDate),
				toDate: new Date(validated.toDate),
				deadline: validated.deadline ? new Date(validated.deadline) : undefined,
				maxTeams: validated.maxTeams,
				minTeamSize: validated.minTeamSize,
				maxTeamSize: validated.maxTeamSize,
				isMembersOnly: validated.isMembersOnly,
				flcAmount: validated.flcAmount,
				nonFlcAmount: validated.nonFlcAmount,
			},
		});

		return { success: true, event };
	} catch (error) {
		console.error("createEventAction Error:", error);
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Validation failed",
				issues: error.issues,
			};
		}
		return {
			success: false,
			error: "An unexpected error occurred while creating event.",
		};
	}
}

export async function editEventAction(
	eventId: number,
	values: CreateEventInput,
) {
	try {
		const validated = createEventZ.parse(values);

		const updated = await db.event.update({
			where: { id: eventId },
			data: {
				name: validated.name,
				slug: validated.slug ?? undefined,
				imgSrc: validated.imgSrc,
				description: validated.description,
				venue: validated.venue,
				eventType: validated.eventType,
				category: validated.category,
				state: validated.state ?? EventState.DRAFT,
				fromDate: new Date(validated.fromDate),
				toDate: new Date(validated.toDate),
				deadline: validated.deadline ? new Date(validated.deadline) : undefined,
				maxTeams: validated.maxTeams,
				minTeamSize: validated.minTeamSize,
				maxTeamSize: validated.maxTeamSize,
				isMembersOnly: validated.isMembersOnly,
				flcAmount: validated.flcAmount,
				nonFlcAmount: validated.nonFlcAmount,
			},
		});

		return { success: true, event: updated };
	} catch (error) {
		console.error("editEventAction Error:", error);
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Validation failed",
				issues: error.issues,
			};
		}
		return {
			success: false,
			error: "An unexpected error occurred while updating the event.",
		};
	}
}

export async function publishEventAction(eventId: number) {
	try {
		const event = await db.event.update({
			where: { id: eventId },
			data: { state: EventState.PUBLISHED },
		});

		return { success: true, event };
	} catch (error) {
		console.error("publishEventAction Error:", error);
		return {
			success: false,
			error: "Failed to publish event.",
		};
	}
}

export async function getAllEvents() {
	try {
		const events = await db.event.findMany({
			orderBy: { fromDate: "asc" },
		});

		return {
			success: true,
			data: events,
		};
	} catch (error) {
		console.error("getAllEvents Error:", error);
		return {
			success: false,
			error: "Failed to fetch events.",
		};
	}
}

export async function deleteEventAction(eventId: number) {
	try {
		const deleted = await db.event.delete({
			where: { id: eventId },
		});

		return {
			success: true,
			event: deleted,
		};
	} catch (error) {
		console.error("deleteEventAction Error:", error);
		return {
			success: false,
			error: "Failed to delete event. It may not exist.",
		};
	}
}
