"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dashboard } from "~/components/dashboard/dashboard-page";
import { useIsMobile } from "~/hooks/use-mobile";
import { Scanner } from "~/components/ui/scanner";

export default function Page() {
	const isMobile = useIsMobile();

	const { data: session } = useSession();

	if (!session) {
		redirect("/auth/login");
	}
	// isMobile ? <Scanner /> :
	return <Dashboard />;
}
