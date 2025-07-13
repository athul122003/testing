import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop(); // extracts `[action]` param

		const body = await req.json();

		switch (action) {
			case "getAll":
				return NextResponse.json(await server.permission.getAll());

			// case "create":
			// 	return NextResponse.json(await server.permission.create(body)); TODO [PARIPOORNA] FIX THIS

			// case "delete":
			// 	return NextResponse.json(await server.permission.deletePerm(body)); TODO [PARIPOORNA] FIX THIS

			default:
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Permission route error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
