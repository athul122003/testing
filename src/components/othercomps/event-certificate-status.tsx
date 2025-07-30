import { useState, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
	Trophy,
	Upload,
	Mail,
	CheckCircle,
	AlertCircle,
	Clock,
	Users,
	FileText,
} from "lucide-react";
import { getEventCertificateStatus } from "../../actions/certificate-management";

interface EventCertificateStatusProps {
	eventId: number;
	eventName: string;
}

type CertificateStatus =
	| "not_started"
	| "uploading"
	| "uploaded"
	| "mailing"
	| "completed"
	| "partial_failure";

interface CertificateStatusData {
	status: CertificateStatus;
	totalCertificates: number;
	uploadedCertificates: number;
	mailedCertificates: number;
	failedMails: number;
}

export default function EventCertificateStatus({
	eventId,
	eventName,
}: EventCertificateStatusProps) {
	const [statusData, setStatusData] = useState<CertificateStatusData | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadStatus = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await getEventCertificateStatus(eventId);
			if (result.success && result.status) {
				setStatusData({
					status: result.status,
					totalCertificates: result.totalCertificates || 0,
					uploadedCertificates: result.uploadedCertificates || 0,
					mailedCertificates: result.mailedCertificates || 0,
					failedMails: result.failedMails || 0,
				});
			} else {
				setError(result.error || "Failed to load certificate status");
			}
		} catch (error) {
			console.error("Error loading certificate status:", error);
			setError("Failed to load certificate status");
		} finally {
			setLoading(false);
		}
	}, [eventId]);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	const getStatusBadge = (status: CertificateStatus) => {
		switch (status) {
			case "not_started":
				return (
					<Badge variant="secondary">
						<Clock className="w-3 h-3 mr-1" />
						Not Started
					</Badge>
				);
			case "uploading":
				return (
					<Badge variant="outline" className="border-blue-500 text-blue-600">
						<Upload className="w-3 h-3 mr-1" />
						Uploading
					</Badge>
				);
			case "mailing":
				return (
					<Badge
						variant="outline"
						className="border-orange-500 text-orange-600"
					>
						<Mail className="w-3 h-3 mr-1" />
						Mailing
					</Badge>
				);
			case "completed":
				return (
					<Badge variant="default" className="bg-green-600">
						<CheckCircle className="w-3 h-3 mr-1" />
						Completed
					</Badge>
				);
			case "partial_failure":
				return (
					<Badge variant="destructive">
						<AlertCircle className="w-3 h-3 mr-1" />
						Partial Failure
					</Badge>
				);
			default:
				return <Badge variant="secondary">Unknown</Badge>;
		}
	};

	const getUploadProgress = () => {
		if (!statusData || statusData.totalCertificates === 0) return 0;
		return (
			(statusData.uploadedCertificates / statusData.totalCertificates) * 100
		);
	};

	const getMailProgress = () => {
		if (!statusData || statusData.uploadedCertificates === 0) return 0;
		return (
			(statusData.mailedCertificates / statusData.uploadedCertificates) * 100
		);
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="text-center text-gray-500">
						Loading certificate status...
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error || !statusData) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trophy className="w-5 h-5" />
						Certificate Status
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center text-red-600">
						{error || "No certificate data available"}
					</div>
					<Button
						onClick={loadStatus}
						variant="outline"
						className="w-full mt-4"
					>
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Trophy className="w-5 h-5" />
						Certificate Status
					</div>
					{getStatusBadge(statusData.status)}
				</CardTitle>
				<CardDescription>{eventName}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Overview Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="text-2xl font-bold text-blue-600">
							{statusData.totalCertificates}
						</div>
						<div className="text-sm text-gray-500 flex items-center justify-center gap-1">
							<Users className="w-3 h-3" />
							Total
						</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-green-600">
							{statusData.uploadedCertificates}
						</div>
						<div className="text-sm text-gray-500 flex items-center justify-center gap-1">
							<Upload className="w-3 h-3" />
							Uploaded
						</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-orange-600">
							{statusData.mailedCertificates}
						</div>
						<div className="text-sm text-gray-500 flex items-center justify-center gap-1">
							<Mail className="w-3 h-3" />
							Mailed
						</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-red-600">
							{statusData.failedMails}
						</div>
						<div className="text-sm text-gray-500 flex items-center justify-center gap-1">
							<AlertCircle className="w-3 h-3" />
							Failed Mails
						</div>
					</div>
				</div>

				{/* Progress Bars */}
				{statusData.status !== "not_started" && (
					<div className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="flex items-center gap-1">
									<Upload className="w-3 h-3" />
									Upload Progress
								</span>
								<span>{Math.round(getUploadProgress())}%</span>
							</div>
							<Progress value={getUploadProgress()} className="w-full" />
						</div>

						{statusData.uploadedCertificates > 0 && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="flex items-center gap-1">
										<Mail className="w-3 h-3" />
										Mail Progress
									</span>
									<span>{Math.round(getMailProgress())}%</span>
								</div>
								<Progress value={getMailProgress()} className="w-full" />
								{statusData.failedMails > 0 && (
									<p className="text-sm text-red-600">
										{statusData.failedMails} mail failures
									</p>
								)}
							</div>
						)}
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2">
					<Button
						onClick={loadStatus}
						variant="outline"
						size="sm"
						className="flex-1"
					>
						Refresh Status
					</Button>
					{statusData.status !== "not_started" && (
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => {
								// Navigate to certificate management page
								window.location.href = `/events/${eventId}/certificates`;
							}}
						>
							<FileText className="w-4 h-4 mr-1" />
							Manage Certificates
						</Button>
					)}
				</div>

				{/* Quick Summary */}
				{statusData.status === "completed" && (
					<div className="border rounded-lg p-4 bg-green-50">
						<div className="flex items-center gap-2 text-green-800">
							<CheckCircle className="w-4 h-4" />
							<span className="font-medium">
								All certificates processed successfully!
							</span>
						</div>
						<p className="text-sm text-green-700 mt-1">
							{statusData.mailedCertificates} certificates have been uploaded
							and mailed to participants.
						</p>
					</div>
				)}

				{statusData.status === "partial_failure" && (
					<div className="border rounded-lg p-4 bg-red-50">
						<div className="flex items-center gap-2 text-red-800">
							<AlertCircle className="w-4 h-4" />
							<span className="font-medium">
								Some certificates failed to process
							</span>
						</div>
						<p className="text-sm text-red-700 mt-1">
							{statusData.failedMails} mail failures detected. Please review and
							retry failed certificates.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
