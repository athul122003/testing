import type { Session } from "next-auth";
import { auth } from "~/auth/auth";
import { routePermissionMap } from "~/actions/middleware/routePermissions";

// ---  Utility to check if session contains at least one of the required permissions ---
function hasPermission(
	session: Session | null | undefined,
	required: string[],
): boolean {
	if (!session?.user) return false;
	const userPerms = session.user.permissions ?? [];
	return required.some((perm) => userPerms.includes(perm));
}

// ---  Server action type definition with generic params ---
export type AnyServerAction = (...args: any[]) => Promise<any>;

// --- Optional config to enable permission-checking ---
interface ProtectedOptions {
	actionName?: string; // Used to map to permissions in routePermissionMap
}

/**
 *  Overload 1: Server action expects session (auth injected)
 */
export function protectedAction<Args extends unknown[], Result>(
	fn: (session: Session, ...args: Args) => Promise<Result>,
	options?: ProtectedOptions,
): (...args: Args) => Promise<Result>;

/**
 *  Overload 2: Server action does NOT expect session
 */
export function protectedAction<Args extends unknown[], Result>(
	fn: (...args: Args) => Promise<Result>,
	options?: ProtectedOptions,
): (...args: Args) => Promise<Result>;

/**
 *  Unified implementation handling both overloads.
 * If function expects a session (based on fn.length), it will be injected.
 */
export function protectedAction<Args extends unknown[], Result>(
	fn:
		| ((session: Session, ...args: Args) => Promise<Result>)
		| ((...args: Args) => Promise<Result>),
	options?: ProtectedOptions,
): (...args: Args) => Promise<Result> {
	return async (...args: Args) => {
		const session = await auth();

		// 🔐 Ensure user is authenticated
		if (!session?.user?.id) {
			throw new Error("Unauthorized: Session is invalid or expired.");
		}

		// 🔒 If actionName is provided, enforce permission check
		const actionName = options?.actionName;
		if (actionName) {
			try {
				const requiredPermissions = routePermissionMap[actionName] ?? [];
				if (!hasPermission(session, requiredPermissions)) {
					throw new Error(`Forbidden: Missing permission(s)`);
				}
			} catch (err) {
				console.error("Error checking permissions:", err);
				throw err;
			}
		}

		// ⚠️ Determine if the wrapped function expects session (by checking its length)
		const expectsSession = fn.length === args.length + 1;

		if (expectsSession) {
			return (fn as (session: Session, ...args: Args) => Promise<Result>)(
				session,
				...args,
			);
		}

		return (fn as (...args: Args) => Promise<Result>)(...args);
	};
}

/**
 *  Utility to wrap an object of actions with `protectedAction`
 * Automatically detects if session is expected and preserves correct typing.
 */
export function protectAllActions<T extends Record<string, AnyServerAction>>(
	actions: T,
): {
	[K in keyof T]: T[K] extends (
		session: Session,
		...args: infer A
	) => Promise<infer R>
		? (...args: A) => Promise<R>
		: T[K] extends (...args: infer A) => Promise<infer R>
			? (...args: A) => Promise<R>
			: never;
} {
	const wrapped = {} as {
		[K in keyof T]: T[K] extends (
			session: Session,
			...args: infer A
		) => Promise<infer R>
			? (...args: A) => Promise<R>
			: T[K] extends (...args: infer A) => Promise<infer R>
				? (...args: A) => Promise<R>
				: never;
	};

	for (const key in actions) {
		wrapped[key] = protectedAction(
			actions[key],
		) as (typeof wrapped)[typeof key];
	}

	return wrapped;
}
