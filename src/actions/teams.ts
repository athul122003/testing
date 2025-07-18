"use server";

import { db } from "~/server/db";

export async function getTeamsForEvent(eventId: number) {
	const teams = await db.team.findMany({
		where: {
			eventId,
		},
		include: {
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
		},
	});

	if (!team) {
		throw new Error("Team not found");
	}

	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	const isAlreadyMember = team.Members.some((m) => m.id === userId);
	if (isAlreadyMember) {
		throw new Error("User is already a member of this team");
	}

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
			Members: { select: { id: true, name: true } },
		},
	});

	return updatedTeam?.Members || [];
}
