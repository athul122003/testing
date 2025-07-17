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
