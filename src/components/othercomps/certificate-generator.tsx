import { useState, useCallback, useRef } from "react";
import {
	Download,
	ArrowLeft,
	Loader,
	FileImage,
	CheckCircle,
	Mail,
	Save,
	X,
	Edit3,
	Send,
} from "lucide-react";
import type {
	Section,
	CSVData,
	GeneratedCertificate,
	TextSegment,
} from "../types";
import JSZip from "jszip";

// Configuration
const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface CertificateGeneratorProps {
	templateImage: string;
	sections: Section[];
	csvData: CSVData;
	variableMapping: Record<string, string>;
	onBack: () => void;
}

export default function CertificateGenerator({
	templateImage,
	sections,
	csvData,
	variableMapping,
	onBack,
}: CertificateGeneratorProps) {
	const [certificates, setCertificates] = useState<GeneratedCertificate[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentProgress, setCurrentProgress] = useState(0);
	const [showBulkEmail, setShowBulkEmail] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const getEffectiveStyle = useCallback(
		(segment: TextSegment, section: Section) => {
			return {
				fontSize: segment.fontSize ?? section.defaultFontSize,
				fontFamily: segment.fontFamily ?? section.defaultFontFamily,
				color: segment.color ?? section.defaultColor,
				fontWeight: segment.fontWeight ?? section.defaultFontWeight,
				textDecoration: segment.textDecoration ?? section.defaultTextDecoration,
			};
		},
		[],
	);

	const getTextLines = useCallback(
		(
			segments: TextSegment[],
			section: Section,
			maxWidth: number | undefined,
			ctx: CanvasRenderingContext2D,
		) => {
			if (!maxWidth) {
				return [segments];
			}

			if (segments.length === 1 && !segments[0].isVariable) {
				const segment = segments[0];
				const style = getEffectiveStyle(segment, section);
				ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;

				const words = segment.text.split(" ");
				const lines: TextSegment[][] = [];
				let currentLine: string[] = [];
				let currentLineWidth = 0;

				for (const word of words) {
					const wordWidth = ctx.measureText(word + " ").width;

					if (
						currentLineWidth + wordWidth > maxWidth &&
						currentLine.length > 0
					) {
						lines.push([
							{
								...segment,
								text: currentLine.join(" "),
							},
						]);
						currentLine = [word];
						currentLineWidth = wordWidth;
					} else {
						currentLine.push(word);
						currentLineWidth += wordWidth;
					}
				}

				if (currentLine.length > 0) {
					lines.push([
						{
							...segment,
							text: currentLine.join(" "),
						},
					]);
				}

				return lines.length > 0 ? lines : [segments];
			}

			const lines: TextSegment[][] = [];
			let currentLine: TextSegment[] = [];
			let currentLineWidth = 0;

			for (const segment of segments) {
				const style = getEffectiveStyle(segment, section);
				ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
				const segmentWidth = ctx.measureText(segment.text).width;

				if (
					currentLineWidth + segmentWidth > maxWidth &&
					currentLine.length > 0
				) {
					lines.push(currentLine);
					currentLine = [segment];
					currentLineWidth = segmentWidth;
				} else {
					currentLine.push(segment);
					currentLineWidth += segmentWidth;
				}
			}

			if (currentLine.length > 0) {
				lines.push(currentLine);
			}

			return lines.length > 0 ? lines : [segments];
		},
		[getEffectiveStyle],
	);

	const generateCertificate = useCallback(
		(rowData: Record<string, string>): Promise<string> => {
			return new Promise((resolve) => {
				const canvas = canvasRef.current;
				if (!canvas) {
					resolve("");
					return;
				}

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve("");
					return;
				}

				const img = new Image();
				img.onload = () => {
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;

					ctx.drawImage(img, 0, 0);

					sections.forEach((section) => {
						const processedSegments = section.segments.map((segment) => {
							if (segment.isVariable && segment.variableName) {
								const csvColumn = variableMapping[segment.variableName];
								const actualValue = csvColumn
									? rowData[csvColumn] || segment.text
									: segment.text;
								return { ...segment, text: actualValue };
							}
							return segment;
						});

						const lines = getTextLines(
							processedSegments,
							section,
							section.maxWidth,
							ctx,
						);
						const maxFontSize = Math.max(
							...section.segments.map(
								(s) => getEffectiveStyle(s, section).fontSize,
							),
						);
						const lineHeight = maxFontSize + 5;

						lines.forEach((line, lineIndex) => {
							let currentX = section.x;

							let lineWidth = 0;
							for (const segment of line) {
								const style = getEffectiveStyle(segment, section);
								ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
								lineWidth += ctx.measureText(segment.text).width;
							}

							if (section.textAlign === "center") {
								if (section.maxWidth) {
									currentX =
										section.x -
										section.maxWidth / 2 +
										section.maxWidth / 2 -
										lineWidth / 2;
								} else {
									currentX = section.x - lineWidth / 2;
								}
							} else if (section.textAlign === "right") {
								if (section.maxWidth) {
									currentX = section.x - lineWidth;
								} else {
									currentX = section.x - lineWidth;
								}
							} else {
								if (section.maxWidth) {
									currentX = section.x - section.maxWidth / 2;
								}
							}

							const y = section.y + lineIndex * lineHeight;

							for (const segment of line) {
								const style = getEffectiveStyle(segment, section);
								ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
								ctx.fillStyle = style.color;

								if (style.textDecoration === "underline") {
									const textWidth = ctx.measureText(segment.text).width;
									ctx.strokeStyle = style.color;
									ctx.lineWidth = 1;
									ctx.beginPath();
									ctx.moveTo(currentX, y + 2);
									ctx.lineTo(currentX + textWidth, y + 2);
									ctx.stroke();
								}

								ctx.fillText(segment.text, currentX, y);
								currentX += ctx.measureText(segment.text).width;
							}
						});
					});

					resolve(canvas.toDataURL("image/png"));
				};
				img.src = templateImage;
			});
		},
		[templateImage, sections, variableMapping, getTextLines, getEffectiveStyle],
	);

	const generateAllCertificates = useCallback(async () => {
		setIsGenerating(true);
		setCurrentProgress(0);
		const newCertificates: GeneratedCertificate[] = [];

		for (let i = 0; i < csvData.rows.length; i++) {
			const row = csvData.rows[i];
			const dataUrl = await generateCertificate(row);

			// Generate filename
			const filenameColumn = variableMapping["__filename__"];
			let filename: string;
			if (filenameColumn && row[filenameColumn]) {
				const filenameValue = row[filenameColumn];
				const sanitizedFilename = filenameValue
					.replace(/[^a-z0-9]/gi, "_")
					.toLowerCase();
				filename = `certificate_${sanitizedFilename}.png`;
			} else {
				const nameField = Object.keys(row).find((key) =>
					key.toLowerCase().includes("name"),
				);
				const name = nameField ? row[nameField] : "certificate";
				const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
				filename = `certificate_${sanitizedName}.png`;
			}

			newCertificates.push({
				id: `cert-${i}`,
				filename,
				dataUrl,
				rowData: row,
			});

			setCurrentProgress(((i + 1) / csvData.rows.length) * 100);
		}

		setCertificates(newCertificates);
		setIsGenerating(false);
	}, [csvData.rows, generateCertificate, variableMapping]);

	const getFilename = useCallback((certificate: GeneratedCertificate) => {
		return certificate.filename;
	}, []);

	const downloadCertificate = useCallback(
		(certificate: GeneratedCertificate) => {
			const link = document.createElement("a");
			link.href = certificate.dataUrl;
			link.download = getFilename(certificate);
			link.click();
		},
		[getFilename],
	);

	const downloadAllCertificates = useCallback(async () => {
		if (certificates.length === 0) return;

		const zip = new JSZip();

		certificates.forEach((certificate) => {
			const byteCharacters = atob(certificate.dataUrl.split(",")[1]);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);

			const filename = getFilename(certificate);
			zip.file(filename, byteArray);
		});

		const content = await zip.generateAsync({ type: "blob" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(content);
		link.download = "certificates.zip";
		link.click();
	}, [certificates, getFilename]);

	if (showBulkEmail) {
		return (
			<BulkEmailComponent
				certificates={certificates}
				getFilename={getFilename}
				onBack={() => setShowBulkEmail(false)}
				templateImage={templateImage}
				sections={sections}
				csvData={csvData}
				variableMapping={variableMapping}
				generateCertificate={generateCertificate}
			/>
		);
	}

	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Generate Certificates
				</h2>
				<p className="text-gray-600 dark:text-slate-400">
					Generate personalized certificates for all entries
				</p>
			</div>

			<canvas ref={canvasRef} className="hidden" />

			{certificates.length === 0 ? (
				<div className="text-center space-y-6">
					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-8 border border-gray-200 dark:border-slate-700">
						<FileImage className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-2">
							Ready to Generate
						</h3>
						<p className="text-gray-600 dark:text-slate-400 mb-6">
							Generate {csvData.rows.length} certificates with your configured
							settings
						</p>

						{isGenerating ? (
							<div className="space-y-4">
								<div className="flex items-center justify-center space-x-2">
									<Loader className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
									<span className="text-blue-600 dark:text-blue-400 font-medium">
										Generating certificates...
									</span>
								</div>
								<div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${currentProgress}%` }}
									/>
								</div>
								<p className="text-sm text-gray-500 dark:text-slate-400">
									{Math.round(currentProgress)}% complete
								</p>
							</div>
						) : (
							<button
								type="button"
								onClick={generateAllCertificates}
								className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
							>
								Generate All Certificates
							</button>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700">
							<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
								{csvData.rows.length}
							</div>
							<div className="text-sm text-gray-600 dark:text-slate-400">
								Certificates
							</div>
						</div>
						<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-700">
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">
								{sections.length}
							</div>
							<div className="text-sm text-gray-600 dark:text-slate-400">
								Sections
							</div>
						</div>
						<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-700">
							<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
								{
									Object.keys(variableMapping).filter(
										(k) => k !== "__filename__",
									).length
								}
							</div>
							<div className="text-sm text-gray-600 dark:text-slate-400">
								Variables
							</div>
						</div>
						<div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-200 dark:border-orange-700">
							<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
								{csvData.headers.length}
							</div>
							<div className="text-sm text-gray-600 dark:text-slate-400">
								Data Fields
							</div>
						</div>
					</div>

					{variableMapping["__filename__"] && (
						<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
							<h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
								Filename Format Preview
							</h4>
							<div className="text-sm text-blue-700 dark:text-blue-300">
								Files will be named using the{" "}
								<strong>{variableMapping["__filename__"]}</strong> column.
								<br />
								Example: If {variableMapping["__filename__"]} = "john_doe",
								filename will be "certificate_john_doe.png"
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="space-y-6">
					<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
						<div className="flex items-center">
							<CheckCircle className="w-5 h-5 text-green-500 mr-2" />
							<span className="text-green-800 dark:text-green-200 font-medium">
								Successfully generated {certificates.length} certificates!
							</span>
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div>
								<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
									Download Options
								</h3>
								<p className="text-gray-600 dark:text-slate-400">
									Download individual certificates or all as a ZIP file
								</p>
							</div>
							<div className="flex flex-col sm:flex-row gap-3">
								<button
									type="button"
									onClick={downloadAllCertificates}
									className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
								>
									<Download className="w-4 h-4 mr-2" />
									Download All as ZIP
								</button>
								<button
									type="button"
									onClick={() => setShowBulkEmail(true)}
									className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
								>
									<Mail className="w-4 h-4 mr-2" />
									Send Bulk Emails
								</button>
							</div>
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4">
							Generated Certificates
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{certificates.map((certificate, index) => (
								<div
									key={certificate.id}
									className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-600"
								>
									<div className="aspect-w-16 aspect-h-11">
										<div
											className="w-full h-48 object-cover bg-center bg-no-repeat bg-cover"
											style={{
												backgroundImage: `url(${certificate.dataUrl})`,
											}}
											role="img"
											aria-label={`Certificate ${index + 1}`}
										/>
									</div>
									<div className="p-4">
										<h4 className="font-medium text-gray-800 dark:text-slate-200 mb-2">
											Certificate #{index + 1}
										</h4>
										<div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
											{Object.entries(certificate.rowData)
												.slice(0, 2)
												.map(([key, value]) => (
													<div key={key}>
														<span className="font-medium">{key}:</span> {value}
													</div>
												))}
										</div>
										<div className="text-xs text-gray-500 dark:text-slate-400 mt-2">
											<strong>Filename:</strong> {getFilename(certificate)}
										</div>
										<button
											type="button"
											onClick={() => downloadCertificate(certificate)}
											className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
										>
											Download
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			<div className="flex justify-between mt-8">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium border border-gray-200 dark:border-slate-600"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>

				{certificates.length > 0 && (
					<button
						type="button"
						onClick={() => {
							setCertificates([]);
							setCurrentProgress(0);
						}}
						className="px-6 py-3 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors duration-200 font-medium border border-purple-200 dark:border-purple-700"
					>
						Generate Again
					</button>
				)}
			</div>
		</div>
	);
}

interface BulkEmailComponentProps {
	certificates: GeneratedCertificate[];
	getFilename: (certificate: GeneratedCertificate) => string;
	onBack: () => void;
	templateImage: string;
	sections: Section[];
	csvData: CSVData;
	variableMapping: Record<string, string>;
	generateCertificate: (rowData: Record<string, string>) => Promise<string>;
}

function BulkEmailComponent({
	certificates,
	getFilename,
	onBack,
	templateImage,
	sections,
	csvData,
	variableMapping,
	generateCertificate,
}: BulkEmailComponentProps) {
	const [pattern, setPattern] = useState("");
	const [characterCount, setCharacterCount] = useState(10);
	const [domain, setDomain] = useState("");
	const [emailMappings, setEmailMappings] = useState<
		Array<{
			filename: string;
			email: string;
			certificate: GeneratedCertificate;
		}>
	>([]);
	const [showEmailList, setShowEmailList] = useState(false);

	const generateEmailMappings = useCallback(() => {
		if (!pattern || !domain || characterCount <= 0) {
			alert("Please fill in all fields");
			return;
		}

		const mappings = certificates
			.map((certificate) => {
				const filename = getFilename(certificate);
				const baseFilename = filename
					.replace(".png", "")
					.replace("certificate_", "");

				if (baseFilename.toLowerCase().startsWith(pattern.toLowerCase())) {
					const emailPrefix = baseFilename.substring(0, characterCount);
					const email = `${emailPrefix}@${domain}`;

					return {
						filename,
						email,
						certificate,
					};
				}

				return null;
			})
			.filter(Boolean) as Array<{
			filename: string;
			email: string;
			certificate: GeneratedCertificate;
		}>;

		setEmailMappings(mappings);
		setShowEmailList(true);
	}, [certificates, getFilename, pattern, characterCount, domain]);

	if (showEmailList) {
		return (
			<EmailSendingComponent
				emailMappings={emailMappings}
				setEmailMappings={setEmailMappings}
				onBack={() => setShowEmailList(false)}
				templateImage={templateImage}
				sections={sections}
				csvData={csvData}
				variableMapping={variableMapping}
				generateCertificate={generateCertificate}
			/>
		);
	}

	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Bulk Email Setup
				</h2>
				<p className="text-gray-600 dark:text-slate-400">
					Configure email pattern to generate recipient emails from filenames
				</p>
			</div>

			<div className="max-w-2xl mx-auto space-y-6">
				<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
					<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
						<Mail className="w-5 h-5 mr-2" />
						Email Pattern Configuration
					</h3>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="pattern-input"
								className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
							>
								Pattern (Starting characters)
							</label>
							<input
								id="pattern-input"
								type="text"
								value={pattern}
								onChange={(e) => setPattern(e.target.value)}
								placeholder="e.g., nnm"
								className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
								Enter the starting characters that filenames should begin with
							</p>
						</div>

						<div>
							<label
								htmlFor="character-count-input"
								className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
							>
								Character Count (Total length including pattern)
							</label>
							<input
								id="character-count-input"
								type="number"
								value={characterCount}
								onChange={(e) =>
									setCharacterCount(parseInt(e.target.value) || 0)
								}
								min="1"
								max="50"
								className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
								Total number of characters to extract from filename (including
								pattern)
							</p>
						</div>

						<div>
							<label
								htmlFor="domain-input"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Email Domain
							</label>
							<input
								id="domain-input"
								type="text"
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								placeholder="e.g., college.edu"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p className="text-sm text-gray-500 mt-1">
								Domain to append after @ symbol
							</p>
						</div>
					</div>

					{pattern && characterCount > 0 && domain && (
						<div className="mt-6 p-4 bg-white rounded-lg border">
							<h4 className="text-sm font-semibold text-gray-800 mb-2">
								Example:
							</h4>
							<div className="text-sm text-gray-600">
								<div className="mb-1">
									<strong>Filename:</strong> certificate_nnm23cs144.png
								</div>
								<div className="mb-1">
									<strong>Pattern:</strong> {pattern} (matches: ✓)
								</div>
								<div className="mb-1">
									<strong>Extracted:</strong>{" "}
									{`nnm23cs144`.substring(0, characterCount)} ({characterCount}{" "}
									characters)
								</div>
								<div className="text-blue-600 font-medium">
									<strong>Generated Email:</strong>{" "}
									{`nnm23cs144`.substring(0, characterCount)}@{domain}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="bg-gray-50 rounded-lg p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">
						Certificate Summary
					</h3>
					<div className="grid grid-cols-2 gap-4">
						<div className="bg-white p-4 rounded-lg text-center">
							<div className="text-2xl font-bold text-blue-600">
								{certificates.length}
							</div>
							<div className="text-sm text-gray-600">Total Certificates</div>
						</div>
						<div className="bg-white p-4 rounded-lg text-center">
							<div className="text-2xl font-bold text-green-600">
								{pattern &&
									certificates.filter((cert) => {
										const filename = getFilename(cert);
										const baseFilename = filename
											.replace(".png", "")
											.replace("certificate_", "");
										return baseFilename
											.toLowerCase()
											.startsWith(pattern.toLowerCase());
									}).length}
							</div>
							<div className="text-sm text-gray-600">Matching Pattern</div>
						</div>
					</div>
				</div>

				<div className="flex justify-center">
					<button
						type="button"
						onClick={generateEmailMappings}
						disabled={!pattern || !domain || characterCount <= 0}
						className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
					>
						Generate Email List
					</button>
				</div>
			</div>

			<div className="flex justify-between mt-8">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Certificates
				</button>
			</div>
		</div>
	);
}

interface EmailSendingComponentProps {
	emailMappings: Array<{
		filename: string;
		email: string;
		certificate: GeneratedCertificate;
	}>;
	setEmailMappings: React.Dispatch<
		React.SetStateAction<
			Array<{
				filename: string;
				email: string;
				certificate: GeneratedCertificate;
			}>
		>
	>;
	onBack: () => void;
	templateImage: string;
	sections: Section[];
	csvData: CSVData;
	variableMapping: Record<string, string>;
	generateCertificate: (rowData: Record<string, string>) => Promise<string>;
}

function EmailSendingComponent({
	emailMappings,
	setEmailMappings,
	onBack,
	templateImage: _templateImage,
	sections: _sections,
	csvData: _csvData,
	variableMapping: _variableMapping,
	generateCertificate: _generateCertificate,
}: EmailSendingComponentProps) {
	const [sendingStatus, setSendingStatus] = useState<
		"idle" | "sending" | "completed"
	>("idle");
	const [currentSending, setCurrentSending] = useState(0);
	const [failedEmails, setFailedEmails] = useState<
		Array<{
			email: string;
			filename: string;
			error: string;
		}>
	>([]);
	const [successCount, setSuccessCount] = useState(0);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editingEmail, setEditingEmail] = useState("");

	const sendEmail = async (
		email: string,
		filename: string,
		certificateDataUrl: string,
	) => {
		try {
			const response = await fetch(certificateDataUrl);
			const blob = await response.blob();

			const formData = new FormData();
			formData.append("to", email);
			formData.append("subject", "Your Certificate");
			formData.append("text", "Please find your certificate attached.");
			formData.append("certificate", blob, filename);

			const emailResponse = await fetch(`${BACKEND_URL}/api/send-email`, {
				method: "POST",
				body: formData,
			});

			if (!emailResponse.ok) {
				throw new Error(`Failed to send email: ${emailResponse.statusText}`);
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	};

	const sendBulkEmails = async () => {
		setSendingStatus("sending");
		setCurrentSending(0);
		setFailedEmails([]);
		setSuccessCount(0);

		for (let i = 0; i < emailMappings.length; i++) {
			const mapping = emailMappings[i];
			setCurrentSending(i + 1);

			const result = await sendEmail(
				mapping.email,
				mapping.filename,
				mapping.certificate.dataUrl,
			);

			if (result.success) {
				setSuccessCount((prev) => prev + 1);
			} else {
				setFailedEmails((prev) => [
					...prev,
					{
						email: mapping.email,
						filename: mapping.filename,
						error: result.error || "Unknown error",
					},
				]);
			}

			if (i < emailMappings.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		setSendingStatus("completed");
	};

	const retryFailedEmail = async (email: string, filename: string) => {
		const mapping = emailMappings.find(
			(m) => m.email === email && m.filename === filename,
		);
		if (!mapping) return;

		const result = await sendEmail(
			email,
			filename,
			mapping.certificate.dataUrl,
		);

		if (result.success) {
			setFailedEmails((prev) =>
				prev.filter((f) => f.email !== email || f.filename !== filename),
			);
			setSuccessCount((prev) => prev + 1);
		} else {
			setFailedEmails((prev) =>
				prev.map((f) =>
					f.email === email && f.filename === filename
						? { ...f, error: result.error || "Unknown error" }
						: f,
				),
			);
		}
	};

	const startEditing = (index: number) => {
		setEditingIndex(index);
		setEditingEmail(emailMappings[index].email);
	};

	const saveEdit = () => {
		if (editingIndex !== null) {
			const updatedMappings = [...emailMappings];
			updatedMappings[editingIndex] = {
				...updatedMappings[editingIndex],
				email: editingEmail,
			};
			setEmailMappings(updatedMappings);
			setEditingIndex(null);
			setEditingEmail("");
		}
	};

	const cancelEdit = () => {
		setEditingIndex(null);
		setEditingEmail("");
	};

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	return (
		<div className="bg-white rounded-xl shadow-lg p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					Send Bulk Emails
				</h2>
				<p className="text-gray-600">
					Review and edit email mappings, then send certificates
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<div className="bg-blue-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-blue-600">
						{emailMappings.length}
					</div>
					<div className="text-sm text-gray-600">Total Emails</div>
				</div>
				<div className="bg-green-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-green-600">
						{successCount}
					</div>
					<div className="text-sm text-gray-600">Sent Successfully</div>
				</div>
				<div className="bg-red-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-red-600">
						{failedEmails.length}
					</div>
					<div className="text-sm text-gray-600">Failed</div>
				</div>
				<div className="bg-purple-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-purple-600">
						{sendingStatus === "sending"
							? `${currentSending}/${emailMappings.length}`
							: sendingStatus === "completed"
								? "✓"
								: "⏳"}
					</div>
					<div className="text-sm text-gray-600">Progress</div>
				</div>
			</div>

			{sendingStatus === "sending" && (
				<div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
					<div className="flex items-center justify-center mb-4">
						<Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
						<span className="text-blue-600 font-medium">Sending emails...</span>
					</div>
					<div className="w-full bg-blue-200 rounded-full h-3">
						<div
							className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
							style={{
								width: `${(currentSending / emailMappings.length) * 100}%`,
							}}
						/>
					</div>
					<p className="text-center text-sm text-blue-600 mt-2">
						Sending {currentSending} of {emailMappings.length} emails...
					</p>
				</div>
			)}

			{failedEmails.length > 0 && (
				<div className="bg-red-50 rounded-lg p-6 mb-6 border border-red-200">
					<h3 className="text-lg font-semibold text-red-800 mb-4">
						Failed Emails
					</h3>
					<div className="space-y-3 max-h-64 overflow-y-auto">
						{failedEmails.map((failed) => (
							<div
								key={failed.email}
								className="bg-white p-4 rounded-lg border border-red-200"
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="font-medium text-gray-800">
											{failed.email}
										</div>
										<div className="text-sm text-gray-600">
											{failed.filename}
										</div>
										<div className="text-sm text-red-600 mt-1">
											{failed.error}
										</div>
									</div>
									<button
										type="button"
										onClick={() =>
											retryFailedEmail(failed.email, failed.filename)
										}
										className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium"
									>
										Retry
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="bg-gray-50 rounded-lg p-6 mb-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-800">
						Email Mappings
					</h3>
					<div className="text-sm text-gray-600">
						Click the edit icon to modify email addresses
					</div>
				</div>
				<div className="space-y-3 max-h-96 overflow-y-auto">
					{emailMappings.map((mapping, index) => {
						const isFailed = failedEmails.some(
							(f) =>
								f.email === mapping.email && f.filename === mapping.filename,
						);
						const isSent =
							sendingStatus === "completed" &&
							!isFailed &&
							index < currentSending;
						const isEditing = editingIndex === index;

						return (
							<div
								key={`${mapping.email}-${mapping.filename}`}
								className={`bg-white p-4 rounded-lg border ${
									isFailed
										? "border-red-200"
										: isSent
											? "border-green-200"
											: "border-gray-200"
								}`}
							>
								<div className="flex justify-between items-center">
									<div className="flex-1">
										{isEditing ? (
											<div className="space-y-2">
												<input
													type="email"
													value={editingEmail}
													onChange={(e) => setEditingEmail(e.target.value)}
													className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
														!validateEmail(editingEmail) && editingEmail
															? "border-red-300"
															: "border-gray-300"
													}`}
													placeholder="Enter email address"
												/>
												{!validateEmail(editingEmail) && editingEmail && (
													<p className="text-sm text-red-600">
														Please enter a valid email address
													</p>
												)}
												<div className="text-sm text-gray-600">
													{mapping.filename}
												</div>
												<div className="flex space-x-2">
													<button
														type="button"
														onClick={saveEdit}
														disabled={!validateEmail(editingEmail)}
														className="flex items-center px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
													>
														<Save className="w-3 h-3 mr-1" />
														Save
													</button>
													<button
														type="button"
														onClick={cancelEdit}
														className="flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm font-medium"
													>
														<X className="w-3 h-3 mr-1" />
														Cancel
													</button>
												</div>
											</div>
										) : (
											<>
												<div className="font-medium text-gray-800">
													{mapping.email}
												</div>
												<div className="text-sm text-gray-600">
													{mapping.filename}
												</div>
											</>
										)}
									</div>
									<div className="flex items-center space-x-2">
										{!isEditing && sendingStatus === "idle" && (
											<button
												type="button"
												onClick={() => startEditing(index)}
												className="p-1 text-blue-600 hover:bg-blue-100 rounded"
												title="Edit email"
											>
												<Edit3 className="w-4 h-4" />
											</button>
										)}
										{isFailed && (
											<span className="text-red-600 text-sm">❌ Failed</span>
										)}
										{isSent && (
											<span className="text-green-600 text-sm">✅ Sent</span>
										)}
										{sendingStatus === "sending" &&
											index + 1 === currentSending && (
												<Loader className="w-4 h-4 animate-spin text-blue-600" />
											)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex justify-center space-x-4 mb-8">
				{sendingStatus === "idle" && (
					<button
						type="button"
						onClick={sendBulkEmails}
						disabled={emailMappings.some(
							(mapping) => !validateEmail(mapping.email),
						)}
						className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
					>
						<Send className="w-4 h-4 mr-2 inline" />
						Send All Emails
					</button>
				)}

				{sendingStatus === "completed" && failedEmails.length > 0 && (
					<button
						type="button"
						onClick={() => {
							setSendingStatus("idle");
							setCurrentSending(0);
						}}
						className="px-6 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200 font-medium"
					>
						Retry All Failed
					</button>
				)}
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Setup
				</button>

				{sendingStatus === "completed" && (
					<div className="text-green-600 font-medium flex items-center">
						<CheckCircle className="w-5 h-5 mr-2" />
						Bulk email process completed!
					</div>
				)}
			</div>
		</div>
	);
}
