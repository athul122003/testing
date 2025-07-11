"use server";
import { db } from "~/server/db";

export async function getPublishedEvents() {
	try {
		const events = await db.event.findMany({
			where: { state: "PUBLISHED" },
			orderBy: { fromDate: "asc" },
		});

		return {
			success: true,
			data: events,
		};
	} catch (error) {
		console.error("getPublishedEvents Error:", error);
		return {
			success: false,
			error: "Failed to fetch published events.",
		};
	}
}

export async function registerUserToSoloEvent(userId: number, eventId: number) {
	try {
		// Check if the event exists and is a solo event
		const event = await db.event.findUnique({
			where: { id: eventId },
		});

		if (!event) {
			return {
				success: false,
				error: "Event not found",
			};
		}

		if (event.maxTeamSize !== 1) {
			return {
				success: false,
				error: "Event is not a solo event",
			};
		}

		// Check if the user already has a team for this event
		const existingTeam = await db.team.findFirst({
			where: {
				eventId,
				leaderId: userId,
			},
		});

		if (existingTeam) {
			return {
				success: false,
				error: "User is already registered for this event",
			};
		}

		// Create the team
		const team = await db.team.create({
			data: {
				name: `Team-${userId}-${Date.now()}`,
				eventId,
				leaderId: userId,
				Members: {
					connect: [], // No members in solo
				},
			},
		});

		return {
			success: true,
			data: team,
		};
	} catch (error) {
		console.error("registerUserToSoloEvent Error:", error);
		return {
			success: false,
			error: "Failed to register user to solo event.",
		};
	}
}
