import { useState, useEffect, useCallback } from "react";
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
	Download,
	Mail,
	CheckCircle,
	AlertCircle,
	Users,
	FileText,
	Trophy,
	Workflow,
} from "lucide-react";
import { useCertificateContext } from "../../providers/certificateContext";
import { getEventParticipants } from "../../actions/certificate";
import type { EventParticipant } from "../../lib/certificate-types";
import {
	generateCertificate,
	downloadCertificate,
} from "../../lib/certificate-generator";
import CertificateWorkflow from "./certificate-workflow-new";

interface EnhancedCertificateDownloadProps {
	onBack: () => void;
}

export default function EnhancedCertificateDownload({
	onBack,
}: EnhancedCertificateDownloadProps) {
	const {
		selectedEvent,
		templateImage,
		sections,
		csvData,
		usnColumn,
		variableMapping,
		extraDataMapping,
		filenameFormat,
		generatedCertificates,
		setGeneratedCertificates,
	} = useCertificateContext();

	const [participants, setParticipants] = useState<EventParticipant[]>([]);
	const [generating, setGenerating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [showWorkflow, setShowWorkflow] = useState(false);

	const loadParticipants = useCallback(async () => {
		if (!selectedEvent) return;

		try {
			const result = await getEventParticipants(selectedEvent.id);
			if (result.success && result.data) {
				setParticipants(result.data);
			}
		} catch (error) {
			console.error("Failed to load participants:", error);
			setError("Failed to load participants");
		}
	}, [selectedEvent]);

	useEffect(() => {
		if (selectedEvent) {
			loadParticipants();
		}
	}, [selectedEvent, loadParticipants]);

	const generateCertificates = async () => {
		if (
			!selectedEvent ||
			participants.length === 0 ||
			!templateImage ||
			sections.length === 0
		) {
			setError("Missing required data for certificate generation");
			return;
		}

		setGenerating(true);
		setProgress(0);
		setError(null);

		try {
			const certificatesToGenerate = participants.filter((participant) => {
				// If CSV data is provided, only generate for USNs in CSV
				if (csvData && usnColumn) {
					return csvData.rows.some((row) => row[usnColumn] === participant.usn);
				}
				// Otherwise generate for all participants
				return true;
			});

			const generatedResults = [];

			for (let i = 0; i < certificatesToGenerate.length; i++) {
				const participant = certificatesToGenerate[i];

				// Get extra data from CSV if available
				const extraData: Record<string, string> = {};
				if (csvData && usnColumn) {
					const csvRow = csvData.rows.find(
						(row) => row[usnColumn] === participant.usn,
					);
					if (csvRow) {
						Object.keys(extraDataMapping).forEach((templateVar) => {
							const csvColumn = extraDataMapping[templateVar];
							if (csvColumn && csvRow[csvColumn]) {
								extraData[templateVar] = csvRow[csvColumn];
							}
						});
					}
				}

				// Generate actual certificate
				const result = await generateCertificate({
					templateImage,
					sections,
					participant,
					selectedEvent,
					variableMapping,
					extraData,
					filenameFormat,
				});

				if (result.success && result.dataUrl && result.filename) {
					generatedResults.push({
						usn: participant.usn,
						name: participant.name,
						email: participant.email,
						certificateUrl: result.dataUrl,
						filename: result.filename,
						prizeType: participant.prizeType,
					});
				} else {
					console.error(
						`Failed to generate certificate for ${participant.name}:`,
						result.error,
					);
				}

				setProgress(((i + 1) / certificatesToGenerate.length) * 100);
			}

			setGeneratedCertificates(generatedResults);
		} catch (error) {
			console.error("Certificate generation error:", error);
			setError("Failed to generate certificates");
		} finally {
			setGenerating(false);
		}
	};

	const downloadAll = () => {
		// Download all certificates individually since they are data URLs
		generatedCertificates.forEach((cert) => {
			downloadCertificate(
				cert.certificateUrl,
				cert.filename || "certificate.png",
			);
		});
	};

	const sendEmails = () => {
		// Implement email sending logic
		console.log(
			"Sending emails to:",
			generatedCertificates.map((c) => c.email),
		);
	};

	return (
		<>
			{showWorkflow ? (
				<CertificateWorkflow
					onBack={() => setShowWorkflow(false)}
					eventId={selectedEvent?.id || 0}
					participants={participants}
					generatedCertificates={generatedCertificates.map((cert) => ({
						usn: cert.usn,
						name: cert.name,
						email: cert.email,
						certificateUrl: cert.certificateUrl,
						filename: cert.filename,
						prizeType: cert.prizeType,
					}))}
				/>
			) : (
				<div className="max-w-6xl mx-auto space-y-6">
					<div className="text-center mb-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Generate & Download Certificates
						</h2>
						<p className="text-gray-600">
							Review and generate certificates for event participants
						</p>
					</div>

					{/* Generation Summary */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="w-5 h-5" />
								Generation Summary
							</CardTitle>
							<CardDescription>
								Overview of certificates to be generated
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{participants.length}
									</div>
									<div className="text-sm text-gray-500">
										Total Participants
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{csvData && usnColumn
											? participants.filter((p) =>
													csvData.rows.some((row) => row[usnColumn] === p.usn),
												).length
											: participants.length}
									</div>
									<div className="text-sm text-gray-500">
										Certificates to Generate
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-purple-600">
										{
											participants.filter(
												(p) => p.prizeType && p.prizeType !== "PARTICIPATION",
											).length
										}
									</div>
									<div className="text-sm text-gray-500">Prize Winners</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">
										{generatedCertificates.length}
									</div>
									<div className="text-sm text-gray-500">Generated</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Generation Controls */}
					{generatedCertificates.length === 0 ? (
						<Card>
							<CardHeader>
								<CardTitle>Generate Certificates</CardTitle>
								<CardDescription>
									Start the certificate generation process
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{generating && (
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Generating certificates...</span>
											<span>{Math.round(progress)}%</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className="bg-blue-600 h-2 rounded-full transition-all duration-300"
												style={{ width: `${progress}%` }}
											/>
										</div>
									</div>
								)}

								<div className="flex gap-4">
									<Button
										onClick={generateCertificates}
										disabled={generating || participants.length === 0}
										className="flex-1"
										size="lg"
									>
										{generating ? "Generating..." : "Generate All Certificates"}
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
					) : (
						/* Generated Certificates */
						<div className="space-y-6">
							{/* Batch Actions */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<CheckCircle className="w-5 h-5 text-green-500" />
										Certificates Generated Successfully
									</CardTitle>
									<CardDescription>
										{generatedCertificates.length} certificates are ready for
										download
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex gap-4">
										<Button onClick={downloadAll} className="flex-1">
											<Download className="w-4 h-4 mr-2" />
											Download All Certificates
										</Button>
										<Button
											onClick={sendEmails}
											variant="outline"
											className="flex-1"
										>
											<Mail className="w-4 h-4 mr-2" />
											Send via Email
										</Button>
									</div>
								</CardContent>
							</Card>

							{/* Individual Certificates */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Users className="w-5 h-5" />
										Individual Certificates
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3 max-h-96 overflow-y-auto">
										{generatedCertificates.map((cert) => (
											<div
												key={cert.usn}
												className="flex items-center justify-between p-4 border rounded-lg"
											>
												<div className="flex-1">
													<div className="flex items-center gap-3">
														<div>
															<p className="font-medium">{cert.name}</p>
															<p className="text-sm text-gray-500">
																{cert.usn}
															</p>
														</div>
														<div className="flex items-center gap-2">
															<Badge variant="outline">
																<Mail className="w-3 h-3 mr-1" />
																{cert.email}
															</Badge>
															{cert.prizeType &&
																cert.prizeType !== "PARTICIPATION" && (
																	<Badge variant="secondary">
																		<Trophy className="w-3 h-3 mr-1" />
																		{cert.prizeType}
																	</Badge>
																)}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-2">
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
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															// Send individual email
															console.log("Sending email to:", cert.email);
														}}
													>
														<Mail className="w-4 h-4" />
													</Button>
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
						{generatedCertificates.length > 0 && (
							<>
								<Button
									onClick={() => setShowWorkflow(true)}
									disabled={generating || participants.length === 0}
									variant="outline"
									className="flex-1"
									size="lg"
								>
									<Workflow className="w-4 h-4 mr-2" />
									Certificate Workflow
								</Button>
								<Button onClick={() => window.location.reload()}>
									Generate New Certificates
								</Button>
							</>
						)}
					</div>
				</div>
			)}
		</>
	);
}
