import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import type { User, Role, Branch, Attendance, UserLink } from "@prisma/client";

const getUserByEmail = async (
	email: string,
): Promise<
	| (User & { role: Role } & { Branch: Branch | null } & {
			Attendance: Attendance[];
	  } & { UserLink: UserLink[] })
	| null
> => {
	try {
		return await db.user.findUnique({
			where: {
				email,
			},
			include: {
				role: true,
				Branch: true,
				Attendance: true,
				UserLink: true,
			},
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const getUserById = async (
	id: number,
): Promise<
	| (User & { role: Role } & { Branch: Branch | null } & {
			Attendance: Attendance[];
	  } & { UserLink: UserLink[] })
	| null
> => {
	try {
		return await db.user.findUnique({
			where: {
				id,
			},
			include: {
				role: true,
				Branch: true,
				Attendance: true,
				UserLink: true,
			},
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const hashPassword = async (password: string): Promise<string | null> => {
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		if (!hashedPassword) return null;
		return hashedPassword;
	} catch (error) {
		console.log(error);
		return null;
	}
};

const compareHashedPassword = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	try {
		const validPassword = await bcrypt.compare(password, hashedPassword);

		if (!validPassword) throw new Error("WRONG_PASSWORD");

		return validPassword;
	} catch (error) {
		console.error(error);
		throw new Error("SOMETHING_WENT_WRONG");
	}
};

export { getUserByEmail, hashPassword, compareHashedPassword, getUserById };
