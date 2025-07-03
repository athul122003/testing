import { z } from "zod";
import { EventType, EventState, EventCategory } from "../../generated/prisma";

const createEventZ = z.object({
	name: z.string().min(1, "Event name is required"),
	slug: z.string().optional(), // Optional slug
	imgSrc: z.string().optional(), // Optional image

	description: z.string().optional(),
	venue: z.string().optional(),

	eventType: z.nativeEnum(EventType),
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

const deleteEventZ = z.object({
	eventId: z.number(),
});

const setEventStateZ = z.object({
	eventId: z.number(),
	state: z.nativeEnum(EventState),
});

const getEventByIdZ = z.object({
	eventId: z.number(),
});

const getEventByStateZ = z.object({
	state: z.nativeEnum(EventState),
});

export {
	createEventZ,
	deleteEventZ,
	setEventStateZ,
	getEventByIdZ,
	getEventByStateZ,
};
