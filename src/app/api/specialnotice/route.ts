import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
	try {
		console.log("HELLO");
		const setting = await db.settings.findUnique({
			where: { name: "notice" },
		});

		if (!setting) {
			return NextResponse.json(
				{ success: false, error: "Setting not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			isVisible: setting.status,
			description: setting.description ?? null,
		});
	} catch (error) {
		console.error("API /api/auth error:", error);
		return NextResponse.json(
			{ message: "An unexpected error occurred during request" },
			{ status: 500 },
		);
	}
}
