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
		members: team.Members.map((member) => member.name),
	}));
}
