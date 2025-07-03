// prisma/seed.ts
import { PaymentType, PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const saltRounds = 10; // DEFAULT BE 10, NO CHANGES TO BE MADE HERE

const main = async () => {
	try {
		const BRANCHES: readonly [string, string][] = [
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
			permissionNames.map((name) =>
				db.permission.upsert({
					where: { name },
					update: {},
					create: { name },
				}),
			),
		);

		const roleNames = ["ADMIN", "DEVELOPER", "ORGANISER", "USER", "MODERATOR"];

		const roles = await Promise.all(
			roleNames.map((name) =>
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

		await db.branch.createMany({
			data: Array.from(BRANCHES, ([nickName, name]) => ({ name, nickName })),
			skipDuplicates: true,
		});
		console.log("Branches seeded");

		await db.rolePermission.createMany({
			data: rolePermissionPairs,
			skipDuplicates: true,
		});
		console.log("Role permissions seeded");

		// Step 4: Create 35 Users
		for (let i = 1; i <= 35; i++) {
			const role = roles[(i - 1) % roles.length];
			const hashedPassword = await bcrypt.hash("password123", saltRounds);

			await db.user.upsert({
				where: { email: `user${i}@example.com` },
				update: {},
				create: {
					name: `User ${i}`,
					slug: `user-${i}`,
					email: `user${i}@example.com`,
					usn: `USN${1000 + i}`,
					emailVerified: new Date(),
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
				},
			});
		}

		const allUsers = await db.user.findMany();
		const paymentTypes = PaymentType;

		for (let i = 1; i <= 28; i++) {
			const user = allUsers[i - 1];
			const isSuccess = i % 6 !== 0;

			//create 35 payments
			await db.payment.create({
				data: {
					paymentName: `Payment ${i}`,
					amount: Math.floor(Math.random() * 90 + 10) * 10,
					paymentType:
						PaymentType[
							Object.keys(paymentTypes)[
								Math.floor(Math.random() * Object.keys(paymentTypes).length)
							] as keyof typeof PaymentType
						],
					razorpayOrderId: `order_${Math.random().toString(36).slice(2, 12)}`,
					razorpayPaymentId: isSuccess
						? `pay_${Math.random().toString(36).slice(2, 12)}`
						: "",
					razorpaySignature: isSuccess
						? `sig_${Math.random().toString(36).slice(2, 12)}`
						: "",
					createdAt: new Date(Date.now() - i * 86400000),
					User: {
						connect: { id: user.id },
					},
				},
			});
		}

		console.log("28 payments seeded");
		console.log(
			"Seed complete: 5 roles, 5 permissions, 35 users, 28 payments, and branches seeded.",
		);
	} catch (err) {
		console.error("Seed error:", err);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
};

main();
