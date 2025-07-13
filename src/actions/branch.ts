"use server";

import { db } from "~/server/db";

export async function getBranchData() {
	try {
		const branches = await db.branch.findMany({
			orderBy: { name: "asc" },
		});
		return {
			success: true,
			data: branches,
		};
	} catch (error) {
		console.error("getBranchData Error:", error);
		return {
			success: false,
			error: "Failed to fetch branch data.",
		};
	}
}
