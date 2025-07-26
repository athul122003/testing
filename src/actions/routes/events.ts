"use server";
import { db } from "~/server/db";
import { protectedAction } from "~/actions/middleware/protectedAction";

export async function getAllEvents() {
	try {
		const events = await db.event.findMany({
			where: {
				OR: [{ state: "PUBLISHED" }, { state: "LIVE" }, { state: "COMPLETED" }],
			},
			orderBy: { fromDate: "desc" },
			include: {
				Organiser: {
					include: {
						User: {
							select: {
								id: true,
								name: true,
								email: true,
								phone: true,
							},
						},
					},
				},
			},
		});

		const filteredEvents = events.map((event) => ({
			...event,
			Organiser: Array.isArray(event.Organiser)
				? event.Organiser.map((org) => ({
						name: org.User?.name ?? null,
						email: org.User?.email ?? null,
						phone: org.User?.phone ?? null,
						eventId: org.eventId,
					}))
				: [],
		}));

		return {
			success: true,
			data: filteredEvents,
		};
	} catch (error) {
		console.error("getAllEvents Error:", error);
		return {
			success: false,
			error: "Failed to fetch published events.",
		};
	}
}

async function registerConfirmSoloEvent(userId: number, eventId: number) {
	try {
		const userInfo = await db.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true },
		});

		if (!userInfo) {
			return {
				success: false,
				error: "User not found",
			};
		}

		const team = await db.team.create({
			data: {
				name: userInfo.name,
				isConfirmed: true,
				eventId,
				leaderId: userId,
				Members: {
					connect: [],
				},
			},
		});

		return {
			success: true,
			data: { teamId: team.id },
		};
	} catch (error) {
		console.error("registerUserToSoloEvent Error:", error);
		return {
			success: false,
			error: "Failed to register user to solo event.",
		};
	}
}

async function registerSoloEvent(userId: number, eventId: number) {
	if (!userId || !eventId) {
		return {
			success: false,
			error: "Missing userId or eventId",
		};
	}
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true, roleId: true },
	});
	if (!user) {
		return {
			success: false,
			error: "User not found",
		};
	}

	const team = await db.team.create({
		data: {
			name: user.name,
			eventId,
			leaderId: userId,
			Members: {
				connect: [],
			},
		},
	});
	if (!team) {
		return {
			success: false,
			error: "Failed to create team",
		};
	}
	return {
		success: true,
		data: { teamId: team.id },
	};
}

export async function soloEventReg(userId: number, eventId: number) {
	if (!userId || !eventId) {
		return {
			success: false,
			error: "Missing userId or eventId",
		};
	}
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
	const countOfTeams = await db.team.count({
		where: {
			eventId,
			isConfirmed: true,
		},
	});
	if (countOfTeams >= event.maxTeams) {
		return {
			success: false,
			error: "Maximum number of teams reached for this event",
		};
	}
	if (event.deadline && new Date() > event.deadline) {
		return {
			success: false,
			error: "Registration for this event has closed",
		};
	}
	if (event.isMembersOnly) {
		const userInfo = await db.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, roleId: true },
		});
		if (!userInfo || userInfo.roleId !== "MEMBER") {
			return {
				success: false,
				error: "Only FLC members can register for this event",
			};
		}
	}
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

	if (event.nonFlcAmount > 0 || event.flcAmount > 0) {
		return registerSoloEvent(userId, eventId);
	} else {
		return registerConfirmSoloEvent(userId, eventId);
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
		isConfirmed: team.isConfirmed,
		teamId: team.id,
	};
}

export async function createTeam(
	userId: number,
	eventId: number,
	teamName: string,
) {
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

		const memberRole = await db.role.findUnique({
			where: { name: "MEMBER" },
			select: { id: true },
		});
		if (!memberRole) {
			return {
				success: false,
				error: "Member role not found",
			};
		}

		const countOfTeams = await db.team.count({
			where: {
				eventId,
				isConfirmed: true,
			},
		});
		if (countOfTeams >= event.maxTeams) {
			return {
				success: false,
				error: "Maximum number of teams reached for this event",
			};
		}

		const userInfo = await db.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, roleId: true },
		});
		if (!userInfo) {
			return {
				success: false,
				error: "User not found",
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

		if (event.isMembersOnly && userInfo.roleId !== memberRole.id) {
			return {
				success: false,
				error: "Only FLC members can create a team for this event",
			};
		}

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

		const existingTeamName = await db.team.findFirst({
			where: {
				eventId,
				name: teamName,
			},
		});

		if (existingTeamName) {
			return {
				success: false,
				error: "Team with this name already exists for this event",
			};
		}

		// Create the team
		const team = await db.team.create({
			data: {
				name: teamName,
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
		console.error("createTeam Error:", error);
		return {
			success: false,
			error: "Failed to create Team.",
		};
	}
}

export async function joinTeam(
	userId: number,
	teamId: string,
	eventId: number,
) {
	try {
		// Check if team exists
		const team = await db.team.findUnique({
			where: { id: teamId },
			include: {
				Members: true,
				Event: true,
			},
		});
		const memberRole = await db.role.findUnique({
			where: { name: "MEMBER" },
			select: { id: true },
		});
		if (!memberRole) {
			return {
				success: false,
				error: "Member role not found",
			};
		}
		const userInfo = await db.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, roleId: true },
		});
		if (!userInfo) {
			return {
				success: false,
				error: "User not found",
			};
		}
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

		if (team.eventId !== eventId) {
			return {
				success: false,
				error: "Team not found for this event",
			};
		}

		const event = team.Event;
		const maxSize = event.maxTeamSize;

		if (event.isMembersOnly && userInfo.roleId !== memberRole.id) {
			return {
				success: false,
				error: "Only FLC members can join this team",
			};
		}

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
			teamName: team.name,
			teamId: team.id,
			isConfirmed: team.isConfirmed,
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

		const memberRole = await db.role.findUnique({
			where: { name: "MEMBER" },
			select: { id: true },
		});
		if (!memberRole) {
			return {
				success: false,
				error: "Member role not found",
			};
		}
		if (team.Event.isMembersOnly) {
			const userInfo = await db.user.findUnique({
				where: { id: userId },
				select: { id: true, name: true, roleId: true },
			});
			if (!userInfo || userInfo.roleId !== memberRole.id) {
				return {
					success: false,
					error: "Only FLC members can confirm the team for this event",
				};
			}
			const nonFlcMembers = team.Members.filter(
				(member) => member.roleId !== memberRole.id,
			);

			if (nonFlcMembers.length > 0) {
				return {
					success: false,
					error: "All team members must be FLC members for this event.",
				};
			}
		}
		if (team.Event.nonFlcAmount > 0 || team.Event.flcAmount > 0) {
			const hasPaid = await db.payment.findFirst({
				where: {
					Team: { id: teamId },
					paymentType: "EVENT",
				},
			});
			if (!hasPaid) {
				return {
					success: false,
					error: "Payment is required to confirm the team.",
				};
			}
		}

		if (team.Event.deadline && new Date() > team.Event.deadline) {
			return {
				success: false,
				error: "Registration for this event has closed",
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

export async function checkMaxTeamsReached(eventId: number) {
	try {
		const event = await db.event.findUnique({
			where: { id: eventId },
		});
		if (!event) {
			return {
				success: false,
				error: "Event not found",
			};
		}
		const teamCount = await db.team.count({
			where: {
				AND: [{ eventId: event.id }, { isConfirmed: true }],
			},
		});
		if (teamCount >= event.maxTeams) {
			return {
				success: false,
				error: "Maximum number of teams reached for this event",
			};
		}
		return {
			success: true,
			message: "Max teams not reached",
		};
	} catch (error) {
		console.error("checkMaxTeamsReached Error:", error);
		return {
			success: false,
			error: "Failed to check max teams",
		};
	}
}

export async function leaveTeam(userId: number, teamId: string) {
	try {
		const team = await db.team.findUnique({
			where: { id: teamId },
			include: {
				Members: true,
				Leader: true,
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
				error: "Team leader cannot leave the team",
			};
		}
		if (!team.Members.some((member) => member.id === userId)) {
			return {
				success: false,
				error: "User is not a member of this team",
			};
		}
		await db.team.update({
			where: { id: teamId },
			data: {
				Members: {
					disconnect: { id: userId },
				},
			},
		});
		return {
			success: true,
			message: "User successfully left the team",
		};
	} catch (error) {
		console.error("leaveTeam Error:", error);
		return {
			success: false,
			error: "Failed to leave team",
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

// GET ORGANISERS
export const getOrganisers = protectedAction(
	async (_session, eventId: number) => {
		const organisers = await db.organiser.findMany({
			where: { eventId },
			include: {
				User: {
					select: { id: true, name: true, email: true, usn: true },
				},
			},
		});
		return {
			success: true,
			data: organisers.map((o) => o.User),
		};
	},
	{ actionName: "event.organiser.getAll" },
);

// ADD ORGANISERS
export const addOrganisers = protectedAction(
	async (_session, input: { eventId: number; userIds: number[] }) => {
		try {
			await db.organiser.createMany({
				data: input.userIds.map((userId) => ({
					eventId: input.eventId,
					userId,
				})),
				skipDuplicates: true,
			});
			return { success: true };
		} catch (error) {
			console.error("Failed to add organisers:", error);
			return {
				success: false,
				error: "Failed to add organisers. Please try again.",
			};
		}
	},
	{ actionName: "event.organiser.add" },
);

// REMOVE ORGANISER
export const removeOrganiser = protectedAction(
	async (_session, input: { eventId: number; userId: number }) => {
		await db.organiser.deleteMany({
			where: {
				eventId: input.eventId,
				userId: input.userId,
			},
		});
		return { success: true };
	},
	{ actionName: "event.organiser.remove" },
);
