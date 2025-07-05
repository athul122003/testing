import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";
import { addPasswordResetTokenToWhitelist } from "~/lib/auth/auth.service";
import { getUserByEmail } from "~/lib/auth/auth-util";
import { generatePasswordResetToken } from "~/lib/auth/jwt";
import { sendPasswordResetEmail } from "~/lib/auth/nodemailer";

const sendPasswordResetInputSchema = z.object({
	email: z.string().email("Invalid email address").toLowerCase(),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const input = sendPasswordResetInputSchema.safeParse(body);

		if (!input.success) {
			return NextResponse.json(
				{ issues: input.error.issues, message: "Validation failed" },
				{ status: 400 },
			);
		}

		const { email } = input.data;
		const existingUser = await getUserByEmail(email);

		if (!existingUser) {
			// Return a generic message for security, don't reveal if user exists
			return NextResponse.json(
				{
					message:
						"If an account with that email exists, a password reset link has been sent.",
				},
				{ status: 200 },
			);
		}

		if (!existingUser.emailVerified) {
			return NextResponse.json(
				{ message: "User not verified. Please verify your email first." },
				{ status: 400 },
			);
		}

		const { id: token } = await addPasswordResetTokenToWhitelist({
			userId: existingUser.id,
		});

		const passwordResetToken = generatePasswordResetToken(existingUser, token);

		// IMPORTANT: Replace with your actual domain
		const url = `${env.NEXTAUTH_URL}/auth/reset-password?token=${passwordResetToken}`;

		await sendPasswordResetEmail(existingUser.email, url, existingUser.name);

		return NextResponse.json(
			{ message: "Password reset email sent" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("API /api/auth/send-password-reset-email error:", error);
		return NextResponse.json(
			{ message: "Failed to send password reset email" },
			{ status: 500 },
		);
	}
}
