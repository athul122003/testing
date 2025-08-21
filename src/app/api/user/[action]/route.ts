import { type NextRequest, NextResponse } from "next/server";
import { server } from "~/actions/serverAction";
import { parseJwtFromAuthHeader } from "~/lib/utils";

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
			case "searchbyId": {
				const slug = parseInt(body.userId, 10);
				return NextResponse.json({
					success: true,
					...(await server.user.searchUserById({ userId: slug })),
				});
			}
			case "updateUserRole":
				return NextResponse.json(await server.user.updateUserRole(body));
			case "addUserLink": {
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				return NextResponse.json({
					success: true,
					...(await server.user.addUserLink({ ...body, userId: userId })),
				});
			}
			case "removeUserLink": {
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				return NextResponse.json({
					...(await server.user.removeUserLink({ ...body, userId: userId })),
				});
			}
			case "getEvents": {
				const events = await server.user.getRegisteredEvents({
					userId: body.userId,
				});
				return NextResponse.json({
					success: true,
					events,
				});
			}
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

		switch (action) {
			case "update-user": {
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				const result = await server.user.updateUser({
					...body,
					userId: userId,
				});
				console.log("Update user result:", result);
				return NextResponse.json(result);
			}
			case "updatepfp": {
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				const { imageUrl } = body;
				if (!imageUrl) {
					return NextResponse.json(
						{ success: false, error: "Image URL is required" },
						{ status: 400 },
					);
				}
				const result = await server.user.updateProfilePicture(userId, imageUrl);
				if (!result.success) {
					return NextResponse.json(
						{ success: false, error: result.error },
						{ status: 500 },
					);
				}
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
