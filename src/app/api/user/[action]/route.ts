import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";

export async function POST(req: NextRequest) {
	try {
		const action = req.nextUrl.pathname.split("/").pop(); // gets 'search' or 'updateUserRole'
		const body = await req.json();

		switch (action) {
			case "search":
				return NextResponse.json({
					success: true,
					...(await server.user.searchUser(body)),
				});
			case "updateUserRole":
				return NextResponse.json(await server.user.updateUserRole(body));
			case "addUserLink":
				return NextResponse.json({
					success: true,
					...(await server.user.addUserLink(body)),
				});
			case "removeUserLink":
				return NextResponse.json({
					...(await server.user.removeUserLink(body)),
				});
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

export async function PATCH(req: NextRequest) {
	try {
		const action = req.nextUrl.pathname.split("/").pop();
		const body = await req.json();

		console.log("PATCH action:", body);
		switch (action) {
			case "update-user": {
				const result = await server.user.updateUser(body);
				console.log("Update user result:", result);
				return NextResponse.json(result);
			}
			default:
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("PATCH error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
