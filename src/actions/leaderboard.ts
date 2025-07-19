"use server";
import { db } from "~/server/db";

export async function getLeaderboardData() {
	try {
		const leaderboard = await db.user.findMany({
			orderBy: {
				totalActivityPoints: "desc",
			},
			select: {
				id: true,
				name: true,
				totalActivityPoints: true,
				image: true,
			},
			take: 25,
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
