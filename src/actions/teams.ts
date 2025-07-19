"use server";
import { db } from "~/server/db";

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
