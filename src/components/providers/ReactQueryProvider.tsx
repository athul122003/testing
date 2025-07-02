"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "~/lib/reactQueryClient"; // 👈 use the shared one

export function ReactQueryProvider({ children }: { children: ReactNode }) {
	// const [queryClient] = useState(() => new QueryClient());    Chutiya Error took me 2 hours Because of this line

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
