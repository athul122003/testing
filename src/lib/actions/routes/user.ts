// src/action/routes/user.ts
"use server";

import { z } from "zod";
import { db } from "~/server/db";

import type { Prisma } from "@prisma/client";

// --- Zod Schemas ---
const searchSchema = z.object({
	query: z.string().optional(),
	page: z.number().min(1),
	limit: z.number().min(1),
	sortBy: z.string().default("role"),
	sortOrder: z.enum(["asc", "desc"]),
	role: z.string().optional(),
});

const changeRoleSchema = z.object({
	id: z.number(),
	newRoleId: z.string().min(1),
});

export async function searchUser(input: unknown) {
	try {
		const {
			query,
			page,
			limit,
			sortBy,
			sortOrder,
			role, // string (Role.name)
		} = searchSchema.parse(input);

		const skip = (page - 1) * limit;

		// 🌐 Build where conditions
		const baseConditions: Prisma.UserWhereInput[] = [];

		// 🔍 Add search filter
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

		// 🎯 Filter by role
		if (role && role !== "all") {
			baseConditions.push({
				role: {
					name: role,
				},
			});
		}

		const where: Prisma.UserWhereInput =
			baseConditions.length > 0 ? { AND: baseConditions } : {};

		// 🧠 Handle orderBy for relation `role.name`
		const orderByClause: Prisma.UserOrderByWithRelationInput =
			sortBy === "role"
				? { role: { name: sortOrder } }
				: { [sortBy]: sortOrder };

		// ⚡ Query users & count
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
	} catch (err) {
		console.error("❌ Error in searchUser:", err);
		throw new Error("Failed to fetch users");
	}
}

const updateRoleSchema = z.object({
	userId: z.number(),
	roleName: z.string(),
});

export async function updateUserRole(input: unknown) {
	const { userId, roleName } = updateRoleSchema.parse(input);

	// Disallow changing role *to* ADMIN
	if (roleName === "ADMIN") {
		throw new Error("Cannot assign ADMIN role.");
	}
	// Fetch current user with role
	const existingUser = await db.user.findUnique({
		where: { id: userId },
		include: { role: true },
	});

	if (!existingUser) throw new Error("User not found");
	if (existingUser.role.name === "ADMIN")
		throw new Error("Cannot change ADMIN role");

	// Get new role to apply
	const role = await db.role.findUnique({
		where: { name: roleName },
	});

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
}
export async function updateMultipleUserRoles(input: {
	userIds: number[];
	roleName: string;
}) {
	const { userIds, roleName } = input;

	// Disallow changing role *to* ADMIN
	if (roleName === "ADMIN") {
		throw new Error("Cannot assign ADMIN role.");
	}

	const role = await db.role.findUnique({
		where: { name: roleName },
	});

	if (!role) throw new Error("Invalid role");

	// Fetch users with their roles
	const usersToUpdate = await db.user.findMany({
		where: { id: { in: userIds } },
		include: { role: true },
	});

	// Disallow changing role *of* any ADMIN user
	const hasAdmin = usersToUpdate.some((u) => u.role.name === "ADMIN");
	if (hasAdmin) {
		throw new Error("Cannot update role of ADMIN users.");
	}

	// Proceed with update
	const updated = await db.user.updateMany({
		where: { id: { in: userIds } },
		data: { roleId: role.id },
	});

	return updated;
}
