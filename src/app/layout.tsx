// app/layout.tsx (Server Component)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "~/components/providers/ReactQueryProvider";
import { auth } from "~/lib/auth/auth";
import { NextAuthSessionProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "FLC Dashboard",
	description: "A Dashboard to ease the operation of FLC",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	return (
		<html lang="en">
			<body className={inter.className}>
				<NextAuthSessionProvider session={session}>
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
				</NextAuthSessionProvider>
			</body>
		</html>
	);
}
