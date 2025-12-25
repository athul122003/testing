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

		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		const game = await db.$transaction(async (tx) => {
			// 🔹 Try to fetch existing game
			const existingGame = await tx.wordleGame.findUnique({
				where: {
					userId_gameDate: {
						userId,
						gameDate: today,
					},
				},
				include: {
					word: true,
					guesses: {
						orderBy: { createdAt: "asc" },
						select: {
							guess: true,
							result: true,
							createdAt: true,
						},
					},
				},
			});

			if (existingGame) {
				return existingGame;
			}

			// 🔹 Pick unused word
			const usedWordIds = await tx.wordleGame.findMany({
				where: { userId },
				select: { wordId: true },
			});

			const word = await tx.wordleWord.findFirst({
				where: {
					id: { notIn: usedWordIds.map((w) => w.wordId) },
					length: 5,
				},
			});

			if (!word) {
				throw new Error("No unused words left");
			}

			// 🔹 Create new game WITH SAME INCLUDE SHAPE
			return tx.wordleGame.create({
				data: {
					userId,
					wordId: word.id,
					gameDate: today,
				},
				include: {
					word: true,
					guesses: {
						select: {
							guess: true,
							result: true,
							createdAt: true,
						},
					},
				},
			});
		});

		return NextResponse.json({
			success: true,
			data: {
				gameId: game.id,
				gameDate: game.gameDate,
				attemptsUsed: game.attemptsUsed,
				maxAttempts: 5,
				status: game.status,
				wordLength: game.word.length,
				guesses: game.guesses.map((g) => ({
					guess: g.guess,
					result: g.result,
					createdAt: g.createdAt,
				})),
			},
		});
	} catch (error) {
		console.error("API /api/wordle/today error:", error);
		return NextResponse.json(
			{ success: false, error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
