import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { parseJwtFromAuthHeader } from "~/lib/utils";

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		let body: unknown = {};
		body = await req.json();

		switch (action) {
			case "giveflceasterpoints": {
				const { easterEggId } = body as { easterEggId: number };
				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const user = await db.user.findUnique({
					where: { id: data.userId },
					include: { EasterEgg: true },
				});

				if (!user) {
					return NextResponse.json(
						{ success: false, error: "User not found" },
						{ status: 404 },
					);
				}

				const easterEgg = await db.easterEgg.findUnique({
					where: { id: easterEggId },
				});

				if (!easterEgg) {
					return NextResponse.json(
						{ success: false, error: "Easter egg not found" },
						{ status: 404 },
					);
				}

				const existingEgg = await db.user.findFirst({
					where: {
						id: data.userId,
						easterEggId: easterEggId,
					},
				});

				if (existingEgg) {
					return NextResponse.json(
						{ success: false, error: "Easter egg already claimed" },
						{ status: 209 },
					);
				}

				const updatedUser = await db.user.update({
					where: { id: data.userId },
					data: {
						totalActivityPoints: { increment: easterEgg.flcPoints },
						EasterEgg: {
							connect: { id: easterEggId },
						},
					},
					select: {
						totalActivityPoints: true,
					},
				});

				const result = {
					success: true,
					message: `Awarded ${easterEgg.flcPoints} FLC points for finding the easter egg!`,
					totalFLCPoints: updatedUser.totalActivityPoints,
				};

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
