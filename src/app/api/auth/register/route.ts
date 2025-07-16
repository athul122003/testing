import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

const registerInputSchema = z.object({
	userId: z.number(),
	reasonToJoin: z.string().optional(),
	expectations: z.string().optional(),
	contribution: z.string().optional(),
	githubLink: z.string().url("Invalid GitHub URL").optional(),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const input = registerInputSchema.safeParse(body);

		if (!input.success) {
			return NextResponse.json(
				{ issues: input.error.issues, message: "Validation failed" },
				{ status: 400 },
			);
		}

		const { userId, reasonToJoin, expectations, contribution } = input.data;

		await db.user.update({
			where: {
				id: userId,
			},
			data: {
				memberSince: new Date(),
				reasonToJoin,
				expectations,
				contribution,
				role: {
					connect: { name: "MEMBER" },
				},
			},
		});

		return NextResponse.json(
			{ message: "User details registered successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("API /api/auth/register error:", error);
		return NextResponse.json(
			{ message: "An unexpected error occurred during registration" },
			{ status: 500 },
		);
	}
}
