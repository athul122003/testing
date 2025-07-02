import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "~/lib/auth/auth";
import { db } from "~/server/db";

const registerInputSchema = z.object({
	reasonToJoin: z.string().optional(),
	expectations: z.string().optional(),
	contribution: z.string().optional(),
	githubLink: z.string().url("Invalid GitHub URL").optional(),
});

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const input = registerInputSchema.safeParse(body);

		if (!input.success) {
			return NextResponse.json(
				{ issues: input.error.issues, message: "Validation failed" },
				{ status: 400 },
			);
		}

		const { reasonToJoin, expectations, contribution } = input.data;
		const userId = session.user.id;

		await db.user.update({
			where: {
				id: userId,
			},
			data: {
				memberSince: new Date(),
				reasonToJoin,
				expectations,
				contribution,
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
