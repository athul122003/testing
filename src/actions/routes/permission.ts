"use server";
import { z } from "zod";
import { db } from "~/server/db";

// --- SCHEMAS ---
const createPermissionSchema = z.object({
	name: z.string().min(1),
});

const deletePermissionSchema = z.object({
	id: z.string(),
});

// --- INDIVIDUAL SERVER ACTIONS ---
export async function getAll() {
	try {
		return await db.permission.findMany();
	} catch (err) {
		console.error("Error fetching permissions:", err);
		throw new Error(`Failed to fetch permissions: ${err}`);
	}
}

export async function create(input: unknown) {
	const { name } = createPermissionSchema.parse(input);

	const existing = await db.permission.findUnique({
		where: { name },
	});

	if (existing) {
		throw new Error("Permission with this name already exists.");
	}

	const newPermission = await db.permission.create({
		data: { name },
	});

	return newPermission;
}

export async function deletePerm(input: unknown) {
	const { id } = deletePermissionSchema.parse(input);

	try {
		return await db.permission.delete({
			where: { id },
		});
	} catch (err) {
		console.error("Error deleting permission:", err);
		throw new Error("Failed to delete permission");
	}
}
