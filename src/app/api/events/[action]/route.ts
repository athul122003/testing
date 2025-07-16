import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		let body: unknown = {};
		if (action !== "getAll") {
			body = await req.json();
		}

		switch (action) {
			case "getAll": {
				const events = await server.event.getPublishedEvents();
				return NextResponse.json(events);
			}

			case "registerSolo": {
				const { userId, eventId } = body as { userId: number; eventId: number };

				const result = await server.event.registerUserToSoloEvent(
					userId,
					eventId,
				);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "checkSolo": {
				const { userId, eventId } = body as { userId: number; eventId: number };

				const result = await server.event.checkSolo(userId, eventId);
				console.log("Check Solo Result:", result);
				return NextResponse.json({ success: result.success });
			}

			case "createTeam": {
				const { userId, eventId, teamName } = body as {
					userId: number;
					eventId: number;
					teamName: string;
				};

				const result = await server.event.createTeam(userId, eventId, teamName);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "joinTeam": {
				const { userId, teamId, eventId } = body as {
					userId: number;
					teamId: string;
					eventId: number;
				};

				if (!userId || !teamId) {
					return NextResponse.json(
						{ success: false, error: "Missing userId or teamId" },
						{ status: 400 },
					);
				}

				const result = await server.event.joinTeam(userId, teamId, eventId);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "getTeam": {
				const { userId, eventId } = body as { userId: number; eventId: number };

				const result = await server.event.getTeam(userId, eventId);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "confirmTeam": {
				const { userId, teamId } = body as { userId: number; teamId: string };

				if (!userId || !teamId) {
					return NextResponse.json(
						{ success: false, error: "Missing userId or teamId" },
						{ status: 400 },
					);
				}

				const result = await server.event.confirmTeam(userId, teamId);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "deleteTeam": {
				const { userId, teamId } = body as { userId: number; teamId: string };

				if (!userId || !teamId) {
					return NextResponse.json(
						{ success: false, error: "Missing userId or teamId" },
						{ status: 400 },
					);
				}

				const result = await server.event.deleteTeam(userId, teamId);
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
