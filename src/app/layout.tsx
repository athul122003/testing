import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "~/lib/auth/auth";
import { NextAuthSessionProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "FLC Dashboard",
	description: "A Dashboard to ease the operation of FLC",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	return (
		<html lang="en">
			<body className={inter.className}>
				<NextAuthSessionProvider session={session}>
					{children}
				</NextAuthSessionProvider>
			</body>
		</html>
	);
}
