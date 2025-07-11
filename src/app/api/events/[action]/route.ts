import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		let body: any = {};
		if (action !== "getAll") {
			body = await req.json();
		}

		switch (action) {
			case "getAll": {
				const events = await server.event.getPublishedEvents();
				return NextResponse.json(events);
			}

			case "registerSolo": {
				const { userId, eventId } = body;

				const result = await server.event.registerUserToSoloEvent(
					userId,
					eventId,
				);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
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
