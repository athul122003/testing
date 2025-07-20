import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function parseJwtFromAuthHeader(authHeader: string): any | null {
	if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
	const token = authHeader.slice(7);
	try {
		const payload = token.split(".")[1];
		const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
		console.log("Decoded JWT Payload:", decoded);
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}
