"use server";
import { db } from "~/server/db";

export async function getLeaderboardData() {
	try {
		const leaderboardRaw = await db.user.findMany({
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
