"use server";
import { db } from "~/server/db";

const EXCLUDED_USER_IDS = [
	1, 414, 289, 181, 13, 478, 482, 454, 500, 531, 393, 453, 583, 9, 205, 74, 18,
	57, 940, 1114, 418, 69, 1200, 1188, 46, 953, 8, 366, 546, 37, 359, 177, 166,
	995, 139, 104, 870, 17, 222, 2754, 141, 2326, 1190, 868, 65, 1103, 2044, 515,
	4, 388, 2948, 158,
];

export async function getLeaderboardData() {
	try {
		const leaderboardRaw = await db.user.findMany({
			where: {
				id: {
					notIn: EXCLUDED_USER_IDS,
				},
			},
			orderBy: [{ totalActivityPoints: "desc" }, { id: "asc" }],
			select: {
				id: true,
				name: true,
				totalActivityPoints: true,
				image: true,
			},
			take: 25,
		});

		let currentRank = 1;
		let lastPoints: number | null = null;

		const leaderboard = leaderboardRaw.map((user) => {
			if (lastPoints !== null && user.totalActivityPoints !== lastPoints) {
				currentRank++;
			}
			const userWithRank = { ...user, rank: currentRank };
			lastPoints = user.totalActivityPoints;
			return userWithRank;
		});
		return {
			success: true,
			data: leaderboard,
		};
	} catch (error) {
		console.error("getLeaderboardData Error:", error);
		return {
			success: false,
			error: "Failed to fetch leaderboard data.",
		};
	}
}
export async function getRankOfUser(userId: number) {
	try {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: { totalActivityPoints: true, name: true, image: true },
		});
		if (!user) {
			return { success: false, error: "User not found." };
		}
		const rank = await db.user.count({
			where: {
				totalActivityPoints: {
					gt: user.totalActivityPoints,
				},
				id: {
					notIn: EXCLUDED_USER_IDS,
				},
			},
		});
		return {
			success: true,
			id: userId,
			name: user.name,
			activityPoints: user.totalActivityPoints,
			rank: rank + 1,
			image: user.image || null,
		};
	} catch (error) {
		console.error("getRankOfUser Error:", error);
		return {
			success: false,
			error: "Failed to fetch user rank.",
		};
	}
}
