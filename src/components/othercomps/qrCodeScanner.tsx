import { SetStateAction, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { markAttendanceByScan } from "~/actions/teams";
import { toast } from "sonner";

type QRCodeScannerProps = {
	eventId: number;
	refreshTeams: () => void;
};

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
	eventId,
	refreshTeams,
}) => {
	const [result, setResult] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(true);

	const handleMarkAttendance = async () => {
		if (result) {
			try {
				await markAttendanceByScan(eventId, result);
				refreshTeams();
				toast.success("Attendance marked successfully");
			} catch (error) {
				console.error("Error marking attendance:", error);
				toast.error(`Failed to mark attendance: ${(error as Error).message}`);
				return;
			}
			setResult(null);
		} else {
			alert("No QR Code scanned");
		}
	};

	const stopCamera = () => {
		setIsScanning(false);
	};

	const startCamera = () => {
		setIsScanning(true);
	};

	const clearScanResults = () => {
		setResult(null);
		setError(null);
	};

	return (
		<div className="relative flex flex-col items-center w-full max-w-md mx-auto">
			<div className="w-full aspect-square relative overflow-hidden rounded-lg border border-emerald-900 bg-black">
				<Scanner
					onScan={(detectedCodes: string | any[]) => {
						if (detectedCodes && detectedCodes.length > 0) {
							setResult(detectedCodes[0].rawValue);
						}
					}}
					onError={(error: unknown) => {
						setError(error instanceof Error ? error.message : "Unknown error");
					}}
					paused={!isScanning}
					constraints={{
						facingMode: "environment",
					}}
					components={{
						onOff: false,
						torch: false,
						zoom: false,
						finder: false,
					}}
					styles={{
						container: {
							width: "100%",
							height: "100%",
						},
						video: {
							width: "100%",
							height: "100%",
							objectFit: "cover",
						},
					}}
				/>
			</div>

			{!result && isScanning && (
				<div className="mt-2 text-center text-sm text-gray-400">
					<span className="text-amber-500">Note:</span> If you are not seeing
					the detection, try moving the camera closer to the QR code.
				</div>
			)}
			<div className="mt-4">
				{result && (
					<div className="flex flex-col items-center">
						<Badge color={"info"}>Scanned ID: {result}</Badge>
					</div>
				)}
				{error && !result && <Badge color={"danger"}>Error: {error}</Badge>}
			</div>
			<div className="flex flex-col items-center mt-4">
				<Button
					className="px-4 py-2 rounded-md bg-purple-700 text-white font-semibold shadow hover:bg-emerald-800 transition-colors"
					disabled={!result}
					onClick={() => {
						if (result) {
							handleMarkAttendance();
						}
					}}
				>
					Mark Attendance
				</Button>
			</div>
			<div className="flex gap-2 mt-4">
				{!result && (
					<>
						<Button
							className="px-4 py-2 rounded-md bg-emerald-700 text-white font-semibold shadow hover:bg-emerald-800 transition-colors"
							onClick={() => {
								clearScanResults();
								startCamera();
							}}
						>
							Start Camera
						</Button>
						<Button
							className="px-4 py-2 rounded-md bg-gray-200 text-emerald-900 font-semibold shadow hover:bg-gray-300 transition-colors"
							onClick={stopCamera}
						>
							Stop Camera
						</Button>
					</>
				)}
			</div>
		</div>
	);
};
