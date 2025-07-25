import { NextResponse, type NextRequest } from "next/server";
import { server } from "~/actions/serverAction";
import { parseJwtFromAuthHeader } from "~/lib/utils";

export async function POST(req: NextRequest) {
	let body = null;
	const url = new URL(req.url);
	const action = url.pathname.split("/").pop() || "";
	console.log("Payment route action:", action);

	if (["create-order", "save-payment"].includes(action)) {
		body = await req.json();
	}

	try {
		switch (action) {
			case "create-order": {
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				return NextResponse.json(
					await server.payment.createOrder({ ...body, sessionUserId: userId }),
				);
			}
			case "save-payment": {
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}
				const userId = data.userId;
				return NextResponse.json(
					await server.payment.savePayment({ ...body, sessionUserId: userId }),
				);
			}
			default:
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Payment route error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{
				statusText:
					((error as Error).cause as string) || "Internal Server Error",
			},
		);
	}
}
