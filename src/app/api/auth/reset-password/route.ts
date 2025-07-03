import jwt, {
	JsonWebTokenError,
	NotBeforeError,
	TokenExpiredError,
} from "jsonwebtoken";
import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeVerificationToken } from "~/lib/auth/auth.service";
import { getUserById, hashPassword } from "~/lib/auth/auth-util";
import { findVerificationTokenById, secrets } from "~/lib/auth/jwt";
import { db } from "~/server/db";

const resetPasswordInputSchema = z
	.object({
		token: z.string().min(1, "Token is required"),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters long"),
		confirmNewPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: "Passwords do not match",
		path: ["confirmNewPassword"],
	});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const input = resetPasswordInputSchema.safeParse(body);

		if (!input.success) {
			return NextResponse.json(
				{ issues: input.error.issues, message: "Validation failed" },
				{ status: 400 },
			);
		}

		const { token, newPassword } = input.data;

		let payload: jwt.JwtPayload;
		try {
			payload = jwt.verify(
				token,
				secrets.JWT_PASSWORD_RESET_SECRET,
			) as jwt.JwtPayload;
		} catch (jwtError) {
			if (jwtError instanceof TokenExpiredError) {
				return NextResponse.json(
					{ message: "Token has expired" },
					{ status: 401 },
				);
			} else if (jwtError instanceof NotBeforeError) {
				return NextResponse.json(
					{ message: "Token not active yet" },
					{ status: 401 },
				);
			} else if (jwtError instanceof JsonWebTokenError) {
				return NextResponse.json({ message: "Invalid token" }, { status: 401 });
			}
			throw jwtError;
		}
		if (!payload.jti) {
			return NextResponse.json(
				{ message: "Token is missing a unique identifier (jti)" },
				{ status: 400 },
			);
		}
		const savedToken = await findVerificationTokenById(payload.jti);

		if (!savedToken || savedToken.revoked === true) {
			return NextResponse.json(
				{ message: "Invalid or revoked token" },
				{ status: 400 },
			);
		}

		const user = await getUserById(payload.userId as number);
		if (!user) {
			return NextResponse.json(
				{ message: "User not found for token" },
				{ status: 404 },
			);
		}

		const hashedPassword = await hashPassword(newPassword);
		if (!hashedPassword) {
			return NextResponse.json(
				{ message: "Failed to hash new password" },
				{ status: 500 },
			);
		}

		const updatedUser = await db.user.update({
			where: {
				id: user.id,
			},
			data: {
				password: hashedPassword,
			},
		});

		await revokeVerificationToken(savedToken.id);

		return NextResponse.json(
			{ user: updatedUser, message: "Password reset successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("API /api/auth/reset-password error:", error);
		return NextResponse.json(
			{ message: "An unexpected error occurred during password reset" },
			{ status: 500 },
		);
	}
}
