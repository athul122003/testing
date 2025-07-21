import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		if (action === "getAll") {
			const core = await db.core.findMany({
				include: {
					User: {
						select: {
							id: true,
							name: true,
							UserLink: true,
							image: true,
						},
					},
				},
			});

			core.sort((a, b) => {
				const yearA = Number(a.year);
				const yearB = Number(b.year);
				if (yearA !== yearB) {
					return yearA - yearB;
				}
				const priorityA = Number(a.priority);
				const priorityB = Number(b.priority);
				return priorityA - priorityB;
			});

			if (!core || core.length === 0) {
				return NextResponse.json(
					{ success: false, error: "No core members found" },
					{ status: 404 },
				);
			}
			const arrangedData = core.map((item) => ({
				id: item.User.id,
				name: item.User.name,
				image: item.User.image,
				userLink: item.User.UserLink,
				year: item.year,
				position: item.position,
				type: item.type,
				priority: item.priority,
			}));
			return NextResponse.json({
				success: true,
				data: arrangedData,
			});
		} else {
			return NextResponse.json(
				{ success: false, error: "Unknown action" },
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Error in GET /api/core:", error);
		return NextResponse.json(
			{ success: false, error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
