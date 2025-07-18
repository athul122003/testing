import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(req: Request) {
	try {
		const { userId } = await req.json();

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
