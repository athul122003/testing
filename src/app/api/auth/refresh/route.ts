import { refreshToken as refreshTokens } from "~/lib/auth/jwt";
import { db } from "~/server/db";

export async function POST(req: Request) {
	try {
		const { refreshToken, userId } = await req.json();

		if (!refreshToken || !userId) {
			return new Response(JSON.stringify({ message: "Missing fields" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { accessToken, refreshToken: newToken } =
			await refreshTokens(refreshToken);

		const user = await db.user.findUnique({
			where: { id: userId },
			select: { role: true, name: true, email: true },
		});

		if (!user) {
			return new Response(JSON.stringify({ message: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				message: "Token refreshed",
				accessToken,
				refreshToken: newToken,
				user: {
					id: userId,
					role: user.role.name,
					name: user.name,
					email: user.email,
				},
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (e) {
		console.error("Refresh token error:", e);
		return new Response(JSON.stringify({ message: "Refresh failed" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}
}
