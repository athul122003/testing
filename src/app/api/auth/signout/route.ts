import { NextResponse } from "next/server";

export async function GET() {
	const response = NextResponse.json({ message: "Signed out" });

	response.cookies.set("next-auth.session-token", "", {
		httpOnly: true,
		secure: true,
		path: "/",
		expires: new Date(0),
	});

	return response;
}
