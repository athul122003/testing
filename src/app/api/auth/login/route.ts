import { login } from "~/lib/auth/auth.service";
import { getUserByEmail } from "~/lib/auth/auth-util";
import { loginZ } from "~/zod/authZ";

export async function POST(req: Request) {
	try {
		const body = await req.json();

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
		const { accessToken, refreshToken } = await login({ email, password });

		const user = await getUserByEmail(email);
		if (!user) {
			return new Response(JSON.stringify({ message: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.roleId,
				},
				accessToken,
				refreshToken,
			}),
		);
	} catch (error) {
		console.error("Login error", error);
		return new Response(
			JSON.stringify({ message: "Invalid email or password" }),
			{
				status: 401,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
