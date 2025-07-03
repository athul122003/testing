export function withCors(handler: (req: Request) => Promise<Response>) {
	return async (req: Request) => {
		const res = await handler(req);

		const headers = new Headers(res.headers);

		const origin = req.headers.get("origin") || "*";
		headers.set("Access-Control-Allow-Origin", origin);
		headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
		headers.set("Access-Control-Allow-Credentials", "true");

		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers,
		});
	};
}
