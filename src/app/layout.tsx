// app/layout.tsx (Server Component)
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "~/components/providers/ReactQueryProvider";

export const metadata: Metadata = {
	title: "v0 App",
	description: "Created with v0",
	generator: "v0.dev",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<ReactQueryProvider>
					<Toaster
						position="top-right"
						richColors
						closeButton
						toastOptions={{
							className:
								"mt-11 sm:mt-11 md:mt-10 bg-white text-gray-800 shadow-lg dark:bg-gray-800 dark:text-gray-200",
							style: {
								borderRadius: "8px",
								padding: "16px",
								fontSize: "14px",
							},
						}}
					/>
					{children}
				</ReactQueryProvider>
			</body>
		</html>
	);
}
