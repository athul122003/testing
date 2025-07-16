"use server";
import { db } from "~/server/db";

export async function getPublishedEvents() {
	try {
		const events = await db.event.findMany({
			where: {
				OR: [{ state: "PUBLISHED" }, { state: "LIVE" }, { state: "LIVE" }],
			},
			orderBy: { fromDate: "desc" },
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

		if (event.deadline && new Date() > event.deadline) {
			return {
				success: false,
				error: "Registration for this event has closed",
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

export async function checkSolo(userId: number, eventId: number) {
	const team = await db.team.findFirst({
		where: {
			eventId,
			OR: [{ Members: { some: { id: userId } } }, { leaderId: userId }],
			Event: {
				maxTeamSize: 1,
			},
		},
		include: {
			Members: {
				select: { id: true, name: true },
			},
		},
	});

	if (!team) {
		return {
			success: false,
			error: "Not registered for this solo event.",
		};
	}

	return {
		success: true,
	};
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

		if (event.deadline && new Date() > event.deadline) {
			return {
				success: false,
				error: "Registration for this event has closed",
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
			data: {
				teamId: team.id,
			},
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

		if (team.leaderId === userId) {
			return {
				success: false,
				error: "User is already the leader of this team",
			};
		}

		if (team.isConfirmed) {
			return {
				success: false,
				error: "Cannot join a confirmed team",
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
		const updatedTeam = await db.team.findUnique({
			where: { id: teamId },
			include: {
				Members: {
					select: { id: true, name: true },
				},
				Leader: {
					select: { id: true, name: true },
				},
			},
		});

		return {
			success: true,
			message: "User successfully joined the team",
			members: updatedTeam
				? [
						{
							id: updatedTeam.Leader.id,
							name: updatedTeam.Leader.name,
						},
						...updatedTeam.Members.map((m) => ({
							id: m.id,
							name: m.name,
						})),
					]
				: [],
		};
	} catch (error) {
		console.error("joinTeam Error:", error);
		return {
			success: false,
			error: "Failed to join team",
		};
	}
}

export async function getTeam(userId: number, eventId: number) {
	const teams = await db.team.findMany({
		where: {
			eventId: eventId,
			OR: [{ Members: { some: { id: userId } } }, { leaderId: userId }],
		},
		include: {
			Members: {
				select: { id: true, name: true },
			},
			Leader: {
				select: { id: true, name: true },
			},
		},
	});

	if (!teams || teams.length === 0) {
		return {
			success: false,
			error: "User is not part of any team for this event.",
		};
	}

	const team = teams[0];

	return {
		success: true,
		data: {
			teamId: team.id,
			isLeader: team.leaderId === userId,
			members: [
				{
					id: team.Leader.id,
					name: team.Leader.name,
				},
				...team.Members.map((m) => ({
					id: m.id,
					name: m.name,
				})),
			],
		},
	};
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

		// TODO [RAHUL]: IF FLC MEMBERS ONLY, CHECK IF ALL MEMBERS ARE FLC MEMBERS
		// TODO [RAHUL]: IF PAID EVENT, CHECK IF PAYMENT IS DONE

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
