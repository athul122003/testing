import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";
import { parseJwtFromAuthHeader } from "~/lib/utils";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		let body: unknown = {};
		if (action !== "getAll") {
			body = await req.json();
		}

		switch (action) {
			case "check-available": {
				const { eventId } = body as { eventId: number };
				if (!eventId) {
					return NextResponse.json(
						{ success: false, error: "Missing eventId" },
						{ status: 400 },
					);
				}

				const isAvailable = await server.event.checkMaxTeamsReached(eventId);
				if (isAvailable === null) {
					return NextResponse.json(
						{ success: false, error: "Failed to check availability" },
						{ status: 500 },
					);
				}
				if (isAvailable.success) {
					return NextResponse.json({ available: true });
				} else {
					return NextResponse.json({ available: false });
				}
			}

			case "getAll": {
				const events = await server.event.getAllEvents();
				return NextResponse.json(events);
			}

			case "registerSolo": {
				const { eventId } = body as { eventId: number };
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const result = await server.event.soloEventReg(data.userId, eventId);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "checkSolo": {
				const { eventId } = body as { eventId: number };
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const result = await server.event.checkSolo(data.userId, eventId);
				return NextResponse.json({ success: result.success, result });
			}

			case "createTeam": {
				const { eventId, teamName } = body as {
					eventId: number;
					teamName: string;
				};

				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const result = await server.event.createTeam(
					data.userId,
					eventId,
					teamName,
				);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "joinTeam": {
				const { teamId, eventId } = body as {
					teamId: string;
					eventId: number;
				};

				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const userId = data.userId;

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
				const { eventId } = body as { userId: number; eventId: number };
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const result = await server.event.getTeam(data.userId, eventId);
				return NextResponse.json(result, {
					status: result.status ? result.status : result.success ? 200 : 400,
				});
			}

			case "confirmTeam": {
				const { teamId } = body as { teamId: string };

				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const userId = data.userId;

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

			case "leaveTeam": {
				const { teamId } = body as { teamId: string };
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				if (!userId || !teamId) {
					return NextResponse.json(
						{ success: false, error: "Missing userId or teamId" },
						{ status: 400 },
					);
				}
				const result = await server.event.leaveTeam(userId, teamId);
				return NextResponse.json(result, {
					status: result.success ? 200 : 400,
				});
			}

			case "deleteTeam": {
				const { teamId } = body as { teamId: string };
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
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

			case "removeMember": {
				const { teamId, memberId } = body as {
					teamId: string;
					memberId: number;
				};
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				if (!userId || !teamId || !memberId) {
					return NextResponse.json(
						{ success: false, error: "Missing userId, teamId or memberId" },
						{ status: 400 },
					);
				}

				const result = await server.event.removeMember(
					teamId,
					memberId,
					userId,
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
