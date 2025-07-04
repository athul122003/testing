"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dashboard } from "~/components/dashboard/dashboard-page";

export default function Page() {
	const { data: session } = useSession();

	if (!session) {
		redirect("/auth/login");
	}
	return <Dashboard />;
}
