import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop(); // Extracts `action` from the URL

		let body = null;

		// Only parse JSON if the action expects a body
		if (action && ["create", "delete", "updatePermissions"].includes(action)) {
			body = await req.json();
		}

		switch (action) {
			case "getAll":
				return NextResponse.json(await server.role.getAll());

			// case "create":
			// 	return NextResponse.json(await server.role.create(body)); TODO [PARIPOORNA] FIX THIS

			// case "delete":
			// 	return NextResponse.json(await server.role.deleteRole(body));	TODO [PARIPOORNA] FIX THIS

			case "updatePermissions":
				return NextResponse.json(await server.role.updateRolePermissions(body));

			default:
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Role route error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
