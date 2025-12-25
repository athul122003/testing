import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { parseJwtFromAuthHeader } from "~/lib/utils";
import { evaluateGuess } from "~/lib/evaluateGuess";

const WORDLE_WIN_POINTS = 10;

export async function POST(req: NextRequest) {
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

		const body = (await req.json()) as {
			gameId?: string;
			guess?: string;
		};

		if (typeof body.gameId !== "string" || typeof body.guess !== "string") {
			return NextResponse.json(
				{ success: false, error: "Missing gameId or guess" },
				{ status: 400 },
			);
		}

		const gameId = body.gameId;
		const guess = body.guess.toLowerCase().trim();

		const game = await db.wordleGame.findUnique({
			where: { id: gameId },
			include: { word: true },
		});

		if (!game || game.userId !== userId) {
			return NextResponse.json(
				{ success: false, error: "Invalid game" },
				{ status: 403 },
			);
		}

		if (game.status !== "IN_PROGRESS") {
			return NextResponse.json(
				{ success: false, error: "Game already finished" },
				{ status: 400 },
			);
		}

		if (game.attemptsUsed >= 5) {
			return NextResponse.json(
				{ success: false, error: "No attempts left" },
				{ status: 400 },
			);
		}

		if (guess.length !== game.word.length) {
			return NextResponse.json(
				{ success: false, error: "Invalid guess length" },
				{ status: 400 },
			);
		}

		const result = evaluateGuess(game.word.word, guess);
		const isCorrect = result.every((r) => r === "correct");

		const nextStatus = isCorrect
			? "WON"
			: game.attemptsUsed + 1 >= 5
				? "LOST"
				: "IN_PROGRESS";

		const updatedGame = await db.$transaction(async (tx) => {
			await tx.wordleGuess.create({
				data: {
					gameId: game.id,
					guess,
					result,
				},
			});

			const updated = await tx.wordleGame.update({
				where: { id: game.id },
				data: {
					attemptsUsed: { increment: 1 },
					status: nextStatus,
				},
			});

			if (nextStatus === "WON") {
				await tx.user.update({
					where: { id: userId },
					data: {
						totalActivityPoints: {
							increment: WORDLE_WIN_POINTS,
						},
					},
				});
			}

			return updated;
		});

		return NextResponse.json({
			success: true,
			data: {
				result,
				attemptsUsed: updatedGame.attemptsUsed,
				status: updatedGame.status,
				pointsAwarded: nextStatus === "WON" ? WORDLE_WIN_POINTS : 0,
			},
		});
	} catch (error) {
		console.error("API /api/wordle/guess error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
