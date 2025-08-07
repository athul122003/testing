//import * as cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import { db } from "~/server/db";
import { compareHashedPassword, getUserByEmail } from "./auth-util";
import { hashToken } from "./hashToken";
import { generateTokens } from "./jwt";
import { generateVerificationToken } from "~/lib/auth/jwt";
import { sendVerificationEmail } from "~/lib/auth/nodemailer";

const addVerificationTokenToWhitelist = async ({
	userId,
}: {
	userId: number;
}) => {
	try {
		return await db.verificationToken.create({
			data: {
				userId,
			},
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const addPasswordResetTokenToWhitelist = async ({
	userId,
}: {
	userId: number;
}) => {
	try {
		const token = await db.verificationToken.create({
			data: {
				userId,
				type: "PASSWORD_RESET",
			},
		});
		return token;
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const revokeVerificationToken = async (id: string) => {
	try {
		return await db.verificationToken.update({
			where: {
				id,
			},
			data: {
				revoked: true,
			},
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const addRefreshTokenToWhitelist = async ({
	jti,
	refreshToken,
	userId,
}: {
	jti: string;
	refreshToken: string;
	userId: number;
}) => {
	try {
		return await db.refreshToken.create({
			data: {
				id: jti,
				hashedToken: await hashToken(refreshToken),
				userId,
			},
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const login = async (input: { email: string; password: string }) => {
	try {
		const errors: string[] = [];
		const existingUser = await getUserByEmail(input.email);
		if (!existingUser) {
			errors.push("User not found");
			throw new Error(JSON.stringify(errors));
		}
		const validPassword = await compareHashedPassword(
			input.password,
			existingUser.password,
		);
		if (!validPassword) {
			errors.push("Invalid email or password");
		}
		if (!existingUser.emailVerified) {
			errors.push(
				"Email not verified, sent a verification mail to your email id",
			);
			await sendVerificationEmailMutation(existingUser.email);
		}

		const jti = uuidv4();
		const { accessToken, refreshToken } = generateTokens(existingUser, jti);
		await addRefreshTokenToWhitelist({
			jti,
			refreshToken,
			userId: existingUser.id,
		});

		return {
			errors,
			refreshToken,
			accessToken,
		};
	} catch (error) {
		console.error("Login error:", error);
		throw error;
	}
};

// // eslint-disable-next-line @typescript-eslint/no-misused-promises
// cron.schedule("0 */12 * * *", async () => {
// 	//every 12 hours
// 	await db.refreshToken.deleteMany({
// 		where: {
// 			revoked: true,
// 		},
// 	});
// 	await db.verificationToken.deleteMany({
// 		where: {
// 			revoked: true,
// 		},
// 	});

// 	//deleting non-revoked tokens after their expiry time
// 	const expiryTime = new Date();
// 	expiryTime.setHours(expiryTime.getHours() - 25);

// 	await db.verificationToken.deleteMany({
// 		where: {
// 			revoked: false,
// 			createdAt: {
// 				lte: expiryTime,
// 			},
// 		},
// 	});

// 	console.log("cron job running: deleted revoked tokens");
// });

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

	const url = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
	await sendVerificationEmail(existingUser.email, url, existingUser.name);
};

export {
	addVerificationTokenToWhitelist,
	revokeVerificationToken,
	addRefreshTokenToWhitelist,
	addPasswordResetTokenToWhitelist,
	login,
};
