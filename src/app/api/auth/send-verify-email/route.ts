import { NextResponse } from "next/server";
import { z } from "zod";
import { addVerificationTokenToWhitelist } from "~/lib/auth/auth.service";
import { getUserByEmail } from "~/lib/auth/auth-util";
import { generateVerificationToken } from "~/lib/auth/jwt";
import { sendVerificationEmail } from "~/lib/auth/nodemailer";

const sendVerifyEmailInputSchema = z.object({
	email: z.string().email("Invalid email address").toLowerCase(),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const input = sendVerifyEmailInputSchema.safeParse(body);

		if (!input.success) {
			return NextResponse.json(
				{ issues: input.error.issues, message: "Validation failed" },
				{ status: 400 },
			);
		}

		await sendVerificationEmailMutation(input.data.email);
		return NextResponse.json(
			{ message: "Verification email sent" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("API /api/auth/send-verify-email error:", error);
		return NextResponse.json(
			{ message: "Failed to send verification email" },
			{ status: 500 },
		);
	}
}

const sendVerificationEmailMutation: (email: string) => Promise<void> = async (
	email,
) => {
	const existingUser = await getUserByEmail(email);

	if (!existingUser) throw new Error("USER_NOT_FOUND");

	if (existingUser.emailVerified) throw new Error("USER_ALREADY_VERIFIED");

	const { id: token } = await addVerificationTokenToWhitelist({
		userId: existingUser.id,
	});

	const verificationToken = generateVerificationToken(existingUser, token);

	const url = `https://www.finiteloop.co.in/auth/verify-email?token=${verificationToken}`;

	await sendVerificationEmail(existingUser.email, url, existingUser.name);
};
