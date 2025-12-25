import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { parseJwtFromAuthHeader } from "~/lib/utils";

export async function GET(req: NextRequest) {
	try {
		const customHeader = req.headers.get("authorization");
		const data = parseJwtFromAuthHeader(customHeader || "");

		if (!data || !data.userId) {
			return NextResponse.json(
				{ success: false, error: "Invalid or missing authentication data" },
				{ status: 401 },
			);
		}

		const userId = data.userId;

		const games = await db.wordleGame.findMany({
			where: {
				userId,
			},
			orderBy: {
				gameDate: "desc",
			},
			select: {
				id: true,
				gameDate: true,
				status: true,
				attemptsUsed: true,
				createdAt: true,
			},
		});

		return NextResponse.json({
			success: true,
			data: games.map((game) => ({
				gameId: game.id,
				gameDate: game.gameDate,
				status: game.status,
				attemptsUsed: game.attemptsUsed,
				createdAt: game.createdAt,
			})),
		});
	} catch (error) {
		console.error("API /api/wordle/history error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
