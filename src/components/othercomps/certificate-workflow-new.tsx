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
import { Progress } from "../ui/progress";
import {
	Download,
	Upload,
	Mail,
	CheckCircle,
	AlertCircle,
	Trophy,
	Loader2,
	RefreshCw,
	ExternalLink,
} from "lucide-react";
import { downloadCertificate } from "../../lib/certificate-generator";
import {
	uploadCertificateToCloudinary,
	sendCertificateEmail,
	clearAllCertificates,
} from "../../actions/certificate-management";

import type { CertificateWithStatus } from "../../actions/certificate-management";

interface CertificateWorkflowProps {
	onBack: () => void;
	eventId: number;
	participants: Array<{
		id: number;
		usn: string;
		name: string;
		email: string;
		position?: string;
	}>;
	generatedCertificates: Array<{
		usn: string;
		name: string;
		email: string;
		certificateUrl: string;
		filename?: string;
		prizeType?: string;
	}>;
}

type WorkflowStep = "confirm" | "upload" | "mail";

export default function CertificateWorkflow({
	onBack,
	eventId,
	participants,
	generatedCertificates,
}: CertificateWorkflowProps) {
	const [currentStep, setCurrentStep] = useState<WorkflowStep>("confirm");
	const [certificates, setCertificates] = useState<CertificateWithStatus[]>([]);

	// Upload state
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	// Mail state
	const [mailing, setMailing] = useState(false);
	const [mailProgress, setMailProgress] = useState(0);

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Convert generated certificates to workflow format
		const workflowCerts: CertificateWithStatus[] = generatedCertificates.map(
			(cert) => ({
				usn: cert.usn,
				name: cert.name,
				email: cert.email,
				certificateUrl: cert.certificateUrl,
				filename: cert.filename,
				prizeType: cert.prizeType,
				uploading: false,
				uploaded: false,
				mailing: false,
				mailed: false,
			}),
		);
		setCertificates(workflowCerts);
	}, [generatedCertificates]);

	const uploadCertificates = async () => {
		if (certificates.length === 0) return;

		setUploading(true);
		setUploadProgress(0);
		setError(null);

		try {
			await clearAllCertificates({ eventId });
			for (let i = 0; i < certificates.length; i++) {
				const cert = certificates[i];

				// Update UI to show this certificate is uploading
				setCertificates((prev) =>
					prev.map((c) => (c.usn === cert.usn ? { ...c, uploading: true } : c)),
				);

				// Determine certificate type
				let certificateType:
					| "WINNER"
					| "RUNNER_UP"
					| "SECOND_RUNNER_UP"
					| "PARTICIPATION";
				switch (cert.prizeType) {
					case "WINNER":
						certificateType = "WINNER";
						break;
					case "RUNNER_UP":
						certificateType = "RUNNER_UP";
						break;
					case "SECOND_RUNNER_UP":
						certificateType = "SECOND_RUNNER_UP";
						break;
					default:
						certificateType = "PARTICIPATION";
				}

				// Find participant ID by USN
				const participant = participants.find((p) => p.usn === cert.usn);
				if (!participant) {
					setCertificates((prev) =>
						prev.map((c) =>
							c.usn === cert.usn
								? {
										...c,
										uploading: false,
										uploaded: false,
										uploadError: "Participant not found",
									}
								: c,
						),
					);
					continue;
				}

				// Upload to Cloudinary
				const uploadResult = await uploadCertificateToCloudinary(
					eventId,
					participant.id,
					cert.certificateUrl,
					cert.filename || "certificate.png",
					certificateType,
				);

				// Update certificate status
				setCertificates((prev) =>
					prev.map((c) =>
						c.usn === cert.usn
							? {
									...c,
									uploading: false,
									uploaded: uploadResult.success,
									uploadError: uploadResult.error,
									cloudinaryUrl: uploadResult.url,
									certificateId: uploadResult.certificateId,
								}
							: c,
					),
				);

				setUploadProgress(((i + 1) / certificates.length) * 100);
			}

			// Check if all uploads were successful
			const allUploaded = certificates.every((cert) => cert.uploaded);
			if (allUploaded) {
				setCurrentStep("mail");
			}
		} catch (error) {
			console.error("Certificate upload error:", error);
			setError("Failed to upload certificates");
		} finally {
			setUploading(false);
		}
	};

	const startMailing = async () => {
		const uploadedCertificates = certificates.filter(
			(cert) => cert.uploaded && cert.certificateId,
		);

		if (uploadedCertificates.length === 0) return;

		setMailing(true);
		setMailProgress(0);
		setError(null);

		try {
			for (let i = 0; i < uploadedCertificates.length; i++) {
				const cert = uploadedCertificates[i];

				// Update UI to show this certificate is being mailed
				setCertificates((prev) =>
					prev.map((c) => (c.usn === cert.usn ? { ...c, mailing: true } : c)),
				);

				// Send email
				const mailResult = await sendCertificateEmail(cert.certificateId || "");

				// Update certificate status
				setCertificates((prev) =>
					prev.map((c) =>
						c.usn === cert.usn
							? {
									...c,
									mailing: false,
									mailed: mailResult.success,
									mailError: mailResult.error,
								}
							: c,
					),
				);

				setMailProgress(((i + 1) / uploadedCertificates.length) * 100);
			}
		} catch (error) {
			console.error("Certificate mailing error:", error);
			setError("Failed to send certificates");
		} finally {
			setMailing(false);
		}
	};

	const retryUpload = async (cert: CertificateWithStatus) => {
		// Find participant ID by USN
		const participant = participants.find((p) => p.usn === cert.usn);
		if (!participant) return;

		setCertificates((prev) =>
			prev.map((c) =>
				c.usn === cert.usn
					? { ...c, uploading: true, uploadError: undefined }
					: c,
			),
		);

		let certificateType:
			| "WINNER"
			| "RUNNER_UP"
			| "SECOND_RUNNER_UP"
			| "PARTICIPATION";
		switch (cert.prizeType) {
			case "WINNER":
				certificateType = "WINNER";
				break;
			case "RUNNER_UP":
				certificateType = "RUNNER_UP";
				break;
			case "SECOND_RUNNER_UP":
				certificateType = "SECOND_RUNNER_UP";
				break;
			default:
				certificateType = "PARTICIPATION";
		}

		const uploadResult = await uploadCertificateToCloudinary(
			eventId,
			participant.id,
			cert.certificateUrl,
			cert.filename || "certificate.png",
			certificateType,
		);

		setCertificates((prev) =>
			prev.map((c) =>
				c.usn === cert.usn
					? {
							...c,
							uploading: false,
							uploaded: uploadResult.success,
							uploadError: uploadResult.error,
							cloudinaryUrl: uploadResult.url,
							certificateId: uploadResult.certificateId,
						}
					: c,
			),
		);
	};

	const retryMail = async (cert: CertificateWithStatus) => {
		if (!cert.certificateId) return;

		setCertificates((prev) =>
			prev.map((c) =>
				c.usn === cert.usn ? { ...c, mailing: true, mailError: undefined } : c,
			),
		);

		const mailResult = await sendCertificateEmail(cert.certificateId);

		setCertificates((prev) =>
			prev.map((c) =>
				c.usn === cert.usn
					? {
							...c,
							mailing: false,
							mailed: mailResult.success,
							mailError: mailResult.error,
						}
					: c,
			),
		);
	};

	const downloadAll = () => {
		certificates.forEach((cert) => {
			downloadCertificate(
				cert.certificateUrl,
				cert.filename || "certificate.png",
			);
		});
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					Certificate Upload & Mail
				</h2>
				<p className="text-gray-600">
					Upload certificates to cloud storage and send to participants
				</p>
			</div>

			{/* Progress Steps */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<div
							className={`flex items-center gap-2 ${currentStep === "confirm" ? "text-blue-600" : currentStep === "upload" || currentStep === "mail" ? "text-green-600" : "text-gray-400"}`}
						>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentStep === "confirm" ? "bg-blue-600" : currentStep === "upload" || currentStep === "mail" ? "bg-green-600" : "bg-gray-400"}`}
							>
								{currentStep === "confirm" ? (
									"1"
								) : (
									<CheckCircle className="w-5 h-5" />
								)}
							</div>
							<span className="font-medium">Confirm Upload</span>
						</div>
						<div
							className={`flex items-center gap-2 ${currentStep === "upload" ? "text-blue-600" : currentStep === "mail" ? "text-green-600" : "text-gray-400"}`}
						>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentStep === "upload" ? "bg-blue-600" : currentStep === "mail" ? "bg-green-600" : "bg-gray-400"}`}
							>
								{currentStep === "upload" ? (
									"2"
								) : currentStep === "mail" ? (
									<CheckCircle className="w-5 h-5" />
								) : (
									"2"
								)}
							</div>
							<span className="font-medium">Upload</span>
						</div>
						<div
							className={`flex items-center gap-2 ${currentStep === "mail" ? "text-blue-600" : "text-gray-400"}`}
						>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentStep === "mail" ? "bg-blue-600" : "bg-gray-400"}`}
							>
								3
							</div>
							<span className="font-medium">Mail</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Step Content */}
			{currentStep === "confirm" && (
				<Card>
					<CardHeader>
						<CardTitle>Ready to Upload</CardTitle>
						<CardDescription>
							{certificates.length} certificates are ready to upload to cloud
							storage
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{certificates.length}
								</div>
								<div className="text-sm text-gray-500">Total Certificates</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{
										certificates.filter(
											(c) => c.prizeType && c.prizeType !== "PARTICIPATION",
										).length
									}
								</div>
								<div className="text-sm text-gray-500">Prize Winners</div>
							</div>
						</div>

						<div className="flex gap-4">
							<Button
								onClick={() => setCurrentStep("upload")}
								className="flex-1"
								size="lg"
							>
								<Upload className="w-4 h-4 mr-2" />
								Start Upload Process
							</Button>
							<Button
								onClick={downloadAll}
								variant="outline"
								className="flex-1"
							>
								<Download className="w-4 h-4 mr-2" />
								Download All First
							</Button>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>
			)}

			{currentStep === "upload" && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Upload className="w-5 h-5" />
								Upload to Cloudinary
							</CardTitle>
							<CardDescription>
								Upload certificates to cloud storage
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{certificates.length}
									</div>
									<div className="text-sm text-gray-500">
										Total Certificates
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{certificates.filter((c) => c.uploaded).length}
									</div>
									<div className="text-sm text-gray-500">Uploaded</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">
										{certificates.filter((c) => c.uploading).length}
									</div>
									<div className="text-sm text-gray-500">Uploading</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-red-600">
										{certificates.filter((c) => c.uploadError).length}
									</div>
									<div className="text-sm text-gray-500">Failed</div>
								</div>
							</div>

							{uploading && (
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Uploading certificates...</span>
										<span>{Math.round(uploadProgress)}%</span>
									</div>
									<Progress value={uploadProgress} className="w-full" />
								</div>
							)}

							<div className="flex gap-4">
								<Button
									onClick={uploadCertificates}
									disabled={uploading || certificates.length === 0}
									className="flex-1"
									size="lg"
								>
									{uploading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload className="w-4 h-4 mr-2" />
											Upload All Certificates
										</>
									)}
								</Button>
								<Button
									onClick={downloadAll}
									variant="outline"
									className="flex-1"
								>
									<Download className="w-4 h-4 mr-2" />
									Download All
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Individual Certificate Status */}
					<Card>
						<CardHeader>
							<CardTitle>Upload Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{certificates.map((cert) => (
									<div
										key={cert.usn}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<div>
													<p className="font-medium">{cert.name}</p>
													<p className="text-sm text-gray-500">{cert.usn}</p>
												</div>
												<div className="flex items-center gap-2">
													{cert.prizeType &&
														cert.prizeType !== "PARTICIPATION" && (
															<Badge variant="secondary">
																<Trophy className="w-3 h-3 mr-1" />
																{cert.prizeType}
															</Badge>
														)}
													{cert.uploading && (
														<Badge variant="outline">
															<Loader2 className="w-3 h-3 mr-1 animate-spin" />
															Uploading...
														</Badge>
													)}
													{cert.uploaded && (
														<Badge variant="default" className="bg-green-600">
															<CheckCircle className="w-3 h-3 mr-1" />
															Uploaded
														</Badge>
													)}
													{cert.uploadError && (
														<Badge variant="destructive">
															<AlertCircle className="w-3 h-3 mr-1" />
															Failed
														</Badge>
													)}
												</div>
											</div>
											{cert.uploadError && (
												<p className="text-sm text-red-600 mt-1">
													{cert.uploadError}
												</p>
											)}
										</div>
										<div className="flex items-center gap-2">
											{cert.uploadError && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => retryUpload(cert)}
													disabled={cert.uploading}
												>
													<RefreshCw className="w-4 h-4" />
												</Button>
											)}
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													downloadCertificate(
														cert.certificateUrl,
														cert.filename || "certificate.png",
													)
												}
											>
												<Download className="w-4 h-4" />
											</Button>
											{cert.cloudinaryUrl && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														window.open(cert.cloudinaryUrl, "_blank")
													}
												>
													<ExternalLink className="w-4 h-4" />
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Next Step Button */}
					{certificates.some((c) => c.uploaded) && (
						<Card>
							<CardContent className="pt-6">
								<Button
									onClick={() => setCurrentStep("mail")}
									className="w-full"
									size="lg"
								>
									Continue to Mailing
								</Button>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{currentStep === "mail" && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mail className="w-5 h-5" />
								Send Certificates via Email
							</CardTitle>
							<CardDescription>
								Send certificates to participants' email addresses
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{certificates.filter((c) => c.uploaded).length}
									</div>
									<div className="text-sm text-gray-500">Ready to Mail</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{certificates.filter((c) => c.mailed).length}
									</div>
									<div className="text-sm text-gray-500">Sent</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">
										{certificates.filter((c) => c.mailing).length}
									</div>
									<div className="text-sm text-gray-500">Sending</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-red-600">
										{certificates.filter((c) => c.mailError).length}
									</div>
									<div className="text-sm text-gray-500">Failed</div>
								</div>
							</div>

							{mailing && (
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Sending certificates...</span>
										<span>{Math.round(mailProgress)}%</span>
									</div>
									<Progress value={mailProgress} className="w-full" />
								</div>
							)}

							<Button
								onClick={startMailing}
								disabled={
									mailing || certificates.filter((c) => c.uploaded).length === 0
								}
								className="w-full"
								size="lg"
							>
								{mailing ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Sending...
									</>
								) : (
									<>
										<Mail className="w-4 h-4 mr-2" />
										Start Mailing
									</>
								)}
							</Button>
						</CardContent>
					</Card>

					{/* Individual Mailing Status */}
					<Card>
						<CardHeader>
							<CardTitle>Mailing Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{certificates
									.filter((c) => c.uploaded)
									.map((cert) => (
										<div
											key={cert.usn}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex-1">
												<div className="flex items-center gap-3">
													<div>
														<p className="font-medium">{cert.name}</p>
														<p className="text-sm text-gray-500">
															{cert.email}
														</p>
													</div>
													<div className="flex items-center gap-2">
														{cert.prizeType &&
															cert.prizeType !== "PARTICIPATION" && (
																<Badge variant="secondary">
																	<Trophy className="w-3 h-3 mr-1" />
																	{cert.prizeType}
																</Badge>
															)}
														{cert.mailing && (
															<Badge variant="outline">
																<Loader2 className="w-3 h-3 mr-1 animate-spin" />
																Sending...
															</Badge>
														)}
														{cert.mailed && (
															<Badge variant="default" className="bg-green-600">
																<CheckCircle className="w-3 h-3 mr-1" />
																Sent
															</Badge>
														)}
														{cert.mailError && (
															<Badge variant="destructive">
																<AlertCircle className="w-3 h-3 mr-1" />
																Failed
															</Badge>
														)}
													</div>
												</div>
												{cert.mailError && (
													<p className="text-sm text-red-600 mt-1">
														{cert.mailError}
													</p>
												)}
											</div>
											<div className="flex items-center gap-2">
												{cert.mailError && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => retryMail(cert)}
														disabled={cert.mailing}
													>
														<RefreshCw className="w-4 h-4" />
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														downloadCertificate(
															cert.certificateUrl,
															cert.filename || "certificate.png",
														)
													}
												>
													<Download className="w-4 h-4" />
												</Button>
												{cert.cloudinaryUrl && (
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															window.open(cert.cloudinaryUrl, "_blank")
														}
													>
														<ExternalLink className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Navigation */}
			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back to Preview
				</Button>
				{currentStep !== "confirm" && (
					<Button
						variant="outline"
						onClick={() => {
							if (currentStep === "mail") setCurrentStep("upload");
							else if (currentStep === "upload") setCurrentStep("confirm");
						}}
					>
						Previous Step
					</Button>
				)}
			</div>
		</div>
	);
}
