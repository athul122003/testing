import { NextResponse } from "next/server";
import { parseJwtFromAuthHeader } from "~/lib/utils";
import { db } from "~/server/db";

export async function POST(req: Request) {
	try {
		const customHeader = req.headers.get("authorization");
		const data = parseJwtFromAuthHeader(customHeader || "");
		if (!data || !data.userId) {
			return NextResponse.json(
				{ success: false, error: "Invalid or missing authentication data" },
				{ status: 401 },
			);
		}

		const userId = data.userId;

		if (!userId) {
			return NextResponse.json({ message: "Missing userId" }, { status: 400 });
		}

		await db.refreshToken.updateMany({
			where: { userId, revoked: false },
			data: { revoked: true },
		});

		return NextResponse.json({ message: "Tokens revoked" }, { status: 200 });
	} catch (err) {
		console.error("Token revoke error:", err);
		return NextResponse.json(
			{ message: "Error revoking tokens" },
			{ status: 500 },
		);
	}
}
