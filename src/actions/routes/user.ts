"use server";

import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "~/server/db";
import { protectedAction } from "~/actions/middleware/protectedAction";

// --- Zod Schemas ---
const searchSchema = z.object({
	query: z.string().optional(),
	page: z.number().min(1),
	limit: z.number().min(1),
	sortBy: z.string().default("role"),
	sortOrder: z.enum(["asc", "desc"]),
	role: z.string().optional(),
	bannedOnly: z.boolean().optional(),
});

const updateRoleSchema = z.object({
	userId: z.number(),
	roleName: z.string(),
});

const addUserLinkSchema = z.object({
	userId: z.number(),
	linkName: z.string().min(1),
	url: z.string().url(),
});

// --- Protected Actions ---

export const searchUser = protectedAction(
	async (input: {
		query: string;
		page: number;
		limit: number;
		sortBy: string;
		sortOrder: "asc" | "desc";
		role?: string;
		bannedOnly?: boolean;
	}) => {
		const { query, page, limit, sortBy, sortOrder, role, bannedOnly } =
			searchSchema.parse(input);

		const skip = (page - 1) * limit;

		const baseConditions: Prisma.UserWhereInput[] = [];

		if (query?.trim()) {
			baseConditions.push({
				OR: [
					{ name: { contains: query, mode: "insensitive" } },
					{ email: { contains: query, mode: "insensitive" } },
					{ usn: { contains: query, mode: "insensitive" } },
					!Number.isNaN(Number(query)) ? { id: Number(query) } : undefined,
				].filter(Boolean) as Prisma.UserWhereInput[],
			});
		}

		if (bannedOnly) {
			const bannedIds = await db.revokedMembers.findMany({
				select: { userId: true },
			});
			const bannedIdsSet = new Set(bannedIds.map((b) => b.userId));
			baseConditions.push({
				AND: [
					{
						id: {
							in: Array.from(bannedIdsSet),
						},
					},
				],
			});
		}

		if (role && role !== "all") {
			baseConditions.push({
				role: {
					name: role,
				},
			});
		}

		const where: Prisma.UserWhereInput =
			baseConditions.length > 0 ? { AND: baseConditions } : {};

		const orderByClause: Prisma.UserOrderByWithRelationInput =
			sortBy === "role"
				? { role: { name: sortOrder } }
				: { [sortBy]: sortOrder };

		const [results, total] = await Promise.all([
			db.user.findMany({
				where,
				skip,
				take: limit,
				orderBy: orderByClause,
				select: {
					id: true,
					name: true,
					usn: true,
					memberSince: true,
					email: true,
					phone: true,
					role: {
						select: {
							id: true,
							name: true,
						},
					},
					banCount: true,
					strikeCount: true,
					strikes: {
						select: {
							id: true,
							reason: true,
							createdAt: true,
						},
					},
				},
			}),
			db.user.count({ where }),
		]);

		return {
			data: results,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		};
	},
	{ actionName: "user.search" },
);

export const addBanStreak = protectedAction(
	async (input: { userId: number; reason: string }) => {
		const { userId, reason } = input;

		if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
			throw new Error("Reason for strike cannot be blank");
		}
		const trimmedReason = reason.trim();

		const user = await db.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error("User not found");

		const updatedUser = await db.user.update({
			where: { id: userId },
			data: {
				strikes: {
					create: {
						reason: trimmedReason,
					},
				},
				strikeCount: {
					increment: 1,
				},
			},
			select: {
				id: true,
				name: true,
				strikes: {
					select: {
						id: true,
						reason: true,
						createdAt: true,
					},
				},
			},
		});

		if (updatedUser.strikes.length >= 3) {
			const bannedRoleId = await db.role.findUnique({
				where: { name: "BANNED" },
				select: { id: true },
			});
			if (!bannedRoleId) throw new Error("BANNED role not found");

			// Get the user's current role before changing it
			const currentUser = await db.user.findUnique({
				where: { id: userId },
				select: { roleId: true },
			});
			if (!currentUser) throw new Error("User not found");

			await db.user.update({
				where: { id: userId },
				data: {
					banCount: {
						increment: 1,
					},
					roleId: bannedRoleId.id,
				},
			});

			const alreadyRevoked = await db.revokedMembers.findUnique({
				where: { userId },
			});
			if (alreadyRevoked) {
				return;
			}

			// Store the original roleId so it can be restored on unban
			await db.revokedMembers.create({
				data: {
					userId: updatedUser.id,
					roleId: currentUser.roleId,
				},
			});
		}
	},
	{ actionName: "user.addBanStreak" },
);

export const decreaseBanStreak = protectedAction(
	async (input: { strikeId: string }) => {
		const deletedStrike = await db.strike.delete({
			where: { id: input.strikeId },
			select: { id: true, userId: true },
		});

		if (!deletedStrike) throw new Error("Strike not found");

		const result = await db.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: deletedStrike.userId },
				data: {
					strikeCount: {
						decrement: 1,
					},
				},
			});
			const totalStrikes = await tx.strike.count({
				where: { userId: deletedStrike.userId },
			});
			if (totalStrikes < 3) {
				const revoked = await tx.revokedMembers.findUnique({
					where: { userId: deletedStrike.userId },
					select: { roleId: true },
				});
				if (revoked) {
					// Restore the original role from revokedMembers
					await tx.user.update({
						where: { id: deletedStrike.userId },
						data: { roleId: revoked.roleId },
					});

					await tx.revokedMembers.delete({
						where: { userId: deletedStrike.userId },
					});
				}
			}
			return { success: true };
		});

		return result;
	},
	{ actionName: "user.decreaseBanStreak" },
);

export const removeStrikeReason = protectedAction(
	async (input: { userId: number; strikeId: string }) => {
		const { userId, strikeId } = input;

		const user = await db.user.findUnique({
			where: { id: userId },
			select: {
				strikes: {
					select: {
						id: true,
					},
				},
			},
		});
		if (!user) throw new Error("User not found");

		const result = await db.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: {
					strikeCount: {
						decrement: 1,
					},
				},
			});
			const updated = await tx.strike.delete({
				where: { id: strikeId },
			});

			if (user.strikes.length - 1 < 3) {
				const revoked = await tx.revokedMembers.findUnique({
					where: { userId },
					select: { roleId: true },
				});

				if (revoked) {
					await tx.user.update({
						where: { id: userId },
						data: { roleId: revoked.roleId },
					});

					await tx.revokedMembers.delete({ where: { userId } });
				}
			}

			return updated;
		});

		return result;
	},
	{ actionName: "user.removeStrikeReason" },
);

export const revokeBan = protectedAction(
	async (input: { userId: number }) => {
		const { userId } = input;

		const user = await db.user.findUnique({
			where: { id: userId },
			select: {
				strikes: {
					select: {
						id: true,
					},
				},
			},
		});
		if (!user) throw new Error("User not found");

		const result = await db.$transaction(async (tx) => {
			const revoked = await tx.revokedMembers.findUnique({
				where: { userId },
				select: { roleId: true },
			});

			if (!revoked) {
				throw new Error("User is not revoked/banned");
			}

			await tx.user.update({
				where: { id: userId },
				data: { roleId: revoked.roleId },
			});

			await tx.revokedMembers.delete({ where: { userId } });

			return { success: true };
		});
		return result;
	},
	{ actionName: "user.revokeBan" },
);

export const getStrikesForUser = async (userId: number) => {
	const strikes = await db.strike.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		select: {
			reason: true,
			createdAt: true,
		},
	});
	return {
		success: true,
		data: strikes,
	};
};

export const updateUserRole = protectedAction(
	async (session: Session, input: unknown) => {
		const { userId, roleName } = updateRoleSchema.parse(input);

		if (session.user.id === userId) {
			throw new Error("You cannot update your own role.");
		}

		if (roleName === "ADMIN" && session.user.role.name !== "ADMIN") {
			throw new Error("Only admins can assign the ADMIN role.");
		}

		const targetUser = await db.user.findUnique({
			where: { id: userId },
			include: { role: true },
		});

		if (!targetUser) throw new Error("User not found");

		if (
			targetUser.role.name === "ADMIN" &&
			session.user.role.name !== "ADMIN"
		) {
			throw new Error("Only admins can update roles of ADMIN users.");
		}

		const role = await db.role.findUnique({ where: { name: roleName } });
		if (!role) throw new Error("Invalid role");

		const updated = await db.user.update({
			where: { id: userId },
			data: { roleId: role.id },
			select: {
				id: true,
				role: { select: { name: true, id: true } },
			},
		});

		return updated;
	},
	{ actionName: "user.updateOneRole" },
);

export const updateMultipleUserRoles = protectedAction(
	async (session: Session, input: { userIds: number[]; roleName: string }) => {
		const { userIds, roleName } = input;

		if (userIds.includes(session.user.id)) {
			throw new Error("You cannot update your own role.");
		}

		if (roleName === "ADMIN" && session.user.role.name !== "ADMIN") {
			throw new Error("Only admins can assign the ADMIN role.");
		}

		const role = await db.role.findUnique({
			where: { name: roleName },
		});
		if (!role) throw new Error("Invalid role");

		const usersToUpdate = await db.user.findMany({
			where: { id: { in: userIds } },
			include: { role: true },
		});

		const hasAdmin = usersToUpdate.some((u) => u.role.name === "ADMIN");
		if (hasAdmin && session.user.role.name !== "ADMIN") {
			throw new Error("Only admins can change roles of ADMIN users.");
		}

		const updated = await db.user.updateMany({
			where: { id: { in: userIds } },
			data: { roleId: role.id },
		});

		return updated;
	},
	{ actionName: "user.updateMultipleRoles" },
);

export const updateProfilePicture = async (
	userId: number,
	imageUrl: string,
) => {
	try {
		const user = await db.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error("User not found");
		const updatedUser = await db.user.update({
			where: { id: userId },
			data: { image: imageUrl },
			select: {
				id: true,
				name: true,
				image: true,
			},
		});
		return {
			success: true,
			data: updatedUser,
		};
	} catch (error) {
		console.error("Error updating profile picture:", error);
		return {
			success: false,
			error: "Failed to update profile picture.",
		};
	}
};

export const updateUser = async (input: {
	userId: number;
	name?: string;
	usn?: string;
	branch?: string;
	year?: string;
	bio?: string;
}) => {
	const { userId, name, usn, branch, year, bio } = input;

	const data: Prisma.UserUpdateInput = {};
	if (name !== undefined) data.name = name;
	if (usn !== undefined) data.usn = usn;
	if (branch !== undefined) {
		const branchRecord = await db.branch.findUnique({ where: { id: branch } });
		if (!branchRecord) {
			throw new Error("Branch not found");
		}
		data.Branch = { connect: { id: branch } };
	}
	if (year !== undefined) data.year = year;
	if (bio !== undefined) data.bio = bio;

	const updatedUser = await db.user.update({
		where: { id: userId },
		data,
		select: {
			id: true,
			name: true,
			email: true,
			usn: true,
			year: true,
			bio: true,
		},
	});

	return updatedUser;
};

export const addUserLink = async (input: unknown) => {
	const { userId, linkName, url } = addUserLinkSchema.parse(input);

	const user = await db.user.findUnique({ where: { id: userId } });
	if (!user) throw new Error("User not found");

	const newLink = await db.userLink.create({
		data: {
			linkName,
			url,
			userId,
		},
		select: {
			id: true,
			linkName: true,
			url: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return newLink;
};

export const removeUserLink = async (input: {
	userId: number;
	linkName: string;
}) => {
	const { userId, linkName } = input;

	const user = await db.user.findUnique({ where: { id: userId } });
	if (!user) throw new Error("User not found");

	const link = await db.userLink.findFirst({
		where: { userId, linkName },
	});
	if (!link) throw new Error("Link not found");

	await db.userLink.delete({
		where: { id: link.id },
	});

	return { success: true };
};

export const searchUserById = async (input: { userId: number }) => {
	const { userId } = input;

	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			usn: true,
			image: true,
			Branch: {
				select: {
					id: true,
					name: true,
				},
			},
			totalActivityPoints: true,
			UserLink: {
				select: {
					id: true,
					linkName: true,
					url: true,
				},
			},
			year: true,
			bio: true,
			memberSince: true,
			email: true,
			role: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!user) throw new Error("User not found");

	return user;
};

export const searchUserByUsn = protectedAction(
	async (_session, input: { usn: string }) => {
		const { usn } = input;

		const user = await db.user.findFirst({
			where: {
				usn: {
					equals: usn,
					mode: "insensitive",
				},
			},
			select: {
				id: true,
				name: true,
				usn: true,
				email: true,
			},
		});

		if (!user) {
			return { success: false, error: "User not found" };
		}

		return { success: true, data: user };
	},
	{ actionName: "user.searchByUsn" },
);

export const isUserOrganiser = protectedAction(
	async (input: { userId: number }) => {
		const { userId } = input;

		// Fetch the user, but only return the count of Organiser relations
		const userWithOrganiserCount = await db.user.findUnique({
			where: { id: userId },
			select: {
				_count: {
					select: { Organiser: true },
				},
			},
		});

		// If the user doesn't exist, treat as "not an organiser"
		const organiserCount = userWithOrganiserCount?._count.Organiser ?? 0;

		return {
			success: true,
			data: organiserCount > 0,
		};
	},
);

export const getRegisteredEvents = async (input: { userId: number }) => {
	const { userId } = input;

	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			Team: {
				select: {
					isConfirmed: true,
					hasAttended: true,
					Event: {
						select: {
							id: true,
							name: true,
							imgSrc: true,
							state: true,
							fromDate: true,
						},
					},
				},
			},
			TeamLeader: {
				select: {
					isConfirmed: true,
					hasAttended: true,
					Event: {
						select: {
							id: true,
							name: true,
							imgSrc: true,
							state: true,
							fromDate: true,
						},
					},
				},
			},
			Certificate: {
				select: {
					id: true,
					issuedOn: true,
					link: true,
					eventId: true,
					statusOfMailing: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	});

	if (!user) throw new Error("User not found");

	const extractEvents = (teams: typeof user.Team) =>
		teams
			.filter((team) => team.Event && team.isConfirmed)
			.map((team) => ({
				id: team.Event.id,
				name: team.Event.name,
				imgSrc: team.Event.imgSrc,
				state: team.Event.state,
				fromDate: team.Event.fromDate,
				isConfirmed: team.isConfirmed,
				hasAttended: team.hasAttended,
			}));

	const teamEvents = extractEvents(user.Team);
	const leaderEvents = extractEvents(user.TeamLeader);

	const eventMap = new Map<number, ReturnType<typeof extractEvents>[number]>();
	[...teamEvents, ...leaderEvents].forEach((event) => {
		eventMap.set(event.id, event);
	});

	const certificatesByEventId = new Map<number, (typeof user.Certificate)[0]>();
	user.Certificate.forEach((cert) => {
		certificatesByEventId.set(cert.eventId, cert);
	});

	const eventsWithCertificates = Array.from(eventMap.values()).map((event) => ({
		...event,
		certificates: certificatesByEventId.get(event.id) ?? null,
	}));

	return { success: true, data: eventsWithCertificates };
};
