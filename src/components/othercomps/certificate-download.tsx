import { useState, useCallback, useRef, useEffect } from "react";
import {
	Download,
	ArrowLeft,
	Loader,
	Eye,
	FileDown,
	CheckCircle,
	Link,
} from "lucide-react";
import type {
	Section,
	CSVData,
	GeneratedCertificate,
	TextSegment,
} from "../types";
import JSZip from "jszip";
import Image from "next/image";

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
	const [previewIndex, setPreviewIndex] = useState(0);
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

				const segmentWidth = ctx.measureText(segment.text + " ").width;

				if (
					currentLineWidth + segmentWidth > maxWidth &&
					currentLine.length > 0
				) {
					lines.push([...currentLine]);
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
		(rowData: Record<string, string>): Promise<string | null> => {
			const canvas = canvasRef.current;
			if (!canvas) return Promise.resolve(null);

			const ctx = canvas.getContext("2d");
			if (!ctx) return Promise.resolve(null);

			return new Promise<string | null>((resolve) => {
				const img = new window.Image();
				img.onload = () => {
					canvas.width = img.width;
					canvas.height = img.height;

					ctx.drawImage(img, 0, 0);

					for (const section of sections) {
						const processedSegments = section.segments.map((segment) => {
							if (segment.isVariable && segment.variableName) {
								const mappedColumn = variableMapping[segment.variableName];
								const value = mappedColumn ? rowData[mappedColumn] || "" : "";
								return { ...segment, text: value };
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
							...processedSegments.map(
								(s) => getEffectiveStyle(s, section).fontSize,
							),
						);
						const lineHeight = maxFontSize + 5;

						let currentY = section.y;

						for (const line of lines) {
							let currentX = section.x;

							// Calculate line width
							let lineWidth = 0;
							for (const segment of line) {
								const style = getEffectiveStyle(segment, section);
								ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
								lineWidth += ctx.measureText(segment.text).width;
							}

							// Apply alignment
							if (section.textAlign === "center") {
								if (section.maxWidth) {
									currentX =
										section.x -
										section.maxWidth / 2 +
										(section.maxWidth - lineWidth) / 2;
								} else {
									currentX = section.x - lineWidth / 2;
								}
							} else if (section.textAlign === "right") {
								if (section.maxWidth) {
									currentX = section.x + section.maxWidth / 2 - lineWidth;
								} else {
									currentX = section.x - lineWidth;
								}
							} else {
								// Left align
								if (section.maxWidth) {
									currentX = section.x - section.maxWidth / 2;
								}
							}

							for (const segment of line) {
								const style = getEffectiveStyle(segment, section);
								ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
								ctx.fillStyle = style.color;

								if (style.textDecoration === "underline") {
									const textWidth = ctx.measureText(segment.text).width;
									ctx.beginPath();
									ctx.moveTo(currentX, currentY + 2);
									ctx.lineTo(currentX + textWidth, currentY + 2);
									ctx.strokeStyle = style.color;
									ctx.stroke();
								}

								ctx.fillText(segment.text, currentX, currentY);
								currentX += ctx.measureText(segment.text).width;
							}

							currentY += lineHeight;
						}
					}

					resolve(canvas.toDataURL());
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
			const rowData = csvData.rows[i];
			setCurrentProgress(i + 1);

			const dataUrl = await generateCertificate(rowData);
			if (dataUrl) {
				// Generate filename
				const filenameColumn = variableMapping["__filename__"];
				let filename = "certificate";
				if (filenameColumn && rowData[filenameColumn]) {
					filename = `certificate_${rowData[filenameColumn].replace(/[^a-zA-Z0-9]/g, "_")}`;
				} else {
					filename = `certificate_${i + 1}`;
				}

				newCertificates.push({
					id: `${Date.now()}-${i}`,
					filename: `${filename}.png`,
					dataUrl,
					rowData,
				});
			}

			// Add small delay to prevent UI freezing
			if (i < csvData.rows.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		}

		setCertificates(newCertificates);
		setIsGenerating(false);
	}, [csvData.rows, generateCertificate, variableMapping]);

	const downloadSingle = useCallback((certificate: GeneratedCertificate) => {
		const link = document.createElement("a");
		link.download = certificate.filename;
		link.href = certificate.dataUrl;
		link.click();
	}, []);

	const downloadAll = useCallback(async () => {
		if (certificates.length === 0) return;

		const zip = new JSZip();

		for (const certificate of certificates) {
			// Convert data URL to blob
			const response = await fetch(certificate.dataUrl);
			const blob = await response.blob();
			zip.file(certificate.filename, blob);
		}

		const zipBlob = await zip.generateAsync({ type: "blob" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(zipBlob);
		link.download = "certificates.zip";
		link.click();
		URL.revokeObjectURL(link.href);
	}, [certificates]);

	// Generate preview certificate on mount
	useEffect(() => {
		if (csvData.rows.length > 0) {
			generateCertificate(csvData.rows[0])
				.then((dataUrl) => {
					if (dataUrl) {
						setCertificates([
							{
								id: `preview-${Date.now()}`,
								filename: "preview.png",
								dataUrl,
								rowData: csvData.rows[0],
							},
						]);
					}
				})
				.catch((error) => {
					console.error("Error generating preview certificate:", error);
				});
		}
	}, [csvData.rows, generateCertificate]);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-slate-900">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
							<Download className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
							Certificate Generator
						</h1>
						<p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
							Generate and download your certificates with real data preview
						</p>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
										Total Certificates
									</p>
									<p className="text-3xl font-bold text-gray-900 dark:text-white">
										{csvData.rows.length}
									</p>
								</div>
								<div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
									<FileDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
										Generated
									</p>
									<p className="text-3xl font-bold text-gray-900 dark:text-white">
										{certificates.length}
									</p>
								</div>
								<div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
									<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
										Variables Mapped
									</p>
									<p className="text-3xl font-bold text-gray-900 dark:text-white">
										{Object.keys(variableMapping).length}
									</p>
								</div>
								<div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
									<Link className="w-6 h-6 text-purple-600 dark:text-purple-400" />
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
										Progress
									</p>
									<p className="text-3xl font-bold text-gray-900 dark:text-white">
										{Math.round(
											(certificates.length / csvData.rows.length) * 100,
										)}
										%
									</p>
								</div>
								<div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
									<Eye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
								</div>
							</div>
						</div>
					</div>

					{/* Generation Progress */}
					{isGenerating && (
						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
							<div className="flex items-center justify-center mb-6">
								<div className="flex items-center space-x-3">
									<div className="relative">
										<Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
											Generating Certificates
										</h3>
										<p className="text-sm text-gray-600 dark:text-slate-400">
											Please wait while we create your certificates...
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-600 dark:text-slate-400">
										Progress
									</span>
									<span className="font-medium text-blue-600 dark:text-blue-400">
										{currentProgress} of {csvData.rows.length}
									</span>
								</div>

								<div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
									<div
										className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
										style={{
											width: `${(currentProgress / csvData.rows.length) * 100}%`,
										}}
									/>
								</div>

								<div className="text-center">
									<p className="text-sm text-gray-600 dark:text-slate-400">
										{Math.round((currentProgress / csvData.rows.length) * 100)}%
										Complete
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Certificate Preview */}
					{certificates.length > 0 && (
						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 mb-8">
							<div className="flex justify-between items-center mb-6">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
										<Eye className="w-5 h-5 text-white" />
									</div>
									<div>
										<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
											Certificate Preview
										</h2>
										<p className="text-gray-600 dark:text-slate-400">
											Review your generated certificates
										</p>
									</div>
								</div>
								{certificates.length > 1 && (
									<div className="flex items-center space-x-2">
										<button
											type="button"
											onClick={() =>
												setPreviewIndex(Math.max(0, previewIndex - 1))
											}
											disabled={previewIndex === 0}
											className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
										>
											Previous
										</button>
										<span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium">
											{previewIndex + 1} of {certificates.length}
										</span>
										<button
											type="button"
											onClick={() =>
												setPreviewIndex(
													Math.min(certificates.length - 1, previewIndex + 1),
												)
											}
											disabled={previewIndex === certificates.length - 1}
											className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
										>
											Next
										</button>
									</div>
								)}
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
								{/* Certificate Image */}
								<div className="lg:col-span-2">
									<div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
										<Image
											src={certificates[previewIndex].dataUrl}
											alt={`Certificate ${previewIndex + 1}`}
											width={800}
											height={600}
											className="w-full h-auto rounded-lg shadow-sm"
										/>
									</div>
								</div>

								{/* Certificate Details */}
								<div className="space-y-6">
									<div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
											Certificate Data
										</h3>
										<div className="space-y-3">
											{Object.entries(certificates[previewIndex].rowData).map(
												([key, value]) => (
													<div
														key={key}
														className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-700 last:border-b-0"
													>
														<span className="text-sm font-medium text-gray-600 dark:text-slate-400">
															{key}:
														</span>
														<span className="text-sm text-gray-900 dark:text-white font-medium">
															{value}
														</span>
													</div>
												),
											)}
										</div>
									</div>

									<div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
											File Info
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between items-center">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Filename:
												</span>
												<span className="text-sm font-mono text-gray-900 dark:text-white">
													{certificates[previewIndex].filename}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-gray-600 dark:text-slate-400">
													Format:
												</span>
												<span className="text-sm text-gray-900 dark:text-white">
													PNG
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
						<div className="flex flex-col lg:flex-row justify-between items-center gap-6">
							<button
								type="button"
								onClick={onBack}
								className="flex items-center px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200 font-medium border border-gray-200 dark:border-slate-600"
							>
								<ArrowLeft className="w-5 h-5 mr-2" />
								Back to Mapping
							</button>

							<div className="flex flex-wrap justify-center gap-4">
								{!isGenerating && certificates.length < csvData.rows.length && (
									<button
										type="button"
										onClick={generateAllCertificates}
										className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
									>
										<Eye className="w-5 h-5 mr-2" />
										Generate All Certificates
									</button>
								)}

								{certificates.length > 0 && (
									<>
										<button
											type="button"
											onClick={() => downloadSingle(certificates[previewIndex])}
											className="flex items-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
										>
											<Download className="w-5 h-5 mr-2" />
											Download Current
										</button>

										{certificates.length > 1 && (
											<button
												type="button"
												onClick={downloadAll}
												className="flex items-center px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
											>
												<FileDown className="w-5 h-5 mr-2" />
												Download All (ZIP)
											</button>
										)}
									</>
								)}
							</div>
						</div>
					</div>

					{/* Hidden canvas for certificate generation */}
					<canvas ref={canvasRef} style={{ display: "none" }} />
				</div>
			</div>
		</div>
	);
}
