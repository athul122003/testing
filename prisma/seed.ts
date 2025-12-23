// prisma/seed.ts

import {
	PaymentType,
	PrismaClient,
	EventType,
	EventCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});
//Updated adapter import and initialization for PrismaPg
const db = new PrismaClient({ adapter });

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
			"MANAGE_USER_ROLES",
			"MANAGE_ROLE_PERMISSIONS",
			"MANAGE_EVENTS",
			"MANAGE_PAYMENTS",
			"MANAGE_CORE",
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

		const roleNames = [
			"ADMIN",
			"DEVELOPER",
			"ORGANISER",
			"USER",
			"MEMBER",
			"MODERATOR",
			"CP",
		];

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
			if (role.name === "USER" || role.name === "MEMBER") continue;
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

		// Step 4: Create users grouped by role (e.g., admin1@example.com, user2@example.com)
		const usersPerRole = 6;
		let userIndex = 1;

		for (const role of roles) {
			for (let i = 1; i <= usersPerRole; i++) {
				const roleSlug = role.name.toLowerCase();
				const userNumber = i;
				const email = `${roleSlug}${userNumber}@example.com`;
				const name = `${role.name} ${userNumber}`;
				const usn = `USN${1000 + userIndex}`;
				const hashedPassword = await bcrypt.hash("789789", saltRounds);

				await db.user.upsert({
					where: { email },
					update: {},
					create: {
						name,
						email,
						usn,
						emailVerified: new Date(),
						password: hashedPassword,
						phone: `90000000${userIndex.toString().padStart(2, "0")}`,
						image: null,
						year: "2025",
						roleId: role.id,
						memberSince: new Date(),
						totalActivityPoints: 0,
						bio: `This is ${name}`,
						reasonToJoin: "Learn and grow",
						expectations: "Collaborate with peers",
						contribution: "Code and documentation",
						githubLink: `https://github.com/${roleSlug}${userNumber}`,
					},
				});

				userIndex++;
			}
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

		const settings = [
			{
				name: "registrationsOpen",
				status: true,
				description: "Club Registrations Open",
			},
			{
				name: "maintenanceMode",
				status: false,
				description: "Maintenance Mode",
			},
			{
				name: "notice",
				status: false,
				description: "Notice for all users",
			},
		];

		for (const setting of settings) {
			await db.settings.upsert({
				where: { name: setting.name },
				update: {
					status: setting.status,
					description: setting.description,
				},
				create: setting,
			});
		}

		console.log("🌱 Settings seeded successfully!");

		const now = new Date();

		const events = await db.$transaction([
			db.event.create({
				data: {
					name: "Solo Coding Challenge",
					eventType: EventType.SOLO,
					category: EventCategory.WORKSHOP,
					maxTeamSize: 1,
					minTeamSize: 1,
					isMembersOnly: false,
					state: "PUBLISHED",
					fromDate: new Date(now.getTime() + 7 * 86400000),
					toDate: new Date(now.getTime() + 8 * 86400000),
					deadline: new Date(now.getTime() + 6 * 86400000),
					description: "A solo coding event.",
					isLegacy: false,
				},
			}),
			db.event.create({
				data: {
					name: "Team Hackathon",
					eventType: EventType.TEAM,
					category: EventCategory.HACKATHON,
					maxTeamSize: 4,
					minTeamSize: 2,
					isMembersOnly: false,
					state: "PUBLISHED",
					fromDate: new Date(now.getTime() + 14 * 86400000),
					toDate: new Date(now.getTime() + 15 * 86400000),
					deadline: new Date(now.getTime() + 13 * 86400000),
					description: "A team-based hackathon.",
					isLegacy: false,
				},
			}),
			db.event.create({
				data: {
					name: "Unconfirmed Event 1",
					eventType: EventType.SOLO,
					category: EventCategory.SPECIAL,
					maxTeamSize: 1,
					minTeamSize: 1,
					isMembersOnly: false,
					state: "DRAFT",
					fromDate: new Date(now.getTime() + 21 * 86400000),
					toDate: new Date(now.getTime() + 22 * 86400000),
					deadline: new Date(now.getTime() + 20 * 86400000),
					description: "Unconfirmed event.",
					isLegacy: false,
				},
			}),
			db.event.create({
				data: {
					name: "Unconfirmed Event 2",
					eventType: EventType.TEAM,
					category: EventCategory.COMPETITION,
					maxTeamSize: 3,
					minTeamSize: 2,
					isMembersOnly: false,
					state: "DRAFT",
					fromDate: new Date(now.getTime() + 28 * 86400000),
					toDate: new Date(now.getTime() + 29 * 86400000),
					deadline: new Date(now.getTime() + 27 * 86400000),
					description: "Another unconfirmed event.",
					isLegacy: false,
				},
			}),
		]);

		console.log("Events seeded");

		const soloEvent = events[0];
		const teamEvent = events[1];

		if (allUsers.length < 10) {
			throw new Error("Not enough users to seed events.");
		}

		// Step 3: Populate SOLO event registrations
		for (let i = 0; i < 5; i++) {
			const user = allUsers[i];
			await db.team.create({
				data: {
					name: user.name,
					isConfirmed: true,
					eventId: soloEvent.id,
					leaderId: user.id,
					Members: {
						connect: [{ id: user.id }],
					},
				},
			});
		}

		let userIndex1 = 5;
		for (let i = 0; i < 4; i++) {
			const teamMembers = allUsers.slice(userIndex1, userIndex1 + 3); // Up to 3 members per team
			const leader = teamMembers[0];
			userIndex1 += 3;

			await db.team.create({
				data: {
					name: `Team ${i + 1}`,
					isConfirmed: Math.random() > 0.5, // Random confirmed/unconfirmed
					eventId: teamEvent.id,
					leaderId: leader.id,
					Members: {
						connect: [
							{ id: leader.id },
							...teamMembers
								.filter((m) => m.id !== leader.id)
								.map((m) => ({ id: m.id })),
						],
					},
				},
			});
		}

		console.log("Teams seeded for events");

		console.log(
			"Seed complete: 5 roles, 5 permissions, 35 users, 28 payments, 2 settings, 4 events and branches seeded.",
		);
	} catch (err) {
		console.error("Seed error:", err);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
};

main();
