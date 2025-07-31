"use server";

import { db } from "../server/db";
import type { EventParticipant } from "../lib/certificate-types";

export async function getEventParticipants(eventId: number): Promise<{
	success: boolean;
	data?: EventParticipant[];
	error?: string;
}> {
	try {
		const teams = await db.team.findMany({
			where: {
				eventId: eventId,
				isConfirmed: true,
			},
			include: {
				Members: {
					include: {
						Attendance: true,
					},
				},
				Leader: {
					select: {
						usn: true,
						name: true,
						email: true,
						id: true,
					},
				},
				Prize: {
					select: {
						prizeType: true,
					},
				},
			},
		});

		const participants: EventParticipant[] = [];

		for (const team of teams) {
			const leaderId = team.leaderId;

			// Add team members
			for (const member of team.Members) {
				const attendance = member.Attendance.find(
					(att) => att.eventId === eventId,
				);
				if (!attendance || !attendance.hasAttended) continue;
				participants.push({
					id: member.id,
					usn: member.usn,
					name: member.name,
					email: member.email,
					teamName: team.name,
					prizeType: team.Prize?.prizeType,
					isTeamLeader: member.id === leaderId,
				});
			}
		}

		return {
			success: true,
			data: participants,
		};
	} catch (error) {
		console.error("Error fetching event participants:", error);
		return {
			success: false,
			error: "Failed to fetch event participants",
		};
	}
}
