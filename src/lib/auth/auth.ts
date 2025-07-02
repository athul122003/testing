import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { GetServerSidePropsContext } from "next";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Role, User } from "~/../generated/prisma";
import { loginZ } from "~/zod/authZ";
import { db } from "../db";
import { login } from "./auth.service";
import { getUserByEmail } from "./auth-util";
import { getRefreshTokenExpiry, isJwtExpired, rotateTokens } from "./jwt";

declare module "next-auth" {
	interface User {
		accessToken: string;
		refreshToken: string;
		id: number;
		name: string;
		email: string;
		image?: string | null;
		phone: string;
		role: Role;
	}

	interface AdapterUser {
		accessToken: string;
		refreshToken: string;
		id: number;
		name: string;
		email: string;
		image?: string | null;
		phone: string;
		role: Role;
	}

	interface Session {
		user: {
			id: number;
			name: string;
			email: string;
			image?: string | null;
			role: Role;
			phone: string;
			accessToken: string;
			refreshToken: string;
		};
		accessToken: string;
	}
}
declare module "next-auth/jwt" {
	interface JWT {
		id: number;
		name: string;
		email: string;
		image?: string | null;
		role: Role;
		phone: string;

		iat: number;
		exp: number;
		accessToken: string;
		refreshToken: string;
	}
}

export const authOptions: NextAuthOptions = {
	callbacks: {
		// biome-ignore lint/suspicious/noExplicitAny: explain this????
		async jwt({ token, user, trigger, session }): Promise<any> {
			if (!token.sub) return token;
			if (user && trigger === "signIn") {
				token = {
					...token,
					sub: user.id as unknown as string,
					name: user.name,
					email: user.email,
					role: user.role,
					phone: user.phone,
					accessToken: user.accessToken,
					refreshToken: user.refreshToken,
					iat: Math.floor(Date.now() / 1000),
					exp: getRefreshTokenExpiry(user.refreshToken),
				};
				return token;
			}

			if (trigger === "update" && session) {
				token = {
					...token,
					accessToken: session.accessToken,
				};
				return token;
			}

			if (isJwtExpired(String(token.accessToken))) {
				const [newAccessToken, newRefreshToken] = await rotateTokens(
					String(token.refreshToken),
				);
				if (newAccessToken && newRefreshToken) {
					token = {
						...token,
						accessToken: newAccessToken,
						refreshToken: newRefreshToken,
						exp: getRefreshTokenExpiry(newRefreshToken),
					};
					if (token.accessToken === newAccessToken) return token;
				}
				return null;
			}

			return token;
		},
		async session({ session, token }) {
			if (token.sub && session.user) {
				session.user.id = parseInt(token.sub);
				session.user.name = token.name;
				session.user.email = token.email;
				session.user.role = token.role;
				session.user.phone = token.phone;
				session.accessToken = token.accessToken;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
		maxAge: 7 * 24 * 60 * 60, // 7 days
	},
	adapter: PrismaAdapter(db) as Adapter,
	providers: [
		CredentialsProvider({
			credentials: {},
			// biome-ignore lint/suspicious/noExplicitAny: usage required for CredentialsProvider
			async authorize(credentials: any): Promise<any> {
				const validateFields = loginZ.safeParse(credentials);
				if (!validateFields.success) return null;
				const { email, password } = validateFields.data;
				const data = await login({ email, password });
				if (!data) return null;
				const { accessToken, refreshToken } = data;
				const existingUser: User | null = await getUserByEmail(email);
				if (!existingUser) return null;
				const passwordMatch = await bcrypt.compare(
					password,
					existingUser.password,
				);
				if (!passwordMatch) return null;
				const user = {
					...existingUser,
					refreshToken: refreshToken,
					accessToken: accessToken,
				};
				return user;
			},
		}),
	],
};

export const getServerAuthSession = (ctx: {
	req: GetServerSidePropsContext["req"];
	res: GetServerSidePropsContext["res"];
}) => {
	return getServerSession(ctx.req, ctx.res, authOptions);
};

// export const getServerAuthSession = (ctx: {
// 	req: GetServerSidePropsContext["req"];
// 	res: GetServerSidePropsContext["res"];
// }) => {
// 	return getServerSession(ctx.req, ctx.res, authOptions);
// };

export const auth = (
	...args:
		| [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
		| []
) => {
	if (args.length === 2) {
		return getServerSession(args[0], args[1], authOptions);
	}
	return getServerSession(authOptions);
};
