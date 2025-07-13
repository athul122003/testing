import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { GetServerSidePropsContext } from "next";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { login } from "~/lib/auth/auth.service";
import { getUserByEmail } from "~/lib/auth/auth-util";
import { db } from "~/server/db";
import { loginZ } from "~/zod/authZ";
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
		permissions?: string[]; // 🔐 Added for role/permissions
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
		permissions?: string[]; // 🔐 Added for role/permissions
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
			permissions?: string[]; // 🔐 Added for role/permissions
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
		permissions?: string[]; // 🔐 Added for role/permissions
	}
}

export const authOptions: NextAuthOptions = {
	callbacks: {
		// biome-ignore lint/suspicious/noExplicitAny: explain this????
		async jwt({ token, user, trigger, session }): Promise<any> {
			if (!token.sub) return token;

			// 🔧 Ensure permissions are extracted from user if present at signIn
			if (user && trigger === "signIn") {
				const permissions =
					(
						user.role as Role & {
							permissions?: { permission: { name: string } }[];
						}
					)?.permissions?.map((rp) => rp.permission.name) ?? [];

				token = {
					...token,
					sub: user.id.toString(),
					name: user.name,
					email: user.email,
					role: user.role,
					phone: user.phone,
					accessToken: user.accessToken,
					refreshToken: user.refreshToken,
					permissions,
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
				// Do not return null — we handle invalidation elsewhere
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
				session.user.permissions = token.permissions ?? []; // 🔐 Added for role/permissions
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
				try {
					const validateFields = loginZ.safeParse(credentials);
					if (!validateFields.success) return null;

					let { email, password } = validateFields.data;
					email = email.toLowerCase(); // ✅ Convert to lowercase

					const data = await login({ email, password });
					if (!data) return null;

					const { accessToken, refreshToken } = data;

					const existingUser = await db.user.findUnique({
						where: { email },
						include: {
							role: {
								include: {
									permissions: {
										include: {
											permission: true,
										},
									},
								},
							},
						},
					});

					if (!existingUser) return null;

					const passwordMatch = await bcrypt.compare(
						password,
						existingUser.password,
					);
					if (!passwordMatch) return null;

					const user = {
						...existingUser,
						refreshToken,
						accessToken,
					} as User & {
						role: Role & {
							permissions: { permission: { name: string } }[];
						};
					};

					return user;
				} catch {
					return null;
				}
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
