import { NextRequest, NextResponse } from "next/server";
import { server } from "~/action/serverAction";

export async function POST(
	req: NextRequest,
	{ params }: { params: { action: string } },
) {
	try {
		let body = null;

		// Only parse JSON if the action expects a body
		if (["create", "delete", "updatePermissions"].includes(params.action)) {
			body = await req.json();
		}

		switch (params.action) {
			case "getAll":
				return NextResponse.json(await server.role.getAll());

			case "create":
				return NextResponse.json(await server.role.create(body));

			case "delete":
				return NextResponse.json(await server.role.deleteRole(body));

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
