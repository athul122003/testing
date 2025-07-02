"use server";
import { z } from "zod";
import { db } from "~/server/db";

// --- SCHEMAS ---
const createRoleSchema = z.object({
	name: z.string().min(1),
});

const deleteRoleSchema = z.object({
	id: z.string(),
});

// --- INDIVIDUAL SERVER ACTIONS ---

export async function getAll() {
	try {
		const roles = await db.role.findMany({
			include: {
				permissions: {
					select: {
						permission: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});

		return roles;
	} catch (err) {
		console.error("Error in getAll roles:", err);
		throw new Error("Failed to fetch roles");
	}
}

export async function create(input: unknown) {
	const { name } = createRoleSchema.parse(input);

	const existing = await db.role.findUnique({
		where: { name },
	});

	if (existing) {
		throw new Error("Role with this name already exists.");
	}

	const newRole = await db.role.create({
		data: { name },
		select: {
			id: true,
			name: true,
		},
	});

	return newRole;
}

export async function deleteRole(input: unknown) {
	const { id } = deleteRoleSchema.parse(input);

	try {
		// Fetch role before deletion
		const role = await db.role.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
			},
		});

		if (!role) {
			throw new Error("Role not found");
		}

		// Delete the role
		await db.role.delete({
			where: { id },
		});

		// Return role info for toast
		return role;
	} catch (err) {
		console.error("Error deleting role:", err);
		throw new Error("Failed to delete role");
	}
}

const updateRolePermissionsSchema = z.object({
	roleId: z.string(),
	permissionIds: z.array(z.string()),
});

export async function updateRolePermissions(input: unknown) {
	const { roleId, permissionIds } = updateRolePermissionsSchema.parse(input);

	// Fetch existing permission IDs for the role
	const existing = await db.rolePermission.findMany({
		where: { roleId },
		select: { permissionId: true },
	});

	const existingIds = existing.map((rp) => rp.permissionId);

	// Compute changes
	const addedIds = permissionIds.filter((id) => !existingIds.includes(id));
	const removedIds = existingIds.filter((id) => !permissionIds.includes(id));

	// Delete removed permissions
	if (removedIds.length > 0) {
		await db.rolePermission.deleteMany({
			where: {
				roleId,
				permissionId: { in: removedIds },
			},
		});
	}

	// Add new permissions
	if (addedIds.length > 0) {
		await db.rolePermission.createMany({
			data: addedIds.map((permissionId) => ({
				roleId,
				permissionId,
			})),
		});
	}

	// Fetch just the role metadata
	const role = await db.role.findUniqueOrThrow({
		where: { id: roleId },
		select: { id: true, name: true },
	});

	return {
		role,
		addedIds,
		removedIds,
	};
}
