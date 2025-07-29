/** biome-ignore-all lint/suspicious/noExplicitAny: <can be any type> */
import type {
	UseMutationOptions,
	UseMutationResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "./reactQueryClient";

// Utility to detect query function names
function isQueryFunctionName(name: string) {
	return (
		name.startsWith("get") ||
		name.startsWith("fetch") ||
		name.startsWith("search")
	);
}

// Main wrapper
export function withReactQueryHooks<
	T extends Record<string, Record<string, (...args: any[]) => any>>,
>(
	server: T,
): {
	[K in keyof T]: {
		[F in keyof T[K]]: T[K][F] & {
			useQuery: (
				...args: Parameters<T[K][F]>
			) => UseQueryResult<Awaited<ReturnType<T[K][F]>>, unknown>;
			useMutation: (
				options?: UseMutationOptions<
					Awaited<ReturnType<T[K][F]>>,
					unknown,
					Parameters<T[K][F]>[0],
					unknown
				>,
			) => UseMutationResult<
				Awaited<ReturnType<T[K][F]>>,
				unknown,
				Parameters<T[K][F]>[0],
				unknown
			>;
			invalidate: (...args: Parameters<T[K][F]>) => void;
		};
	};
} {
	const wrappedServer = {} as any;

	for (const moduleKey in server) {
		const mod = server[moduleKey];
		const wrappedModule = {} as any;

		for (const fnKey in mod) {
			const fn = mod[fnKey];

			if (typeof fn !== "function") continue;

			const wrappedFn: typeof fn & {
				useQuery?: any;
				useMutation?: any;
				invalidate?: any;
			} = fn;

			const queryKeyBase = [moduleKey, fnKey];

			// If it’s a query function
			if (isQueryFunctionName(fnKey)) {
				wrappedFn.useQuery = (...args: Parameters<typeof fn>) =>
					useQuery({
						queryKey: [...queryKeyBase, ...args],
						queryFn: () => fn(...args),
						placeholderData: undefined,
					});

				wrappedFn.invalidate = async (...args: Parameters<typeof fn>) => {
					const fullKey = [...queryKeyBase, ...args];

					await queryClient.invalidateQueries({
						queryKey: fullKey,
						refetchType: "all",
					});

					await queryClient.refetchQueries({ queryKey: fullKey });

					const matchingQueries = queryClient
						.getQueryCache()
						.findAll({ queryKey: fullKey });

					if (matchingQueries.length === 0) {
						try {
							await fn(...args); // Fire-and-forget manual refetch if needed
						} catch {
							// Silent fail
						}
					}
				};
			} else {
				// If it’s a mutation function

				type UseMutationFn<TFn extends (...args: any[]) => any> = (
					options?: UseMutationOptions<
						Awaited<ReturnType<TFn>>,
						unknown,
						Parameters<TFn>[0],
						unknown
					>,
				) => UseMutationResult<
					Awaited<ReturnType<TFn>>,
					unknown,
					Parameters<TFn>[0],
					unknown
				>;

				wrappedFn.useMutation = ((
					options?: UseMutationOptions<
						Awaited<ReturnType<typeof fn>>,
						unknown,
						Parameters<typeof fn>[0],
						unknown
					>,
				) =>
					useMutation({
						mutationFn: (variables: Parameters<typeof fn>[0]) =>
							Promise.resolve(fn(variables)) as Promise<
								Awaited<ReturnType<typeof fn>>
							>,

						onSuccess: (data, variables, context) => {
							const getAllFn = mod.getAll;
							if (typeof getAllFn === "function") {
								const invalidateKey = [moduleKey, "getAll"];
								queryClient.invalidateQueries({ queryKey: invalidateKey });
								queryClient.refetchQueries({ queryKey: invalidateKey });
							}

							options?.onSuccess?.(data, variables, context);
						},

						onError: options?.onError,
						...options,
					})) as UseMutationFn<typeof fn>;
			}

			wrappedModule[fnKey] = wrappedFn;
		}

		wrappedServer[moduleKey] = wrappedModule;
	}

	return wrappedServer;
}
