import { useState } from "react";
import { useZxing } from "react-zxing";
import { Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type QRCodeScannerProps = {
	eventId: number;
};

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ eventId }) => {
	const [result, setResult] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { ref } = useZxing({
		onResult(result) {
			if (result) {
				setResult(result.getText());
			}
		},
		onError(error) {
			setError(error.message);
		},
	});

	const handleMarkAttendance = () => {
		if (result) {
			setResult(null);
		} else {
			alert("No QR Code scanned");
		}
	};

	const stopCamera = () => {
		const stream = ref.current?.srcObject as MediaStream;
		const tracks = stream?.getTracks();
		tracks?.forEach((track) => {
			track.stop();
		});
	};

	const startCamera = () => {
		// start the camera again
		void navigator.mediaDevices
			.getUserMedia({ video: { facingMode: "environment" } })
			.then((stream) => {
				const video = ref.current;
				if (video) {
					video.srcObject = stream;
				}
			});
	};

	const clearScanResults = () => {
		setResult(null);
		setError(null);
	};
	console.log(result);

	return (
		<div className="relative flex flex-col items-center">
			{/** biome-ignore lint/a11y/useMediaCaption: <explanation> */}
			<video
				className="w-full rounded-lg border border-emerald-900"
				ref={ref as unknown as React.RefObject<HTMLVideoElement>}
			/>
			{!result && (
				<div className="mt-2 text-center text-sm text-gray-400">
					<span className="text-amber-500">Note:</span> Detection is retried
					every 300ms. If you are not seeing the detection, try moving the
					camera closer to the QR code.
				</div>
			)}
			<div className="mt-4">
				{result && (
					<div className="flex flex-col items-center">
						<Badge color={"info"}>Scanned ID: {result}</Badge>
						<div className="m-2">
							<p>H</p>
						</div>
					</div>
				)}
				{error && !result && (
					<Badge color={"danger"}>No QR Code in sight</Badge>
				)}
			</div>
			<div className="flex flex-col items-center mt-4">
				<Button
					className="px-4 py-2 rounded-md bg-emerald-700 text-white font-semibold shadow hover:bg-emerald-800 transition-colors"
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
				{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
				{/* <button
					className="btn btn-primary"
					onClick={() => {
						if (result) {
							clearScanResults();
							startCamera();
						} else {
							stopCamera();
						}
					}}
				>
					{result ? "Clear Scan" : "Start Camera"}
				</button> */}
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
