import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(req: Request) {
	try {
		const { userId } = await req.json();
		if (!userId) {
			return NextResponse.json({ message: "Missing userId" }, { status: 400 });
		}

		const cookieHeader = req.headers.get("cookie") || "";
		const sessionTokenMatch = cookieHeader.match(
			/next-auth\.session-token=([^;]+)/,
		);
		const sessionToken = sessionTokenMatch?.[1];

		if (!sessionToken) {
			return NextResponse.json(
				{ message: "Missing session token" },
				{ status: 401 },
			);
		}

		// Revoke refresh tokens
		await db.refreshToken.updateMany({
			where: { userId, revoked: false },
			data: { revoked: true },
		});

		const response = NextResponse.json(
			{ message: "Signed out and tokens revoked" },
			{ status: 200 },
		);

		response.cookies.set("next-auth.session-token", "", {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			// domain: ".vercel.app", set to finiteloop.co.in on production
			expires: new Date(0),
		});

		return response;
	} catch (err) {
		console.error("Signout error:", err);
		return NextResponse.json({ message: "Error" }, { status: 500 });
	}
}
