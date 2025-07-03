import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "~/lib/auth/auth";
import { addVerificationTokenToWhitelist } from "~/lib/auth/auth.service";
import { getUserByEmail, hashPassword } from "~/lib/auth/auth-util";
import { generateVerificationToken } from "~/lib/auth/jwt";
import { sendVerificationEmail } from "~/lib/auth/nodemailer";
import { db } from "~/server/db";

const signUpInputSchema = z
	.object({
		name: z.string().min(2, "Name is required"),
		email: z.string().email("Invalid email address").toLowerCase(),
		usn: z.string().min(1, "USN is required"),
		phone: z.string().length(10, "Phone number must be 10 digits"),
		branchId: z.string().cuid("Invalid branch ID"),
		year: z.string().min(4, "Graduation year is required"),
		password: z.string().min(8, "Password must be at least 8 characters long"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session) {
			return NextResponse.json(
				{ message: "You are already logged in" },
				{ status: 400 },
			);
		}

		const body = await req.json();
		const input = signUpInputSchema.safeParse(body);

		if (!input.success) {
			return NextResponse.json(
				{ issues: input.error.issues, message: "Validation failed" },
				{ status: 400 },
			);
		}

		const { name, email, usn, phone, branchId, year, password } = input.data;

		const existingUser = await getUserByEmail(email);

		if (existingUser && !existingUser.emailVerified) {
			return NextResponse.json(
				{ message: "Please verify your email and Login" },
				{ status: 400 },
			);
		}

		if (existingUser) {
			return NextResponse.json(
				{ message: "Account already exists" },
				{ status: 400 },
			);
		}

		const hashedPassword = await hashPassword(password);

		if (!hashedPassword) {
			return NextResponse.json(
				{ message: "Something went wrong during password hashing" },
				{ status: 500 },
			);
		}

		let defaultRole = await db.role.findUnique({
			where: { name: "USER" },
		});

		if (!defaultRole) {
			defaultRole = await db.role.create({
				data: { name: "USER" },
			});
		}

		await db.user.create({
			data: {
				name,
				email,
				usn,
				password: hashedPassword,
				phone,
				year,
				Branch: {
					connect: {
						id: branchId,
					},
				},
				role: {
					connect: {
						id: defaultRole.id,
					},
				},
			},
		});

		try {
			await sendVerificationEmailMutation(email);
			return NextResponse.json(
				{ emailSent: true, message: "Verification email sent" },
				{ status: 201 },
			);
		} catch (emailError) {
			console.error("Error sending verification email:", emailError);
			return NextResponse.json(
				{
					emailSent: false,
					message:
						"Signed up successfully, but failed to send verification email",
				},
				{ status: 201 },
			);
		}
	} catch (error) {
		console.error("API /api/auth/signup error:", error);
		return NextResponse.json(
			{ message: "An unexpected error occurred" },
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
