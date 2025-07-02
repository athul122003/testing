// prisma/seed.ts
import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const saltRounds = 10;

const main = async () => {
	try {
		// Step 1: Create Permissions
		const permissionNames = [
			"CREATE_BLOG",
			"EDIT_USER",
			"VIEW_REPORTS",
			"MANAGE_TEAMS",
			"ISSUE_CERTIFICATE",
		];

		const permissions = await Promise.all(
			permissionNames.map(async (name) =>
				db.permission.upsert({
					where: { name },
					update: {},
					create: { name },
				}),
			),
		);

		// Step 2: Create Roles
		const roleNames = [
			"ADMIN",
			"DEVELOPER",
			"ORGANISER",
			"STUDENT",
			"MODERATOR",
		];

		const roles = await Promise.all(
			roleNames.map(async (name) =>
				db.role.upsert({
					where: { name },
					update: {},
					create: { name },
				}),
			),
		);

		// Step 3: Assign Permissions to Roles
		const rolePermissionPairs = [];

		for (let i = 0; i < roles.length; i++) {
			for (let j = 0; j <= i && j < permissions.length; j++) {
				rolePermissionPairs.push({
					roleId: roles[i].id,
					permissionId: permissions[j].id,
				});
			}
		}

		await db.rolePermission.createMany({
			data: rolePermissionPairs,
			skipDuplicates: true,
		});

		// Step 4: Seed 20 Users
		const users = [];

		for (let i = 1; i <= 20; i++) {
			const role = roles[(i - 1) % roles.length];
			const hashedPassword = await bcrypt.hash("password123", saltRounds);

			users.push({
				name: `User ${i}`,
				slug: `user-${i}`,
				email: `user${i}@example.com`,
				usn: `USN${1000 + i}`,
				password: hashedPassword,
				phone: `90000000${i.toString().padStart(2, "0")}`,
				image: null,
				year: "2025",
				roleId: role.id,
				memberSince: new Date(),
				totalActivityPoints: 0,
				bio: `This is user ${i}`,
				reasonToJoin: "Learn and grow",
				expectations: "Collaborate with peers",
				contribution: "Code and documentation",
				githubLink: `https://github.com/user${i}`,
			});
		}

		for (const user of users) {
			await db.user.upsert({
				where: { email: user.email },
				update: {},
				create: user,
			});
		}

		console.log(
			"✅ Seed complete: 5 roles, 5 permissions, and 20 users created!",
		);
	} catch (err) {
		console.error("❌ Seed error:", err);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
};

main();
