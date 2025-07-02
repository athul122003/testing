import { NextRequest, NextResponse } from "next/server";
import { server } from "~/action/serverAction";

export async function POST(
	req: NextRequest,
	{ params }: { params: { action: string } },
) {
	const body = await req.json();

	try {
		switch (params.action) {
			case "getAll":
				return NextResponse.json(await server.permission.getAll());

			case "create":
				return NextResponse.json(await server.permission.create(body));

			case "delete":
				return NextResponse.json(await server.permission.deletePerm(body));

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
