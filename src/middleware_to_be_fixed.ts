// THIS FILE IS FOR ACCESS CONTROL SHII, HAS TO BE MODIFIED LATER

// import { jwtVerify } from "jose";
// import { cookies } from "next/headers";
// import { type NextRequest, NextResponse } from "next/server";

// // Match your server-side JWT secrets structure
// const AUTH_SECRET = process.env.AUTH_SECRET;
// const JWT_ACCESS_SECRET = new TextEncoder().encode(`${AUTH_SECRET}access`);

// // Define public routes that don't require authentication
// const PUBLIC_ROUTES = [
// 	"/auth/login",
// 	"/auth/register", // if you have registration
// 	"/forgot-password", // if you have password reset
// ];

// // Define API routes that don't require authentication
// const PUBLIC_API_ROUTES = [
// 	"/api/auth/login",
// 	"/api/auth/register",
// 	"/api/auth/forgot-password",
// 	"/api/health", // health check endpoint
// ];

// // Define protected API routes that require authentication
// const PROTECTED_API_ROUTES = [
// 	"/api/dashboard",
// 	"/api/user",
// 	"/api/admin",
// 	// Add other protected API routes - removed '/' as it's not an API route
// ];

// async function verifyToken(
// 	token: string,
// ): Promise<{ valid: boolean; payload?: any }> {
// 	try {
// 		const { payload } = await jwtVerify(token, JWT_ACCESS_SECRET);
// 		return { valid: true, payload };
// 	} catch (error) {
// 		console.error("Token verification failed:", error);
// 		return { valid: false };
// 	}
// }

// function isPublicRoute(pathname: string): boolean {
// 	return PUBLIC_ROUTES.some((route) => {
// 		if (route === "/") return pathname === "/";
// 		return pathname.startsWith(route);
// 	});
// }

// function isPublicApiRoute(pathname: string): boolean {
// 	return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
// }

// function isProtectedApiRoute(pathname: string): boolean {
// 	return PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));
// }

// export async function middleware(request: NextRequest) {
// 	const { pathname } = request.nextUrl;
// 	const cookieStore = await cookies();

// 	// Get the access token from cookies - adjust cookie names to match your auth implementation
// 	const accessToken =
// 		cookieStore.get("next-auth.session-token")?.value ||
// 		cookieStore.get("auth-token")?.value ||
// 		request.headers.get("authorization")?.replace("Bearer ", "");

// 	console.log(`Middleware: ${request.method} ${pathname}`);

// 	// Skip middleware for static files, _next, and favicon
// 	if (
// 		pathname.startsWith("/_next/") ||
// 		pathname.startsWith("/static/") ||
// 		pathname === "/favicon.ico" ||
// 		pathname.includes(".")
// 	) {
// 		return NextResponse.next();
// 	}

// 	// Handle API routes
// 	if (pathname.startsWith("/api/")) {
// 		// Allow public API routes
// 		if (isPublicApiRoute(pathname)) {
// 			return NextResponse.next();
// 		}

// 		// Protect specific API routes
// 		if (isProtectedApiRoute(pathname)) {
// 			if (!accessToken) {
// 				return NextResponse.json(
// 					{ error: "Authentication required" },
// 					{ status: 401 },
// 				);
// 			}

// 			const { valid, payload } = await verifyToken(accessToken);
// 			if (!valid) {
// 				return NextResponse.json(
// 					{ error: "Invalid or expired token" },
// 					{ status: 401 },
// 				);
// 			}

// 			// Add user info to headers for API routes to use
// 			const requestHeaders = new Headers(request.headers);
// 			requestHeaders.set("x-user-id", payload?.userId?.toString() || "");

// 			return NextResponse.next({
// 				request: {
// 					headers: requestHeaders,
// 				},
// 			});
// 		}

// 		// For other API routes not explicitly defined, protect them by default
// 		if (accessToken) {
// 			const { valid } = await verifyToken(accessToken);
// 			if (!valid) {
// 				return NextResponse.json(
// 					{ error: "Invalid or expired token" },
// 					{ status: 401 },
// 				);
// 			}
// 		} else {
// 			return NextResponse.json(
// 				{ error: "Authentication required" },
// 				{ status: 401 },
// 			);
// 		}

// 		return NextResponse.next();
// 	}

// 	// Handle page routes
// 	const tokenVerification = accessToken
// 		? await verifyToken(accessToken)
// 		: { valid: false };
// 	const isAuthenticated = tokenVerification.valid;

// 	// If user is authenticated and trying to access login page, redirect to dashboard
// 	if (isAuthenticated && pathname === "/auth/login") {
// 		return NextResponse.redirect(new URL("/dashboard", request.url));
// 	}

// 	// If route is public, allow access
// 	if (isPublicRoute(pathname)) {
// 		return NextResponse.next();
// 	}

// 	// For all other routes, require authentication
// 	if (!isAuthenticated) {
// 		// Store the attempted URL to redirect after login
// 		const loginUrl = new URL("/auth/login", request.url);
// 		loginUrl.searchParams.set("callbackUrl", pathname);
// 		return NextResponse.redirect(loginUrl);
// 	}

// 	// User is authenticated, allow access and pass user info to the page
// 	const response = NextResponse.next();
// 	response.headers.set(
// 		"x-user-id",
// 		tokenVerification.payload?.userId?.toString() || "",
// 	);

// 	return response;
// }

// export const config = {
// 	matcher: [
// 		/*
// 		 * Match all request paths except for the ones starting with:
// 		 * - _next/static (static files)
// 		 * - _next/image (image optimization files)
// 		 * - favicon.ico (favicon file)
// 		 */
// 		"/((?!_next/static|_next/image|favicon.ico).*)",
// 	],
// };
