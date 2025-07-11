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
				isConfirmed: true,
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

export async function createTeam(userId: number, eventId: number) {
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

		if (event.maxTeamSize === 1) {
			return {
				success: false,
				error: "Event is not a team event",
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

export async function joinTeam(userId: number, teamId: string) {
	try {
		// Check if team exists
		const team = await db.team.findUnique({
			where: { id: teamId },
			include: {
				Members: true,
				Event: true,
			},
		});

		if (!team) {
			return {
				success: false,
				error: "Team not found",
			};
		}

		const event = team.Event;
		const maxSize = event.maxTeamSize;

		// Check if user is already in this team
		if (team.Members.some((member) => member.id === userId)) {
			return {
				success: false,
				error: "User is already a member of this team",
			};
		}

		// Check if team is full
		const totalMembers = team.Members.length + 1; // +1 for leader
		if (totalMembers >= maxSize) {
			return {
				success: false,
				error: "Team is already full",
			};
		}

		// Check if user is already in any team for this event
		const userAlreadyInEvent = await db.team.findFirst({
			where: {
				eventId: team.eventId,
				OR: [{ leaderId: userId }, { Members: { some: { id: userId } } }],
			},
		});

		if (userAlreadyInEvent) {
			return {
				success: false,
				error: "User is already part of a team in this event",
			};
		}

		// Add user to Members
		await db.team.update({
			where: { id: teamId },
			data: {
				Members: {
					connect: { id: userId },
				},
			},
		});

		return {
			success: true,
			message: "User successfully joined the team",
		};
	} catch (error) {
		console.error("joinTeam Error:", error);
		return {
			success: false,
			error: "Failed to join team",
		};
	}
}

export async function confirmTeam(userId: number, teamId: string) {
	try {
		// Fetch team with members and event details
		const team = await db.team.findUnique({
			where: { id: teamId },
			include: {
				Members: true,
				Event: true,
			},
		});

		if (!team) {
			return {
				success: false,
				error: "Team not found",
			};
		}

		if (team.leaderId !== userId) {
			return {
				success: false,
				error: "Only the team leader can confirm the team",
			};
		}

		if (team.isConfirmed) {
			return {
				success: false,
				error: "Team is already confirmed",
			};
		}

		// Total size includes leader
		const totalSize = 1 + team.Members.length;
		const { minTeamSize, maxTeamSize } = team.Event;

		if (totalSize < minTeamSize || totalSize > maxTeamSize) {
			return {
				success: false,
				error: `Team must have between ${minTeamSize} and ${maxTeamSize} members including the leader. Currently has ${totalSize}.`,
			};
		}

		// Confirm the team
		await db.team.update({
			where: { id: teamId },
			data: {
				isConfirmed: true,
			},
		});

		return {
			success: true,
			message: "Team confirmed successfully",
		};
	} catch (error) {
		console.error("confirmTeam Error:", error);
		return {
			success: false,
			error: "Failed to confirm team",
		};
	}
}

export async function deleteTeam(userId: number, teamId: string) {
	try {
		// Fetch the team to verify leadership
		const team = await db.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return {
				success: false,
				error: "Team not found",
			};
		}

		if (team.leaderId !== userId) {
			return {
				success: false,
				error: "Only the team leader can delete the team",
			};
		}

		// Optional: prevent deleting a confirmed team
		if (team.isConfirmed) {
			return {
				success: false,
				error: "Cannot delete a confirmed team",
			};
		}

		// Delete the team
		await db.team.delete({
			where: { id: teamId },
		});

		return {
			success: true,
			message: "Team deleted successfully",
		};
	} catch (error) {
		console.error("deleteTeam Error:", error);
		return {
			success: false,
			error: "Failed to delete team",
		};
	}
}
