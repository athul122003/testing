"use server";
import type { Session } from "next-auth";
import { z } from "zod";
import { db } from "~/server/db";
import { protectedAction } from "~/actions/middleware/protectedAction";

// --- SCHEMAS ---
const createRoleSchema = z.object({ name: z.string().min(1) });
const deleteRoleSchema = z.object({ id: z.string() });
const updateRolePermissionsSchema = z.object({
	roleId: z.string(),
	permissionIds: z.array(z.string()),
});

// --- WRAPPED PROTECTED SERVER ACTIONS ---

export const getAll = protectedAction(
	async () => {
		const roles = await db.role.findMany({
			include: {
				permissions: {
					select: {
						permission: { select: { id: true, name: true } },
					},
				},
			},
		});
		return roles;
	},
	{ actionName: "role.getAll" },
);

export const create = protectedAction(
	async (input: unknown) => {
		const { name } = createRoleSchema.parse(input);
		const existing = await db.role.findUnique({ where: { name } });

		if (existing) throw new Error("Role with this name already exists.");

		const newRole = await db.role.create({
			data: { name },
			select: { id: true, name: true },
		});

		return newRole;
	},
	{ actionName: "role.create" },
);

export const deleteRole = protectedAction(
	async (input: unknown) => {
		const { id } = deleteRoleSchema.parse(input);

		const role = await db.role.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!role) throw new Error("Role not found");
		if (["USER", "ADMIN", "MEMBER"].includes(role.name))
			throw new Error(`Cannot delete default ${role.name} role`);

		const userRole = await db.role.findUnique({
			where: { name: "USER" },
			select: { id: true },
		});

		if (!userRole) throw new Error("Default USER role not found");

		const memberRole = await db.role.findUnique({
			where: { name: "MEMBER" },
			select: { id: true },
		});

		const allRoleUsers = await db.user.findMany({
			where: { roleId: role.id },
			select: { id: true, paymentId: true },
		});

		if (allRoleUsers.length > 0) {
			for (const user of allRoleUsers) {
				if (user.paymentId !== null) {
					await db.user.update({
						where: { id: user.id },
						data: { roleId: memberRole?.id || userRole.id },
					});
				} else {
					await db.user.update({
						where: { id: user.id },
						data: { roleId: userRole.id },
					});
				}
			}
		}

		await db.role.delete({ where: { id: role.id } });

		return role;
	},
	{ actionName: "role.delete" },
);

export const updateRolePermissions = protectedAction(
	async (session: Session, input: unknown) => {
		const { roleId, permissionIds } = updateRolePermissionsSchema.parse(input);

		const role = await db.role.findUnique({
			where: { id: roleId },
			select: { id: true, name: true },
		});

		if (!role) throw new Error("Role not found");

		// ❌ Prevent user from updating their own role
		if (role.name === session.user.role.name) {
			throw new Error("You cannot update permissions for your own role.");
		}

		// ❌ Prevent updates to default protected roles
		if (["USER", "ADMIN", "MEMBER"].includes(role.name)) {
			throw new Error(`Cannot update permissions for the ${role.name} role`);
		}

		const existing = await db.rolePermission.findMany({
			where: { roleId },
			select: { permissionId: true },
		});

		const existingIds = existing.map((rp) => rp.permissionId);
		const addedIds = permissionIds.filter((id) => !existingIds.includes(id));
		const removedIds = existingIds.filter((id) => !permissionIds.includes(id));

		if (removedIds.length > 0) {
			await db.rolePermission.deleteMany({
				where: { roleId, permissionId: { in: removedIds } },
			});
		}

		if (addedIds.length > 0) {
			await db.rolePermission.createMany({
				data: addedIds.map((permissionId) => ({ roleId, permissionId })),
			});
		}

		return { role, addedIds, removedIds };
	},
	{ actionName: "role.updateRolePermissions" },
);
