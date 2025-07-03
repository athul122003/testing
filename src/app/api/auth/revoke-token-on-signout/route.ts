import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth/auth"; // Adjust path
import { db } from "~/server/db"; // Adjust path

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		await db.refreshToken.updateMany({
			where: {
				userId: session.user.id,
				revoked: false,
			},
			data: {
				revoked: true,
			},
		});

		return NextResponse.json(
			{ message: "Refresh tokens revoked successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("API /api/auth/revoke-token-on-signout error:", error);
		return NextResponse.json(
			{ message: "Failed to revoke tokens" },
			{ status: 500 },
		);
	}
}
