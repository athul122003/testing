// src/api/user/[action]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/lib/actions/serverAction";

export async function POST(
	req: NextRequest,
	{ params }: { params: { action: string } },
) {
	const body = await req.json();

	try {
		switch (params.action) {
			case "search":
				return NextResponse.json({
					success: true,
					...(await server.user.searchUser(body)),
				});
			case "updateRole":
				return NextResponse.json(await server.user.updateRole(body));
			default:
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Route error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
