// prisma/seed.ts
import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const saltRounds = 10;

const main = async () => {
	try {
		const BRANCHES: readonly [string, string][] = [
			// B.Tech
			["AIDS", "Artificial Intelligence and Data Science"],
			["AIML", "Artificial Intelligence and Machine Learning"],
			["BT", "Biotechnology"],
			["CE", "Civil Engineering"],
			["CCE", "Computer and Communication Engineering"],
			["CSE", "Computer Science and Engineering"],
			["CSE(Full Stack)", "Computer Science (Full Stack Development)"],
			[
				"CSE(Cyber Security)",
				"Computer Science and Engineering (Cyber Security)",
			],
			["EEE", "Electrical and Electronics Engineering"],
			["ECE", "Electronics and Communication Engineering"],
			["ECE(VLSI)", "Electronics Engineering (VLSI Design and Technology)"],
			["ECE(ACT)", "Electronics and Communication (ACT)"],
			["ISE", "Information Science and Engineering"],
			["ME", "Mechanical Engineering"],
			["RAI", "Robotics and Artificial Intelligence"],

			// MCA
			["MCA", "Master of Computer Applications"],
		];

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

		const roleNames = ["ADMIN", "DEVELOPER", "ORGANISER", "USER", "MODERATOR"];

		const roles = await Promise.all(
			roleNames.map(async (name) =>
				db.role.upsert({
					where: { name },
					update: {},
					create: { name },
				}),
			),
		);

		const rolePermissionPairs: { roleId: string; permissionId: string }[] = [];
		for (let i = 0; i < roles.length; i++) {
			const role = roles[i];
			if (role.name === "USER") continue;
			if (role.name === "ADMIN") {
				for (const perm of permissions) {
					rolePermissionPairs.push({
						roleId: role.id,
						permissionId: perm.id,
					});
				}
			} else {
				for (let j = 0; j <= i && j < permissions.length; j++) {
					rolePermissionPairs.push({
						roleId: role.id,
						permissionId: permissions[j].id,
					});
				}
			}
		}

		await db.branch
			.createMany({
				data: Array.from(BRANCHES, ([nickName, name]) => ({
					name: name,
					nickName: nickName,
				})),
			})
			.then(() => console.log("Branches seeded successfully"))
			.catch(console.error);

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
