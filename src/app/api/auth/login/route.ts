import { getUserByEmail } from "~/lib/auth/auth-util";
import { login } from "~/lib/auth/auth.service";
import { getRegisteredEventCount } from "~/actions/teams";
import { loginZ } from "~/zod/authZ";

export async function POST(req: Request) {
	try {
		const contentType = req.headers.get("content-type") || "";

		let body: Record<string, string>;

		if (contentType.includes("application/json")) {
			body = await req.json();
		} else if (contentType.includes("application/x-www-form-urlencoded")) {
			const text = await req.text();
			body = Object.fromEntries(new URLSearchParams(text));
		} else {
			return new Response(
				JSON.stringify({ message: "Unsupported content type" }),
				{ status: 415, headers: { "Content-Type": "application/json" } },
			);
		}

		const parsed = loginZ.safeParse(body);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({ message: "Invalid input", errors: parsed.error }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const { email, password } = parsed.data;
		const { errors, accessToken, refreshToken } = await login({
			email,
			password,
		});
		if (errors.length > 0) {
			console.log(errors);
			return new Response(JSON.stringify({ message: errors[0] }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		const user = await getUserByEmail(email);
		if (!user) {
			return new Response(JSON.stringify({ message: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const attended = user.Attendance.length;
		const registeredCount = await getRegisteredEventCount(user.id);
		const attendance =
			attended === 0
				? 0
				: registeredCount > 0
					? Math.floor((attended / registeredCount) * 100)
					: 0;

		return new Response(
			JSON.stringify({
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
					userLinks: user.UserLink,
					attendance,
					image: user.image || null,
				},
				accessToken,
				refreshToken,
				accessTokenExpiry: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.log("Login error", error);
		return new Response(JSON.stringify({ message: error }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
}
