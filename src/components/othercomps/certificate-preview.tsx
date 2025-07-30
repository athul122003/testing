import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, Eye, RefreshCw, User } from "lucide-react";
import type { Section, CSVData, TextSegment } from "../types";

interface CertificatePreviewProps {
	templateImage: string;
	sections: Section[];
	csvData: CSVData;
	variableMapping: Record<string, string>;
	onNext: () => void;
	onBack: () => void;
}
export default function CertificatePreview({
	templateImage,
	sections,
	csvData,
	variableMapping,
	onNext,
	onBack,
}: CertificatePreviewProps) {
	const [currentRowIndex, setCurrentRowIndex] = useState(0);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

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

	const generatePreview = useCallback(() => {
		const canvas = canvasRef.current;
		const image = imageRef.current;
		if (!canvas || !image) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;

		ctx.drawImage(image, 0, 0);

		const currentRow = csvData.rows[currentRowIndex];

		sections.forEach((section) => {
			const processedSegments = section.segments.map((segment) => {
				if (segment.isVariable && segment.variableName) {
					const csvColumn = variableMapping[segment.variableName];
					const actualValue = csvColumn
						? currentRow[csvColumn] || segment.text
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
				...section.segments.map((s) => getEffectiveStyle(s, section).fontSize),
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
	}, [
		sections,
		csvData,
		variableMapping,
		currentRowIndex,
		getTextLines,
		getEffectiveStyle,
	]);

	useEffect(() => {
		generatePreview();
	}, [generatePreview]);

	const currentRow = csvData.rows[currentRowIndex];

	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Certificate Preview
				</h2>
				<p className="text-gray-600 dark:text-slate-400">
					Preview how your certificate will look with actual data
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center">
								<Eye className="w-5 h-5 mr-2" />
								Certificate Preview
							</h3>
							<div className="flex items-center space-x-2">
								<button
									type="button"
									onClick={() =>
										setCurrentRowIndex(Math.max(0, currentRowIndex - 1))
									}
									disabled={currentRowIndex === 0}
									className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-slate-600"
								>
									Previous
								</button>
								<span className="text-sm text-gray-600 dark:text-slate-400">
									{currentRowIndex + 1} of {csvData.rows.length}
								</span>
								<button
									type="button"
									onClick={() =>
										setCurrentRowIndex(
											Math.min(csvData.rows.length - 1, currentRowIndex + 1),
										)
									}
									disabled={currentRowIndex === csvData.rows.length - 1}
									className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-slate-600"
								>
									Next
								</button>
							</div>
						</div>

						<div className="relative overflow-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
							{/* @next/next/no-img-element is disabled because we need direct img element for canvas operations */}
							{/* eslint-disable @next/next/no-img-element */}
							<img
								ref={imageRef}
								src={templateImage}
								alt="Template for canvas processing"
								className="hidden"
								onLoad={generatePreview}
							/>
							{/* eslint-enable @next/next/no-img-element */}
							<canvas
								ref={canvasRef}
								className="max-w-full max-h-96"
								style={{ display: "block", margin: "0 auto" }}
							/>
						</div>

						<div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
							<div className="flex items-center justify-center">
								<RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
								<p className="text-blue-600 dark:text-blue-400 font-medium">
									Preview updates automatically as you navigate through records
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center">
							<User className="w-5 h-5 mr-2" />
							Current Record
						</h3>

						<div className="space-y-3">
							{Object.entries(currentRow).map(([key, value]) => (
								<div
									key={key}
									className="bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-600"
								>
									<div className="text-sm font-medium text-gray-700 dark:text-slate-300">
										{key}
									</div>
									<div className="text-gray-600 dark:text-slate-400">
										{value}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4">
							Variable Mapping
						</h3>

						<div className="space-y-2">
							{Object.entries(variableMapping).map(([variable, column]) => (
								<div
									key={variable}
									className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600 last:border-b-0"
								>
									<span className="text-sm font-medium text-purple-600 dark:text-purple-400">
										{variable}
									</span>
									<span className="text-sm text-gray-600 dark:text-slate-400">
										→ {column}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4">
							Generation Summary
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="bg-white dark:bg-slate-800 p-3 rounded text-center border border-gray-200 dark:border-slate-600">
								<div className="text-xl font-bold text-blue-600 dark:text-blue-400">
									{csvData.rows.length}
								</div>
								<div className="text-xs text-gray-600 dark:text-slate-400">
									Certificates
								</div>
							</div>
							<div className="bg-white dark:bg-slate-800 p-3 rounded text-center border border-gray-200 dark:border-slate-600">
								<div className="text-xl font-bold text-purple-600 dark:text-purple-400">
									{sections.length}
								</div>
								<div className="text-xs text-gray-600 dark:text-slate-400">
									Sections
								</div>
							</div>
							<div className="bg-white dark:bg-slate-800 p-3 rounded text-center border border-gray-200 dark:border-slate-600">
								<div className="text-xl font-bold text-green-600 dark:text-green-400">
									{Object.keys(variableMapping).length}
								</div>
								<div className="text-xs text-gray-600 dark:text-slate-400">
									Variables
								</div>
							</div>
							<div className="bg-white dark:bg-slate-800 p-3 rounded text-center border border-gray-200 dark:border-slate-600">
								<div className="text-xl font-bold text-orange-600 dark:text-orange-400">
									{csvData.headers.length}
								</div>
								<div className="text-xs text-gray-600 dark:text-slate-400">
									Data Fields
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-between mt-8">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium border border-gray-200 dark:border-slate-600"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>

				<button
					type="button"
					onClick={onNext}
					className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
				>
					Generate All Certificates
					<ArrowRight className="w-4 h-4 ml-2" />
				</button>
			</div>
		</div>
	);
}
