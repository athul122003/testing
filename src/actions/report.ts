"use server";

import { protectedAction } from "~/actions/middleware/protectedAction";
import { db } from "~/server/db";

export const getEventReportData = protectedAction(
	async (eventId: number) => {
		try {
			const teams = await db.team.findMany({
				where: {
					eventId,
					hasAttended: true,
				},
				include: {
					Leader: {
						select: {
							id: true,
							name: true,
							email: true,
							usn: true,
						},
					},
					Members: {
						select: {
							id: true,
							name: true,
							email: true,
							usn: true,
							Attendance: {
								where: {
									eventId,
								},
								select: {
									hasAttended: true,
								},
							},
						},
					},
					Prize: {
						select: {
							prizeType: true,
							flcPoints: true,
						},
					},
				},
			});

			const reportData = teams.map((team) => {
				const members = team.Members.map((member) => ({
					id: member.id,
					name: member.name,
					email: member.email,
					usn: member.usn,
					hasAttended:
						member.Attendance.length > 0
							? member.Attendance[0].hasAttended
							: false,
					isLeader: member.id === team.Leader?.id,
				}));

				return {
					id: team.id,
					name: team.name,
					leader: team.Leader
						? {
								id: team.Leader.id,
								name: team.Leader.name,
								email: team.Leader.email,
								usn: team.Leader.usn,
							}
						: null,
					members,
					prizeType: team.Prize?.prizeType || "PARTICIPATION",
					flcPoints: team.Prize?.flcPoints || 0,
				};
			});

			return {
				success: true,
				data: reportData,
			};
		} catch (error) {
			console.error("Error fetching event report data:", error);
			return {
				success: false,
				error: "Failed to fetch event report data",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);
