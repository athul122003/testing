import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth/auth";
import { parseJwtFromAuthHeader } from "~/lib/utils";

const registerInputSchema = z.object({
	reasonToJoin: z.string().optional(),
	expectations: z.string().optional(),
	contribution: z.string().optional(),
	githubLink: z.string().url("Invalid GitHub URL").optional(),
});

export async function POST(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		const body = await req.json().catch(() => ({})); // catch empty body for 'status'

		switch (action) {
			case "join-flc": {
				const input = registerInputSchema.safeParse(body);

				if (!input.success) {
					return NextResponse.json(
						{ message: "Validation failed", issues: input.error.issues },
						{ status: 400 },
					);
				}

				const customHeader = req.headers.get("authorization");
				const data = parseJwtFromAuthHeader(customHeader || "");
				if (!data || !data.userId) {
					return NextResponse.json(
						{ success: false, error: "Invalid or missing authentication data" },
						{ status: 401 },
					);
				}

				const { reasonToJoin, expectations, contribution } = input.data;
				const userId = data.userId;

				await db.user.update({
					where: { id: userId },
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
			}

			case "update-status": {
				const session = await getServerSession(authOptions);

				if (!session || !session.user) {
					return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
				}

				if (session.user.role.name !== "ADMIN") {
					return NextResponse.json({ error: "Forbidden" }, { status: 403 });
				}

				const updateSchema = z.object({
					value: z.boolean(),
				});

				const result = updateSchema.safeParse(body);

				if (!result.success) {
					return NextResponse.json(
						{ message: "Validation failed", issues: result.error.issues },
						{ status: 400 },
					);
				}

				const { value } = result.data;

				const setting = await db.settings.findUnique({
					where: { name: "registrationsOpen" },
				});

				if (!setting) {
					return NextResponse.json(
						{ success: false, message: `Setting '${name}' not found` },
						{ status: 404 },
					);
				}

				const updated = await db.settings.update({
					where: { name: "registrationsOpen" },
					data: { status: value },
				});

				return NextResponse.json({
					success: true,
					message: `Setting registrationsOpen updated to ${value}`,
					status: updated.status,
				});
			}
		}
	} catch (error) {
		console.error("API /api/auth error:", error);
		return NextResponse.json(
			{ message: "An unexpected error occurred during request" },
			{ status: 500 },
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		if (action === "status") {
			const setting = await db.settings.findUnique({
				where: { name: "registrationsOpen" },
			});

			if (!setting) {
				return NextResponse.json(
					{ success: false, error: "Setting not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json({
				success: true,
				status: setting.status,
				description: setting.description ?? null,
			});
		}

		return NextResponse.json(
			{ message: "Invalid GET action" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("API /api/auth error:", error);
		return NextResponse.json(
			{ message: "An unexpected error occurred during request" },
			{ status: 500 },
		);
	}
}
