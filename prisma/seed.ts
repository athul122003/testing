import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

const BRANCHES: readonly [string, string][] = [
	// B.Tech
	["AIDS", "Artificial Intelligence and Data Science"],
	["AIML", "Artificial Intelligence and Machine Learning"],
	["BT", "Biotechnology"],
	["CE", "Civil Engineering"],
	["CCE", "Computer and Communication Engineering"],
	["CSE", "Computer Science and Engineering"],
	["CSE(Full Stack)", "Computer Science (Full Stack Development)"],
	["CSE(Cyber Security)", "Computer Science and Engineering (Cyber Security)"],
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

async function main() {
	prisma.branch
		.createMany({
			data: Array.from(BRANCHES, ([nickName, name]) => ({
				name: name,
				nickName: nickName,
			})),
		})
		.then(() => console.log("Branches seeded successfully"))
		.catch(console.error);
}

main()
	.then(async () => {
		console.log("DB seeded successfully, seed: prisma/seed.ts");
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e, ", seed: prisma/seed.ts");
		await prisma.$disconnect();
		process.exit(1);
	});
