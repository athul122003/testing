import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop(); // extracts 'getAll', 'getById', etc.

		// Only read body if needed later (not used in getAll)
		if (action !== "getAll") {
			await req.json(); // Read and discard to avoid breaking if someone sends a body
		}

		switch (action) {
			case "getAll": {
				const events = await server.event.getPublishedEvents();
				return NextResponse.json({ success: true, data: events });
			}

			default:
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Public Events API Error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
