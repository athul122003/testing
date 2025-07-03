"use server";

import { z } from "zod";
import { db } from "~/server/db"; // Uncomment if you need Prisma types
import {
	EventCategory,
	EventType,
	EventState,
} from "../../../generated/prisma";

const createEventSchema = z.object({
	name: z.string().min(1, "Event name is required"),
	slug: z.string().optional(),
	imgSrc: z.string().optional(),
	description: z.string().optional(),
	venue: z.string().optional(),

	eventType: z.nativeEnum(EventType), // ✅ Enums here
	category: z.nativeEnum(EventCategory),
	state: z.nativeEnum(EventState).optional().default(EventState.DRAFT),

	fromDate: z.string().min(1, "From date is required"),
	toDate: z.string().min(1, "To date is required"),
	deadline: z.string().optional(),

	maxTeams: z.number().nonnegative(),
	minTeamSize: z.number().min(1),
	maxTeamSize: z.number().min(1),

	isMembersOnly: z.boolean(),
	flcAmount: z.number().nonnegative(),
	nonFlcAmount: z.number().nonnegative(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export async function createEventAction(values: CreateEventInput) {
	try {
		const validated = createEventSchema.parse(values);

		const event = await db.event.create({
			data: {
				name: validated.name,
				slug: validated.slug ?? undefined,
				imgSrc: validated.imgSrc,
				description: validated.description,
				venue: validated.venue,
				eventType: validated.eventType, // ✅ now type-safe
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
