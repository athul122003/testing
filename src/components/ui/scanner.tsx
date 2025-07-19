import { signOut, useSession } from "next-auth/react";
import { Button } from "./button";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { QRCodeScanner } from "../othercomps/qrCodeScanner";

export function Scanner() {
	const { data: session } = useSession();
	const [scanning, setScanning] = useState(false);
	const readerRef = useRef<HTMLDivElement | null>(null);

	return (
		<div className="flex flex-col h-full w-full">
			<div className="flex justify-end p-4">
				<Button
					variant="outline"
					className=""
					onClick={async () => {
						try {
							const res = await fetch("/api/auth/revoke", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ userId: session?.user.id }),
							});

							if (!res.ok) {
								throw new Error("Failed to revoke refresh tokens");
							}

							toast.success("Signed out successfully!");
							await signOut({ callbackUrl: "/auth/login" });
						} catch (err) {
							console.error("Sign out failed:", err);
							toast.error("Error signing out");
						}
					}}
				>
					Logout
				</Button>
			</div>

			<QRCodeScanner />
		</div>
	);
}
