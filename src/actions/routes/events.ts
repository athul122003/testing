"use server";
import { db } from "~/server/db";

export async function getPublishedEvents() {
	try {
		const events = await db.event.findMany({
			where: { state: "PUBLISHED" },
			orderBy: { fromDate: "asc" },
		});

		return {
			success: true,
			data: events,
		};
	} catch (error) {
		console.error("getPublishedEvents Error:", error);
		return {
			success: false,
			error: "Failed to fetch published events.",
		};
	}
}
