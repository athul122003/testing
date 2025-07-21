"use server";
import { db } from "~/server/db";

interface CreateTeamInput {
	eventId: number;
	teamName: string;
	leaderId: number;
	memberIds: number[];
	isConfirmed?: boolean;
}

export async function getTeamsForEvent(eventId: number) {
	const teams = await db.team.findMany({
		where: {
			eventId,
		},
		include: {
			Leader: {
				select: {
					id: true,
					name: true,
				},
			},
			Members: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			isConfirmed: "desc", // confirmed teams first
		},
	});

	return teams.map((team) => ({
		id: team.id,
		name: team.name,
		isConfirmed: team.isConfirmed,
		leaderName: team.Leader?.name,
		leaderId: team.Leader?.id,
		members: team.Members.map((member) => ({
			id: member.id,
			name: member.name,
		})),
	}));
}

export async function deleteTeam(teamId: string) {
	await db.team.delete({
		where: { id: teamId },
	});
}

export async function removeMemberFromTeam(teamId: string, userId: number) {
	await db.team.update({
		where: { id: teamId },
		data: {
			Members: {
				disconnect: { id: userId },
			},
		},
	});
}

export async function updateTeamName(teamId: string, newName: string) {
	await db.team.update({
		where: { id: teamId },
		data: {
			name: newName,
		},
	});
}

export async function addMemberToTeam(teamId: string, userId: number) {
	const team = await db.team.findUnique({
		where: { id: teamId },
		include: {
			Members: { select: { id: true, name: true } },
			Event: { select: { id: true, name: true, maxTeamSize: true } },
		},
	});

	if (!team) {
		throw new Error("Team not found");
	}

	// 1. SOLO event check (maxTeamSize === 1)
	if (team.Event?.maxTeamSize === 1) {
		throw new Error(
			`Cannot add members to "${team.Event.name}" because it is a SOLO event.`,
		);
	}

	// 2. Team size check
	if (team.Members.length >= team.Event.maxTeamSize) {
		throw new Error(
			`Team already has the maximum allowed members (${team.Event.maxTeamSize}).`,
		);
	}

	// 3. Check if user exists
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	// 4. Check if user is already in team
	const isAlreadyMember = team.Members.some((m) => m.id === userId);
	if (isAlreadyMember) {
		throw new Error("User is already a member of this team");
	}

	// 5. Add member
	await db.team.update({
		where: { id: teamId },
		data: {
			Members: {
				connect: { id: userId },
			},
		},
	});

	// 6. Fetch updated members
	const updatedTeam = await db.team.findUnique({
		where: { id: teamId },
		include: {
			Members: { select: { id: true, name: true } },
		},
	});

	return updatedTeam?.Members || [];
}

export async function markAttendance(eventId: number, userId: number) {
	const attendance = await db.attendance.upsert({
		where: {
			userId_eventId: {
				userId,
				eventId,
			},
		},
		update: {
			hasAttended: true,
		},
		create: {
			eventId,
			userId,
			hasAttended: true,
		},
	});
	return attendance;
}

export async function markAttendanceByScan(eventId: number, teamId: string) {
	const team = await db.team.findUnique({
		where: { id: teamId, eventId: eventId },
		include: {
			Members: {
				select: {
					id: true,
				},
			},
			Leader: {
				select: {
					id: true,
				},
			},
		},
	});
	if (!team) {
		throw new Error("Team not found");
	}

	const memberIds = team.Members.map((member) => member.id);
	const leaderId = team.Leader?.id;
	const uniqueUserIds = Array.from(new Set([...memberIds, leaderId]));

	const errors: { userId: number; error: string }[] = [];

	await db.team.update({
		where: { id: teamId, eventId: eventId },
		data: {
			hasAttended: true,
		},
	});

	await Promise.all(
		uniqueUserIds.map(async (userId) => {
			const existing = await db.attendance.findUnique({
				where: {
					userId_eventId: {
						userId,
						eventId,
					},
				},
			});
			if (existing?.hasAttended) {
				errors.push({ userId, error: "Attendance already marked" });
				return;
			}
			await db.attendance.upsert({
				where: {
					userId_eventId: {
						userId,
						eventId,
					},
				},
				update: {
					hasAttended: true,
				},
				create: {
					eventId,
					userId,
					hasAttended: true,
				},
			});
		}),
	);

	if (errors.length > 0) {
		throw errors;
	}
}

export async function hasAttended(
	eventId: number,
	userId: number,
): Promise<boolean> {
	const attendance = await db.attendance.findUnique({
		where: {
			userId_eventId: {
				userId,
				eventId,
			},
		},
		select: {
			hasAttended: true,
		},
	});
	return attendance?.hasAttended ?? false;
}
export async function confirmTeam(teamId: string) {
	const team = await db.team.findUnique({
		where: { id: teamId },
		select: { id: true, isConfirmed: true },
	});

	if (!team) {
		throw new Error("Team not found");
	}

	if (team.isConfirmed) {
		return { success: false, message: "Team is already confirmed" };
	}

	const updatedTeam = await db.team.update({
		where: { id: teamId },
		data: { isConfirmed: true },
	});

	return { success: true, data: updatedTeam };
}

export async function createTeam(input: CreateTeamInput) {
	const { eventId, teamName, leaderId, memberIds, isConfirmed = false } = input;

	// Validate event
	const event = await db.event.findUnique({
		where: { id: eventId },
		select: { minTeamSize: true, maxTeamSize: true, name: true },
	});

	if (!event) {
		return { success: false, error: "Event not found" };
	}

	const isSoloEvent = event.minTeamSize === 1 && event.maxTeamSize === 1;

	// --- Solo Event Handling ---
	let finalTeamName = teamName;
	let finalMemberIds = memberIds;

	if (isSoloEvent) {
		// For solo events, team name is optional. Use leader's name if not provided.
		if (!finalTeamName || finalTeamName.trim() === "") {
			const leader = await db.user.findUnique({
				where: { id: leaderId },
				select: { name: true },
			});

			if (!leader) {
				return {
					success: false,
					error: `Members with ID ${leaderId} not found`,
				};
			}

			finalTeamName = leader.name || `SoloTeam_${leaderId}`;
		}

		// Solo event constraint: members must be empty
		if (memberIds.length > 0) {
			return {
				success: false,
				error: `This is a solo event: you cannot add members. Leader ID ${leaderId} will be the only participant.`,
			};
		}

		// Leader must be valid (double-check)
		const leaderExists = await db.user.findUnique({
			where: { id: leaderId },
			select: { id: true },
		});

		if (!leaderExists) {
			return {
				success: false,
				error: `User with ID ${leaderId} does not exist`,
			};
		}

		// Leader is the only member (no extra members to connect)
		finalMemberIds = [];
	}

	const leaderExists = await db.user.findUnique({ where: { id: leaderId } });
	if (!leaderExists) {
		return {
			success: false,
			error: `Leader with ID ${leaderId} does not exist`,
		};
	}

	// Team size constraint
	const totalMembers = 1 + finalMemberIds.length; // Leader + members
	if (!isSoloEvent) {
		if (
			totalMembers <= event.minTeamSize - 1 ||
			totalMembers > event.maxTeamSize
		) {
			return {
				success: false,
				error: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize} (including leader)`,
			};
		}
	}

	// Ensure leader is not leading another team
	const leaderInTeam = await db.team.findFirst({
		where: { eventId, leaderId },
	});
	if (leaderInTeam) {
		return { success: false, error: "Leader already has a team in this event" };
	}

	// Ensure members are valid and not in another team
	if (finalMemberIds.length > 0) {
		// 1. Check which users exist
		const existingUsers = await db.user.findMany({
			where: { id: { in: finalMemberIds } },
			select: { id: true, name: true },
		});

		const existingUserIds = existingUsers.map((u) => u.id);
		const invalidUserIds = finalMemberIds.filter(
			(id) => !existingUserIds.includes(id),
		);

		if (invalidUserIds.length > 0) {
			return {
				success: false,
				error: `The following user IDs are invalid: ${invalidUserIds.join(", ")}`,
			};
		}

		// 2. Check if valid users are already in another team
		const conflictingMembers = await db.team.findMany({
			where: {
				eventId,
				Members: { some: { id: { in: existingUserIds } } },
			},
			select: {
				id: true,
				name: true,
				Members: { select: { id: true, name: true } },
			},
		});

		if (conflictingMembers.length > 0) {
			return {
				success: false,
				error:
					"The following members are already in another team: " +
					conflictingMembers.map((t) => t.name).join(", "),
				conflicts: conflictingMembers,
			};
		}
	}

	// Create team
	const newTeam = await db.team.create({
		data: {
			name: finalTeamName,
			eventId,
			leaderId,
			isConfirmed,
			Members: {
				connect: finalMemberIds.map((id) => ({ id })),
			},
		},
		include: { Leader: true, Members: true },
	});

	const transformedTeam = {
		id: newTeam.id,
		name: newTeam.name,
		isConfirmed: newTeam.isConfirmed,
		leaderName: newTeam.Leader?.name ?? "Unknown",
		members: newTeam.Members.map((m) => ({ id: m.id, name: m.name })),
	};

	return { success: true, data: transformedTeam };
}

export const getRegisteredEventCount = async (
	userId: number,
): Promise<number> => {
	const teams = await db.team.findMany({
		where: {
			OR: [{ leaderId: userId }, { Members: { some: { id: userId } } }],
			isConfirmed: true,
		},
		select: {
			eventId: true,
		},
	});

	const uniqueEventIds = new Set(teams.map((team) => team.eventId));
	return uniqueEventIds.size;
};
