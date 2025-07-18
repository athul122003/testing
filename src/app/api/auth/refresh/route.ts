import { getUserById } from "~/lib/auth/auth-util";
import { refreshToken as refreshTokens } from "~/lib/auth/jwt";

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

		const user = await getUserById(userId);
		if (!user) {
			return new Response(JSON.stringify({ message: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const attended = user.Attendance.length;
		const eventsDone = 0;
		const attendance =
			eventsDone > 0 ? Math.floor((attended / eventsDone) * 100) : 0;

		return new Response(
			JSON.stringify({
				message: "Token refreshed",
				accessToken,
				refreshToken: newToken,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role.name,
					phone: user.phone,
					usn: user.usn,
					branch: user.Branch?.name,
					year: user.year,
					bio: user.bio,
					activityPoints: user.totalActivityPoints,
					attendance,
					image: user.image || null,
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
