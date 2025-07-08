import type { Session } from "next-auth";
import { auth } from "~/auth/auth";
import { routePermissionMap } from "~/actions/middleware/routePermissions";

// --- Permission check utility ---
function hasPermission(
	session: Session | null | undefined,
	required: string[],
): boolean {
	if (!session?.user) return false;
	const userPerms = session.user.permissions ?? [];
	return required.some((perm) => userPerms.includes(perm));
}

// Base type for any server action
// biome-ignore lint/suspicious/noExplicitAny: Required for generic server action typing
export type AnyServerAction = (...args: any[]) => Promise<any>;

// Optional config to check permissions
interface ProtectedOptions {
	actionName?: string;
}

/**
 * Overload 1: Server action expects session
 */
export function protectedAction<Args extends unknown[], Result>(
	fn: (session: Session, ...args: Args) => Promise<Result>,
	options?: ProtectedOptions,
): (...args: Args) => Promise<Result>;

/**
 * Overload 2: Server action does NOT expect session
 */
export function protectedAction<Args extends unknown[], Result>(
	fn: (...args: Args) => Promise<Result>,
	options?: ProtectedOptions,
): (...args: Args) => Promise<Result>;

/**
 * Unified implementation for both overloads
 */
export function protectedAction<Args extends unknown[], Result>(
	fn:
		| ((session: Session, ...args: Args) => Promise<Result>)
		| ((...args: Args) => Promise<Result>),
	options?: ProtectedOptions,
): (...args: Args) => Promise<Result> {
	return async (...args: Args) => {
		const session = await auth();
		console.log("Session in protectedAction:", session);
		if (!session?.user?.id) {
			throw new Error("Unauthorized: Session is invalid or expired.");
		}

		// ✅ Check permissions if actionName is defined
		const actionName = options?.actionName;
		if (actionName) {
			const requiredPermissions = routePermissionMap[actionName] ?? [];
			if (!hasPermission(session, requiredPermissions)) {
				throw new Error(
					`Forbidden: Missing permission(s): ${requiredPermissions.join(", ")}`,
				);
			}
		}

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
 * Wrap all server actions in protectedAction
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
