"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
	ArrowLeft,
	Download,
	Mail,
	CheckCircle,
	AlertCircle,
	RefreshCw,
	Loader2,
	User,
	Calendar,
} from "lucide-react";
import {
	getEventCertificateList,
	sendCertificateEmail,
} from "../../actions/certificate-management";
import type {
	EventCertificateStatus,
	CertificateStatus,
} from "../../actions/certificate-management";
import { downloadCertificate } from "../../lib/certificate-generator";

interface CertificateMailingStatusProps {
	eventId: number;
	eventName: string;
	onBack: () => void;
}

export default function CertificateMailingStatus({
	eventId,
	eventName,
	onBack,
}: CertificateMailingStatusProps) {
	const [certificateStatus, setCertificateStatus] =
		useState<EventCertificateStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryingCerts, setRetryingCerts] = useState<Set<string>>(new Set());

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			setError(null);

			try {
				const result = await getEventCertificateList(eventId);
				if (result.success && result.data) {
					setCertificateStatus(result.data);
				} else {
					setError(result.error || "Failed to load certificate status");
				}
			} catch (error) {
				console.error("Error loading certificate status:", error);
				setError("Failed to load certificate status");
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [eventId]);

	const loadCertificateStatus = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await getEventCertificateList(eventId);
			if (result.success && result.data) {
				setCertificateStatus(result.data);
			} else {
				setError(result.error || "Failed to load certificate status");
			}
		} catch (error) {
			console.error("Error loading certificate status:", error);
			setError("Failed to load certificate status");
		} finally {
			setLoading(false);
		}
	};

	const retryCertificate = async (certificate: CertificateStatus) => {
		setRetryingCerts((prev) => new Set(prev).add(certificate.id));

		try {
			const result = await sendCertificateEmail(certificate.id);

			if (result.success) {
				// Reload the status
				await loadCertificateStatus();
			} else {
				setError(
					`Failed to resend certificate to ${certificate.userName}: ${result.error}`,
				);
			}
		} catch (error) {
			console.error("Error retrying certificate:", error);
			setError(`Failed to resend certificate to ${certificate.userName}`);
		} finally {
			setRetryingCerts((prev) => {
				const newSet = new Set(prev);
				newSet.delete(certificate.id);
				return newSet;
			});
		}
	};

	const downloadCertificateFile = (certificate: CertificateStatus) => {
		if (certificate.link) {
			downloadCertificate(
				certificate.link,
				`certificate_${certificate.userUsn}_${eventName.replace(/\s+/g, "_")}.png`,
			);
		}
	};

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto space-y-6">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="ghost" onClick={onBack}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
					<h2 className="text-2xl font-bold text-gray-500">
						Certificate Mailing Status - {eventName}
					</h2>
				</div>

				<div className="flex items-center justify-center p-8">
					<div className="text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
						<p className="text-sm text-gray-500">
							Loading certificate status...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (error && !certificateStatus) {
		return (
			<div className="max-w-6xl mx-auto space-y-6">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="ghost" onClick={onBack}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
					<h2 className="text-2xl font-bold text-gray-500">
						Certificate Mailing Status - {eventName}
					</h2>
				</div>

				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>

				<Button onClick={loadCertificateStatus}>
					<RefreshCw className="w-4 h-4 mr-2" />
					Retry
				</Button>
			</div>
		);
	}

	if (!certificateStatus || certificateStatus.totalCertificates === 0) {
		return (
			<div className="max-w-6xl mx-auto space-y-6">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="ghost" onClick={onBack}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
					<h2 className="text-2xl font-bold text-gray-500">
						Certificate Mailing Status - {eventName}
					</h2>
				</div>

				<Card>
					<CardContent className="text-center p-8">
						<Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No Certificates Found
						</h3>
						<p className="text-gray-500">
							No certificates have been generated for this event yet.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="flex items-center gap-4 mb-6">
				<Button variant="ghost" onClick={onBack}>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Button>
				<h2 className="text-2xl font-bold text-gray-500">
					Certificate Mailing Status - {eventName}
				</h2>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<User className="w-5 h-5 text-blue-500" />
							<div>
								<p className="text-2xl font-bold">
									{certificateStatus.totalCertificates}
								</p>
								<p className="text-sm text-gray-600">Total Certificates</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="w-5 h-5 text-green-500" />
							<div>
								<p className="text-2xl font-bold text-green-600">
									{certificateStatus.sentCertificates}
								</p>
								<p className="text-sm text-gray-600">Successfully Sent</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-500" />
							<div>
								<p className="text-2xl font-bold text-red-600">
									{certificateStatus.errorCertificates}
								</p>
								<p className="text-sm text-gray-600">Failed to Send</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Calendar className="w-5 h-5 text-gray-500" />
							<div>
								<p className="text-2xl font-bold text-gray-600">
									{certificateStatus.totalCertificates -
										certificateStatus.sentCertificates}
								</p>
								<p className="text-sm text-gray-600">Pending</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Certificate List */}
			<Card>
				<CardHeader>
					<CardTitle>Certificate Details</CardTitle>
					<CardDescription>
						Individual certificate status and actions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{certificateStatus.certificates.map((certificate) => (
							<div
								key={certificate.id}
								className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
							>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h4 className="font-medium">{certificate.userName}</h4>
										<Badge variant="outline" className="text-xs">
											{certificate.userUsn}
										</Badge>
										<span className="text-sm text-gray-500">
											{certificate.userEmail}
										</span>
									</div>

									<div className="flex items-center gap-4">
										{certificate.statusOfMailing ? (
											<Badge
												variant="default"
												className="bg-green-100 text-green-800"
											>
												<CheckCircle className="w-3 h-3 mr-1" />
												Sent Successfully
											</Badge>
										) : certificate.errorInMailing ? (
											<Badge variant="destructive">
												<AlertCircle className="w-3 h-3 mr-1" />
												Failed to Send
											</Badge>
										) : (
											<Badge variant="secondary">
												<Calendar className="w-3 h-3 mr-1" />
												Pending
											</Badge>
										)}
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => downloadCertificateFile(certificate)}
										disabled={!certificate.link}
									>
										<Download className="w-4 h-4 mr-1" />
										Download
									</Button>

									{(certificate.errorInMailing ||
										!certificate.statusOfMailing) && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => retryCertificate(certificate)}
											disabled={retryingCerts.has(certificate.id)}
										>
											{retryingCerts.has(certificate.id) ? (
												<>
													<Loader2 className="w-4 h-4 mr-1 animate-spin" />
													Sending...
												</>
											) : (
												<>
													<RefreshCw className="w-4 h-4 mr-1" />
													Retry
												</>
											)}
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
