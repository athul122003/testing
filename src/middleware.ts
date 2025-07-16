import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	if (request.nextUrl.pathname.startsWith("/api")) {
		const response = NextResponse.next();

		const allowedOrigins = [
			"http://localhost:3000",
			"https://flc-client-25.vercel.app",
		]; // frontend
		const origin = request.headers.get("origin");
		if (origin && allowedOrigins.includes(origin)) {
			response.headers.set("Access-Control-Allow-Origin", origin);
			response.headers.set("Access-Control-Allow-Credentials", "true");
		}

		response.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, OPTIONS",
		);
		response.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		);

		if (request.method === "OPTIONS") {
			return new NextResponse(null, {
				status: 204,
				headers: response.headers,
			});
		}

		return response;
	}

	return NextResponse.next();
}
