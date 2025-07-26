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
	}) => {
		const { query, page, limit, sortBy, sortOrder, role } =
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
					role: {
						select: {
							id: true,
							name: true,
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

		const user = await db.user.findUnique({
			where: { usn },
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
