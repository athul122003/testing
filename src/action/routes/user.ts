// src/action/routes/user.ts
"use server";

import { db } from "~/server/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// --- Zod Schemas ---
const searchSchema = z.object({
	query: z.string().optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	sortBy: z.enum(["name", "id"]).default("id"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const changeRoleSchema = z.object({
	id: z.number(),
	newRoleId: z.string().min(1),
});

// --- INDIVIDUAL FUNCTION EXPORTS ---
export async function searchUser(input: unknown) {
	try {
		const { query, page, limit, sortBy, sortOrder } = searchSchema.parse(input);
		const skip = (page - 1) * limit;

		const where: Prisma.UserWhereInput =
			query && query.trim().length > 0
				? {
						OR: [
							{
								name: {
									contains: query,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								email: {
									contains: query,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								usn: {
									contains: query,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							!isNaN(Number(query))
								? {
										id: Number(query),
									}
								: null,
						].filter(Boolean) as Prisma.UserWhereInput[],
					}
				: {};

		const [results, total] = await Promise.all([
			db.user.findMany({
				where,
				skip,
				take: limit,
				orderBy: {
					[sortBy]: sortOrder,
				},
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
		console.error("Error in searchUser:", err);
		throw new Error("Failed to fetch users");
	}
}

export async function updateRole(input: z.infer<typeof changeRoleSchema>) {
	try {
		const { id, newRoleId } = changeRoleSchema.parse(input);

		const roleExists = await db.role.findUnique({
			where: { id: newRoleId },
		});

		if (!roleExists) {
			throw new Error("Role not found");
		}

		const updatedUser = await db.user.update({
			where: { id },
			data: { roleId: newRoleId },
			select: {
				id: true,
				name: true,
				email: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		return updatedUser;
	} catch (err) {
		console.error("Error in updateRole:", err);
		throw new Error("Failed to update user role");
	}
}
