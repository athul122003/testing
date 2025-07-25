"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { hashPassword } from "~/lib/auth/auth-util";
import { db } from "~/server/db";

const serverSignUpSchema = z
	.object({
		name: z.string().min(2, "Name is required"),
		email: z.string().email("Invalid email address").toLowerCase(),
		usn: z.string().min(1, "USN is required"),
		phone: z.string().length(10, "Phone number must be 10 digits"),
		branchId: z.string().uuid("Invalid branch ID"),
		year: z.string().min(4, "Graduation year is required"),
		password: z.string().min(8, "Password must be at least 8 characters long"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type SignUpFormInput = z.infer<typeof serverSignUpSchema>;

export async function signUpAction(values: SignUpFormInput) {
	try {
		const validatedData = serverSignUpSchema.parse(values);

		const existingUser = await db.user.findUnique({
			where: { email: validatedData.email },
		});
		if (existingUser) {
			return { success: false, error: "User with this email already exists." };
		}

		const hashedPassword = await hashPassword(validatedData.password);
		if (!hashedPassword) {
			return { success: false, error: "Failed to hash password." };
		}

		let defaultRole = await db.role.findUnique({
			where: { name: "USER" },
		});

		if (!defaultRole) {
			defaultRole = await db.role.create({
				data: { name: "USER" },
			});
		}

		const newUser = await db.user.create({
			data: {
				email: validatedData.email,
				name: validatedData.name,
				usn: validatedData.usn,
				phone: validatedData.phone,
				branchId: validatedData.branchId,
				year: validatedData.year,
				password: hashedPassword,
				roleId: defaultRole.id,
				// image: null,
			},
		});

		return { success: true, user: newUser, emailSent: true };
	} catch (error) {
		console.error("Server Action Sign-up Error:", error);
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Validation failed",
				issues: error.issues,
			};
		}
		return {
			success: false,
			error: "An unexpected error occurred during sign-up.",
		};
	}
}

export async function changePasswordAction(
	currentPassword: string,
	newPassword: string,
	confirmPassword: string,
	userId: number,
) {
	if (newPassword !== confirmPassword) {
		return { success: false, error: "New passwords do not match." };
	}

	const user = await db.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		return { success: false, error: "User not found." };
	}

	const isCurrentPasswordValid = await bcrypt.compare(
		currentPassword,
		user.password,
	);
	if (!isCurrentPasswordValid) {
		return { success: false, error: "Current password is incorrect." };
	}

	const hashedNewPassword = await hashPassword(newPassword);
	if (!hashedNewPassword) {
		return { success: false, error: "Failed to hash new password." };
	}

	await db.user.update({
		where: { id: userId },
		data: { password: hashedNewPassword },
	});

	return { success: true, message: "Password changed successfully." };
}
