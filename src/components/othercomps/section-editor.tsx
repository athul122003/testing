import React, { useState, useRef, useCallback } from "react";
import {
	Plus,
	Settings,
	Trash2,
	Type,
	ArrowLeft,
	ArrowRight,
	Move,
	Bold,
	Underline,
	Hash,
	Edit3,
	FileImage,
	AlignCenter,
	Edit,
} from "lucide-react";
import type { Section, TextSegment } from "../types";

interface SectionEditorProps {
	templateImage: string;
	sections: Section[];
	onSectionsChange: (sections: Section[]) => void;
	onNext: () => void;
	onBack: () => void;
}

export default function SectionEditor({
	templateImage,
	sections,
	onSectionsChange,
	onNext,
	onBack,
}: SectionEditorProps) {
	const [selectedSection, setSelectedSection] = useState<string | null>(null);
	const [isAddingSection, setIsAddingSection] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [snapGuides, setSnapGuides] = useState({
		horizontal: false,
		vertical: false,
		x: 0,
		y: 0,
	});
	const [isSnapping, setIsSnapping] = useState(false);
	const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	const SNAP_THRESHOLD = 15;

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

	const parseTextIntoSegments = useCallback(
		(text: string, existingSegments?: TextSegment[]): TextSegment[] => {
			const segments: TextSegment[] = [];
			const regex = /\{\{([^}]+)\}\}/g;
			let lastIndex = 0;
			// biome-ignore lint/suspicious/noImplicitAnyLet: regex.exec() returns RegExpExecArray | null
			let match;
			let segmentCounter = 0;
			const findExistingSegment = (
				content: string,
				isVariable: boolean,
				variableName?: string,
				position?: number,
			) => {
				if (!existingSegments) return null;

				return existingSegments.find((segment) => {
					if (isVariable && segment.isVariable) {
						return segment.variableName === variableName;
					} else if (!isVariable && !segment.isVariable) {
						const segmentText = segment.text.trim();
						const newText = content.trim();

						if (segmentText === newText) return true;

						if (segmentText.length > 0 && newText.length > 0) {
							const existingPosition = existingSegments.indexOf(segment);
							if (Math.abs(existingPosition - (position || 0)) <= 1) {
								return (
									segmentText.includes(newText) || newText.includes(segmentText)
								);
							}
						}
					}
					return false;
				});
			};

			// biome-ignore lint/suspicious/noAssignInExpressions: while loop requires assignment in condition
			while ((match = regex.exec(text)) !== null) {
				if (match.index > lastIndex) {
					const beforeText = text.slice(lastIndex, match.index);
					if (beforeText) {
						const existingSegment = findExistingSegment(
							beforeText,
							false,
							undefined,
							segmentCounter,
						);
						segments.push({
							id:
								existingSegment?.id ||
								`segment-${Date.now()}-${segmentCounter}`,
							text: beforeText,
							isVariable: false,
							...(existingSegment?.fontSize !== undefined && {
								fontSize: existingSegment.fontSize,
							}),
							...(existingSegment?.fontFamily !== undefined && {
								fontFamily: existingSegment.fontFamily,
							}),
							...(existingSegment?.color !== undefined && {
								color: existingSegment.color,
							}),
							...(existingSegment?.fontWeight !== undefined && {
								fontWeight: existingSegment.fontWeight,
							}),
							...(existingSegment?.textDecoration !== undefined && {
								textDecoration: existingSegment.textDecoration,
							}),
						});
						segmentCounter++;
					}
				}

				const variableName = match[1].trim();
				const variableText = `{{${match[1]}}}`;
				const existingSegment = findExistingSegment(
					variableText,
					true,
					variableName,
					segmentCounter,
				);
				segments.push({
					id: existingSegment?.id || `segment-${Date.now()}-${segmentCounter}`,
					text: variableText,
					isVariable: true,
					variableName: variableName,
					...(existingSegment?.fontSize !== undefined && {
						fontSize: existingSegment.fontSize,
					}),
					...(existingSegment?.fontFamily !== undefined && {
						fontFamily: existingSegment.fontFamily,
					}),
					...(existingSegment?.color !== undefined && {
						color: existingSegment.color,
					}),
					...(existingSegment?.fontWeight !== undefined && {
						fontWeight: existingSegment.fontWeight,
					}),
					...(existingSegment?.textDecoration !== undefined && {
						textDecoration: existingSegment.textDecoration,
					}),
				});
				segmentCounter++;

				lastIndex = regex.lastIndex;
			}

			if (lastIndex < text.length) {
				const remainingText = text.slice(lastIndex);
				if (remainingText) {
					const existingSegment = findExistingSegment(
						remainingText,
						false,
						undefined,
						segmentCounter,
					);
					segments.push({
						id:
							existingSegment?.id || `segment-${Date.now()}-${segmentCounter}`,
						text: remainingText,
						isVariable: false,
						...(existingSegment?.fontSize !== undefined && {
							fontSize: existingSegment.fontSize,
						}),
						...(existingSegment?.fontFamily !== undefined && {
							fontFamily: existingSegment.fontFamily,
						}),
						...(existingSegment?.color !== undefined && {
							color: existingSegment.color,
						}),
						...(existingSegment?.fontWeight !== undefined && {
							fontWeight: existingSegment.fontWeight,
						}),
						...(existingSegment?.textDecoration !== undefined && {
							textDecoration: existingSegment.textDecoration,
						}),
					});
				}
			}

			return segments.length > 0
				? segments
				: [
						{
							id: `segment-${Date.now()}`,
							text: text || "Sample Text",
							isVariable: false,
						},
					];
		},
		[],
	);

	const addSection = useCallback(
		(x: number, y: number) => {
			const sectionName = `Section ${sections.length + 1}`;
			const newSection: Section = {
				id: `section-${Date.now()}`,
				name: sectionName,
				x,
				y,
				textAlign: "center",
				maxWidth: 300,
				segments: parseTextIntoSegments("Sample Text"),
				rawText: "Sample Text",
				defaultFontSize: 24,
				defaultFontFamily: "Arial",
				defaultColor: "#000000",
				defaultFontWeight: "normal",
				defaultTextDecoration: "none",
			};
			onSectionsChange([...sections, newSection]);
			setSelectedSection(newSection.id);
			setIsAddingSection(false);
		},
		[sections, onSectionsChange, parseTextIntoSegments],
	);

	const updateSection = useCallback(
		(id: string, updates: Partial<Section>) => {
			const updatedSections = sections.map((s) => {
				if (s.id === id) {
					const updated = { ...s, ...updates };
					if (updates.rawText !== undefined) {
						updated.segments = parseTextIntoSegments(
							updates.rawText,
							s.segments,
						);
					}
					return updated;
				}
				return s;
			});
			onSectionsChange(updatedSections);
		},
		[sections, onSectionsChange, parseTextIntoSegments],
	);

	const updateSegment = useCallback(
		(sectionId: string, segmentId: string, updates: Partial<TextSegment>) => {
			const updatedSections = sections.map((section) => {
				if (section.id === sectionId) {
					const updatedSegments = section.segments.map((segment) =>
						segment.id === segmentId ? { ...segment, ...updates } : segment,
					);
					return { ...section, segments: updatedSegments };
				}
				return section;
			});
			onSectionsChange(updatedSections);
		},
		[sections, onSectionsChange],
	);

	const resetSegmentToSectionDefaults = useCallback(
		(sectionId: string, segmentId: string) => {
			const updatedSections = sections.map((section) => {
				if (section.id === sectionId) {
					const updatedSegments = section.segments.map((segment) => {
						if (segment.id === segmentId) {
							const {
								fontSize: _fontSize,
								fontFamily: _fontFamily,
								color: _color,
								fontWeight: _fontWeight,
								textDecoration: _textDecoration,
								...rest
							} = segment;
							return rest;
						}
						return segment;
					});
					return { ...section, segments: updatedSegments };
				}
				return section;
			});
			onSectionsChange(updatedSections);
		},
		[sections, onSectionsChange],
	);

	const deleteSection = useCallback(
		(id: string) => {
			const filteredSections = sections.filter((s) => s.id !== id);
			onSectionsChange(filteredSections);
			setSelectedSection(null);
		},
		[sections, onSectionsChange],
	);

	const getCanvasCoordinates = useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;

			const x = (event.clientX - rect.left) * scaleX;
			const y = (event.clientY - rect.top) * scaleY;

			return { x, y };
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

	const getSectionBounds = useCallback(
		(section: Section) => {
			const canvas = canvasRef.current;
			if (!canvas) return null;

			const ctx = canvas.getContext("2d");
			if (!ctx) return null;

			const lines = getTextLines(
				section.segments,
				section,
				section.maxWidth,
				ctx,
			);
			const maxFontSize = Math.max(
				...section.segments.map((s) => getEffectiveStyle(s, section).fontSize),
			);
			const lineHeight = maxFontSize + 5;
			const totalHeight = lines.length * lineHeight - 5;

			let maxLineWidth = 0;
			for (const line of lines) {
				let lineWidth = 0;
				for (const segment of line) {
					const style = getEffectiveStyle(segment, section);
					ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
					lineWidth += ctx.measureText(segment.text).width;
				}
				maxLineWidth = Math.max(maxLineWidth, lineWidth);
			}

			const boundingWidth = section.maxWidth || maxLineWidth;

			let boundingX = section.x;
			if (section.textAlign === "center") {
				boundingX = section.x - boundingWidth / 2;
			} else if (section.textAlign === "right") {
				boundingX = section.x - boundingWidth;
			}

			return {
				left: boundingX,
				right: boundingX + boundingWidth,
				top: section.y - maxFontSize,
				bottom: section.y + totalHeight - maxFontSize,
				width: boundingWidth,
				height: totalHeight,
			};
		},
		[getTextLines, getEffectiveStyle],
	);

	const checkSnapToCenter = useCallback((x: number, y: number) => {
		const canvas = canvasRef.current;
		if (!canvas)
			return {
				x,
				y,
				guides: { horizontal: false, vertical: false, x: 0, y: 0 },
			};

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		let snapX = x;
		let snapY = y;
		let horizontalSnap = false;
		let verticalSnap = false;

		if (Math.abs(x - centerX) <= SNAP_THRESHOLD) {
			snapX = centerX;
			verticalSnap = true;
		}

		if (Math.abs(y - centerY) <= SNAP_THRESHOLD) {
			snapY = centerY;
			horizontalSnap = true;
		}

		return {
			x: snapX,
			y: snapY,
			guides: {
				horizontal: horizontalSnap,
				vertical: verticalSnap,
				x: centerX,
				y: centerY,
			},
		};
	}, []);

	const getSectionAtPosition = useCallback(
		(x: number, y: number) => {
			for (const section of sections) {
				const bounds = getSectionBounds(section);
				if (!bounds) continue;

				const resizeHandleArea = {
					left: bounds.right - 10,
					right: bounds.right + 10,
					top: bounds.top,
					bottom: bounds.bottom,
				};

				if (
					x >= resizeHandleArea.left &&
					x <= resizeHandleArea.right &&
					y >= resizeHandleArea.top &&
					y <= resizeHandleArea.bottom
				) {
					return { section, isResizeHandle: true };
				}

				if (
					x >= bounds.left - 10 &&
					x <= bounds.right + 10 &&
					y >= bounds.top - 10 &&
					y <= bounds.bottom + 10
				) {
					return { section, isResizeHandle: false };
				}
			}
			return null;
		},
		[sections, getSectionBounds],
	);

	const handleCanvasMouseDown = useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const { x, y } = getCanvasCoordinates(event);

			if (isAddingSection) {
				addSection(x, y);
				return;
			}

			const result = getSectionAtPosition(x, y);

			if (result) {
				setSelectedSection(result.section.id);

				if (result.isResizeHandle) {
					setIsResizing(true);
					const bounds = getSectionBounds(result.section);
					if (bounds) {
						setDragOffset({ x: x - bounds.width, y: 0 });
					}
				} else {
					setIsDragging(true);
					setDragOffset({
						x: x - result.section.x,
						y: y - result.section.y,
					});
				}
			} else {
				setSelectedSection(null);
			}
		},
		[
			isAddingSection,
			addSection,
			getCanvasCoordinates,
			getSectionAtPosition,
			getSectionBounds,
		],
	);

	const handleCanvasMouseMove = useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const { x, y } = getCanvasCoordinates(event);

			if (isResizing && selectedSection) {
				const newWidth = Math.max(50, x - dragOffset.x);
				updateSection(selectedSection, { maxWidth: newWidth });
				setSnapGuides({ horizontal: false, vertical: false, x: 0, y: 0 });
			} else if (isDragging && selectedSection) {
				const rawX = x - dragOffset.x;
				const rawY = y - dragOffset.y;

				const snapResult = checkSnapToCenter(rawX, rawY);

				setSnapGuides(snapResult.guides);
				setIsSnapping(
					snapResult.guides.horizontal || snapResult.guides.vertical,
				);

				updateSection(selectedSection, {
					x: snapResult.x,
					y: snapResult.y,
				});
			} else {
				setSnapGuides({ horizontal: false, vertical: false, x: 0, y: 0 });
				setIsSnapping(false);
			}
		},
		[
			isDragging,
			isResizing,
			selectedSection,
			dragOffset,
			getCanvasCoordinates,
			updateSection,
			checkSnapToCenter,
		],
	);

	const handleCanvasMouseUp = useCallback(() => {
		setIsDragging(false);
		setIsResizing(false);
		setDragOffset({ x: 0, y: 0 });
		setSnapGuides({ horizontal: false, vertical: false, x: 0, y: 0 });
		setIsSnapping(false);
	}, []);

	const drawCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		const image = imageRef.current;
		if (!canvas || !image) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;

		ctx.drawImage(image, 0, 0);

		if (snapGuides.horizontal || snapGuides.vertical) {
			ctx.strokeStyle = "#EF4444";
			ctx.lineWidth = 2;
			ctx.setLineDash([8, 4]);

			if (snapGuides.horizontal) {
				ctx.beginPath();
				ctx.moveTo(0, snapGuides.y);
				ctx.lineTo(canvas.width, snapGuides.y);
				ctx.stroke();
			}

			if (snapGuides.vertical) {
				ctx.beginPath();
				ctx.moveTo(snapGuides.x, 0);
				ctx.lineTo(snapGuides.x, canvas.height);
				ctx.stroke();
			}

			ctx.setLineDash([]);
		}

		sections.forEach((section) => {
			const bounds = getSectionBounds(section);
			if (!bounds) return;

			if (selectedSection === section.id) {
				if (isSnapping) {
					ctx.shadowColor = "#EF4444";
					ctx.shadowBlur = 10;
					ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
					ctx.fillRect(
						bounds.left - 5,
						bounds.top - 5,
						bounds.width + 10,
						bounds.height + 10,
					);
					ctx.shadowBlur = 0;
				} else {
					ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
					ctx.fillRect(
						bounds.left - 5,
						bounds.top - 5,
						bounds.width + 10,
						bounds.height + 10,
					);
				}

				ctx.strokeStyle = isSnapping ? "#EF4444" : "#3B82F6";
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 5]);
				ctx.strokeRect(
					bounds.left - 5,
					bounds.top - 5,
					bounds.width + 10,
					bounds.height + 10,
				);
				ctx.setLineDash([]);

				ctx.fillStyle = isSnapping ? "#EF4444" : "#3B82F6";
				ctx.beginPath();
				const maxFontSize = Math.max(
					...section.segments.map(
						(s) => getEffectiveStyle(s, section).fontSize,
					),
				);
				ctx.arc(section.x, section.y - maxFontSize / 2, 4, 0, 2 * Math.PI);
				ctx.fill();

				ctx.fillStyle = "#FFFFFF";
				ctx.beginPath();
				ctx.arc(section.x, section.y - maxFontSize / 2, 2, 0, 2 * Math.PI);
				ctx.fill();

				if (section.maxWidth) {
					ctx.fillStyle = "#10B981";
					ctx.fillRect(bounds.right - 3, bounds.top, 6, bounds.height);

					ctx.fillStyle = "#FFFFFF";
					ctx.fillRect(
						bounds.right - 1,
						bounds.top + bounds.height / 2 - 8,
						2,
						4,
					);
					ctx.fillRect(
						bounds.right - 1,
						bounds.top + bounds.height / 2 + 4,
						2,
						4,
					);
				}

				if (section.maxWidth) {
					ctx.strokeStyle = "#10B981";
					ctx.lineWidth = 1;
					ctx.setLineDash([3, 3]);
					ctx.beginPath();
					ctx.moveTo(bounds.left, bounds.bottom + 5);
					ctx.lineTo(bounds.right, bounds.bottom + 5);
					ctx.stroke();
					ctx.setLineDash([]);
				}
			}

			const lines = getTextLines(
				section.segments,
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
						currentX = bounds.left + section.maxWidth / 2 - lineWidth / 2;
					} else {
						currentX = section.x - lineWidth / 2;
					}
				} else if (section.textAlign === "right") {
					if (section.maxWidth) {
						currentX = bounds.right - lineWidth;
					} else {
						currentX = section.x - lineWidth;
					}
				} else {
					if (section.maxWidth) {
						currentX = bounds.left;
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

					if (segment.isVariable) {
						ctx.fillStyle = "rgba(147, 51, 234, 0.1)";
						const textWidth = ctx.measureText(segment.text).width;
						ctx.fillRect(
							currentX - 2,
							y - style.fontSize,
							textWidth + 4,
							style.fontSize + 4,
						);
						ctx.fillStyle = style.color;
					}

					ctx.fillText(segment.text, currentX, y);
					currentX += ctx.measureText(segment.text).width;
				}
			});
		});
	}, [
		sections,
		selectedSection,
		getSectionBounds,
		getTextLines,
		snapGuides,
		isSnapping,
		getEffectiveStyle,
	]);

	React.useEffect(() => {
		drawCanvas();
	}, [drawCanvas]);

	const selectedSectionData = sections.find((s) => s.id === selectedSection);

	return (
		<div className="bg-gray-50 dark:bg-slate-900 min-h-screen p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Certificate Editor
					</h2>
					<p className="text-gray-600 dark:text-slate-400">
						Design your certificate with text sections and variables using{" "}
						{"{{"} variable {"}}"} syntax
					</p>
				</div>

				{/* Main Editor Layout */}
				<div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
					{/* Canvas Section - Takes up main area */}
					<div className="xl:col-span-3">
						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
							<div className="flex justify-between items-center mb-6">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
										<FileImage className="w-5 h-5 text-white" />
									</div>
									<div>
										<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
											Template Canvas
										</h3>
										<p className="text-gray-600 dark:text-slate-400">
											Click and drag to position text sections
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setIsAddingSection(!isAddingSection)}
									className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
										isAddingSection
											? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30"
											: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30"
									}`}
								>
									<Plus className="w-5 h-5 mr-2" />
									{isAddingSection ? "Cancel Adding" : "Add Section"}
								</button>
							</div>

							<div className="relative overflow-auto bg-gray-50 dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
								{/* biome-ignore lint: Hidden image for canvas rendering purposes */}
								<img
									ref={imageRef}
									src={templateImage}
									alt="Template"
									className="hidden"
									onLoad={drawCanvas}
								/>
								<canvas
									ref={canvasRef}
									onMouseDown={handleCanvasMouseDown}
									onMouseMove={handleCanvasMouseMove}
									onMouseUp={handleCanvasMouseUp}
									onMouseLeave={handleCanvasMouseUp}
									className={`max-w-full max-h-96 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm ${
										isAddingSection
											? "cursor-crosshair"
											: isDragging
												? "cursor-grabbing"
												: isResizing
													? "cursor-ew-resize"
													: "cursor-pointer"
									}`}
									style={{ display: "block", margin: "0 auto" }}
								/>
							</div>

							{isAddingSection && (
								<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-700">
									<p className="text-blue-600 dark:text-blue-400 font-medium">
										Click anywhere on the template to add a new text section
									</p>
								</div>
							)}

							{selectedSection && !isAddingSection && (
								<div className="mt-4 space-y-3">
									<div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
										<div className="flex items-center justify-center mb-2">
											<Move className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
											<p className="text-green-600 dark:text-green-400 font-medium">
												Drag to move • Drag green handle to resize
											</p>
										</div>
										<div className="text-center text-sm text-green-600 dark:text-green-400">
											<Hash className="w-4 h-4 inline mr-1" />
											Use {"{{"} variable {"}}"} syntax for dynamic content
										</div>
									</div>

									{isSnapping && (
										<div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
											<div className="flex items-center justify-center">
												<div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
												<p className="text-red-600 dark:text-red-400 font-medium">
													{snapGuides.horizontal && snapGuides.vertical
														? "Snapping to center"
														: snapGuides.horizontal
															? "Snapping to horizontal center"
															: "Snapping to vertical center"}
												</p>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Controls Panel - Split into two columns */}
					<div className="xl:col-span-2 space-y-6">
						{/* Sections List */}
						<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<Type className="w-5 h-5 text-gray-600 dark:text-slate-400" />
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
										Sections ({sections.length})
									</h3>
								</div>
								{sections.length > 0 && (
									<span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
										{
											sections.filter((s) =>
												s.segments.some((seg) => seg.isVariable),
											).length
										}{" "}
										with variables
									</span>
								)}
							</div>

							<div className="space-y-2 max-h-48 overflow-y-auto">
								{sections.map((section) => (
									// biome-ignore lint/a11y/noStaticElementInteractions: clickable div for section selection
									// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard navigation not required for this use case
									<div
										key={section.id}
										className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
											selectedSection === section.id
												? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
												: "border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500"
										}`}
										onClick={() => setSelectedSection(section.id)}
									>
										<div className="flex justify-between items-center">
											<div className="flex items-center">
												<Move className="w-4 h-4 text-gray-400 mr-2" />
												<span className="font-medium text-gray-700 dark:text-slate-300">
													{section.name}
												</span>
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													deleteSection(section.id);
												}}
												className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
										<div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
											{section.segments.filter((s) => s.isVariable).length}{" "}
											variables • Position: ({Math.round(section.x)},{" "}
											{Math.round(section.y)})
										</div>
										<div className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">
											{section.rawText}
										</div>
									</div>
								))}

								{sections.length === 0 && (
									<div className="text-center py-8 text-gray-500 dark:text-slate-400">
										<Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p>No sections added yet</p>
										<p className="text-sm">Click "Add Section" to start</p>
									</div>
								)}
							</div>
						</div>

						{/* Section Editor */}
						{selectedSectionData && (
							<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
								<div className="flex items-center space-x-2 mb-4">
									<Edit3 className="w-5 h-5 text-gray-600 dark:text-slate-400" />
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
										Edit Section
									</h3>
								</div>

								<div className="space-y-4">
									{/* Basic Section Properties - Horizontal Layout */}
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="section-name"
												className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
											>
												Section Name
											</label>
											<input
												id="section-name"
												type="text"
												value={selectedSectionData.name}
												onChange={(e) =>
													updateSection(selectedSectionData.id, {
														name: e.target.value,
													})
												}
												className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											/>
										</div>

										<div>
											<label
												htmlFor="text-align"
												className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
											>
												Text Alignment
											</label>
											<select
												id="text-align"
												value={selectedSectionData.textAlign}
												onChange={(e) =>
													updateSection(selectedSectionData.id, {
														textAlign: e.target.value as
															| "left"
															| "center"
															| "right",
													})
												}
												className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											>
												<option value="left">Left</option>
												<option value="center">Center</option>
												<option value="right">Right</option>
											</select>
										</div>
									</div>

									{/* Text Content */}
									<div>
										<label
											htmlFor="text-content"
											className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
										>
											Text Content
											<span className="text-purple-600 dark:text-purple-400 text-xs ml-2">
												Use {"{{"} variable {"}}"} for dynamic content
											</span>
										</label>
										<textarea
											id="text-content"
											value={selectedSectionData.rawText}
											onChange={(e) =>
												updateSection(selectedSectionData.id, {
													rawText: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
											rows={3}
											placeholder="Enter text with variables, e.g., 'Hello {{name}}, you completed {{course}}'"
										/>
									</div>

									{/* Style Controls - Horizontal Layout */}
									<div className="border-t border-gray-200 dark:border-slate-600 pt-4">
										<h4 className="text-md font-semibold text-gray-800 dark:text-slate-200 mb-3">
											Section Styling
										</h4>
										<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
											<div>
												<label
													htmlFor="font-size"
													className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
												>
													Font Size
												</label>
												<input
													id="font-size"
													type="number"
													value={selectedSectionData.defaultFontSize}
													onChange={(e) =>
														updateSection(selectedSectionData.id, {
															defaultFontSize: parseInt(e.target.value) || 24,
														})
													}
													className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>

											<div>
												<label
													htmlFor="color"
													className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
												>
													Color
												</label>
												<input
													id="color"
													type="color"
													value={selectedSectionData.defaultColor}
													onChange={(e) =>
														updateSection(selectedSectionData.id, {
															defaultColor: e.target.value,
														})
													}
													className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg"
												/>
											</div>

											<div>
												<label
													htmlFor="x-position"
													className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
												>
													X Position
												</label>
												<input
													id="x-position"
													type="number"
													value={Math.round(selectedSectionData.x)}
													onChange={(e) =>
														updateSection(selectedSectionData.id, {
															x: parseInt(e.target.value) || 0,
														})
													}
													className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>

											<div>
												<label
													htmlFor="y-position"
													className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
												>
													Y Position
												</label>
												<input
													id="y-position"
													type="number"
													value={Math.round(selectedSectionData.y)}
													onChange={(e) =>
														updateSection(selectedSectionData.id, {
															y: parseInt(e.target.value) || 0,
														})
													}
													className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
											<div>
												<label
													htmlFor="font-family"
													className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
												>
													Font Family
												</label>
												<select
													id="font-family"
													value={selectedSectionData.defaultFontFamily}
													onChange={(e) =>
														updateSection(selectedSectionData.id, {
															defaultFontFamily: e.target.value,
														})
													}
													className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												>
													<option value="Arial">Arial</option>
													<option value="Georgia">Georgia</option>
													<option value="Times New Roman">
														Times New Roman
													</option>
													<option value="Courier New">Courier New</option>
													<option value="Verdana">Verdana</option>
												</select>
											</div>

											<div>
												<div className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
													Max Width (text wrapping)
												</div>
												<div className="flex items-center space-x-2">
													<input
														type="number"
														value={selectedSectionData.maxWidth || ""}
														onChange={(e) =>
															updateSection(selectedSectionData.id, {
																maxWidth: e.target.value
																	? parseInt(e.target.value)
																	: undefined,
															})
														}
														placeholder="No limit"
														className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
													<button
														type="button"
														onClick={() =>
															updateSection(selectedSectionData.id, {
																maxWidth: undefined,
															})
														}
														className="px-3 py-2 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 text-sm"
													>
														Clear
													</button>
												</div>
											</div>
										</div>

										{/* Style Buttons - Horizontal Layout */}
										<div className="flex flex-wrap gap-2 mt-3">
											<button
												type="button"
												onClick={() =>
													updateSection(selectedSectionData.id, {
														defaultFontWeight:
															selectedSectionData.defaultFontWeight === "bold"
																? "normal"
																: "bold",
													})
												}
												className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
													selectedSectionData.defaultFontWeight === "bold"
														? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
														: "bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-500"
												}`}
											>
												<Bold className="w-4 h-4 mr-1" />
												Bold
											</button>
											<button
												type="button"
												onClick={() =>
													updateSection(selectedSectionData.id, {
														defaultTextDecoration:
															selectedSectionData.defaultTextDecoration ===
															"underline"
																? "none"
																: "underline",
													})
												}
												className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
													selectedSectionData.defaultTextDecoration ===
													"underline"
														? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
														: "bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-500"
												}`}
											>
												<Underline className="w-4 h-4 mr-1" />
												Underline
											</button>
										</div>

										{/* Quick Actions - Horizontal Layout */}
										<div className="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
											<div className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
												Quick Actions
											</div>
											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													onClick={() => {
														const canvas = canvasRef.current;
														if (canvas) {
															updateSection(selectedSectionData.id, {
																x: canvas.width / 2,
															});
														}
													}}
													className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors"
												>
													<AlignCenter className="w-4 h-4 mr-1" />
													Center H
												</button>
												<button
													type="button"
													onClick={() => {
														const canvas = canvasRef.current;
														if (canvas) {
															updateSection(selectedSectionData.id, {
																y: canvas.height / 2,
															});
														}
													}}
													className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors"
												>
													<AlignCenter className="w-4 h-4 mr-1" />
													Center V
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Individual Text Segments - Full Width */}
				{selectedSectionData && selectedSectionData.segments.length > 0 && (
					<div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center space-x-2">
								<Edit className="w-5 h-5 text-gray-600 dark:text-slate-400" />
								<h4 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
									Individual Text Segments
								</h4>
							</div>
							<span className="text-xs text-gray-500 dark:text-slate-400">
								Override section defaults
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{selectedSectionData.segments.map((segment, index) => {
								const effectiveStyle = getEffectiveStyle(
									segment,
									selectedSectionData,
								);
								const hasCustomStyles =
									segment.fontSize !== undefined ||
									segment.fontFamily !== undefined ||
									segment.color !== undefined ||
									segment.fontWeight !== undefined ||
									segment.textDecoration !== undefined;

								return (
									// biome-ignore lint/a11y/noStaticElementInteractions: segment selection requires interactive div
									<div
										key={segment.id}
										className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
											selectedSegment === segment.id
												? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400"
												: segment.isVariable
													? "border-purple-200 dark:border-purple-700 bg-purple-25 dark:bg-purple-900/10"
													: "border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500"
										}`}
										onClick={() =>
											setSelectedSegment(
												selectedSegment === segment.id ? null : segment.id,
											)
										}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setSelectedSegment(
													selectedSegment === segment.id ? null : segment.id,
												);
											}
										}}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center">
												{segment.isVariable ? (
													<Hash className="w-4 h-4 text-purple-500 mr-2" />
												) : (
													<Type className="w-4 h-4 text-gray-400 mr-2" />
												)}
												<span
													className={`text-sm font-medium ${
														segment.isVariable
															? "text-purple-700 dark:text-purple-300"
															: "text-gray-700 dark:text-slate-300"
													}`}
												>
													{segment.isVariable
														? `{{${segment.variableName}}}`
														: `Text #${index + 1}`}
												</span>
											</div>
											<div className="flex items-center space-x-1">
												{hasCustomStyles && (
													<span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded">
														Custom
													</span>
												)}
												{effectiveStyle.fontWeight === "bold" && (
													<Bold className="w-3 h-3 text-gray-500" />
												)}
												{effectiveStyle.textDecoration === "underline" && (
													<Underline className="w-3 h-3 text-gray-500" />
												)}
											</div>
										</div>
										<div className="text-xs text-gray-500 dark:text-slate-400 truncate mb-3">
											{segment.text}
										</div>

										{selectedSegment === segment.id && (
											<div className="pt-3 border-t border-gray-200 dark:border-slate-600 space-y-3">
												<div className="flex justify-between items-center">
													<span className="text-xs font-medium text-gray-700 dark:text-slate-300">
														Custom Styling
													</span>
													{hasCustomStyles && (
														<button
															type="button"
															onClick={() =>
																resetSegmentToSectionDefaults(
																	selectedSectionData.id,
																	segment.id,
																)
															}
															className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
														>
															Reset to Defaults
														</button>
													)}
												</div>

												<div className="grid grid-cols-2 gap-2">
													<div>
														<label
															htmlFor={`segment-font-size-${segment.id}`}
															className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
														>
															Font Size
														</label>
														<input
															id={`segment-font-size-${segment.id}`}
															type="number"
															value={segment.fontSize ?? ""}
															placeholder={selectedSectionData.defaultFontSize.toString()}
															onChange={(e) =>
																updateSegment(
																	selectedSectionData.id,
																	segment.id,
																	{
																		fontSize: e.target.value
																			? parseInt(e.target.value)
																			: undefined,
																	},
																)
															}
															className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
														/>
													</div>
													<div>
														<label
															htmlFor={`segment-color-${segment.id}`}
															className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
														>
															Color
														</label>
														<input
															id={`segment-color-${segment.id}`}
															type="color"
															value={
																segment.color ??
																selectedSectionData.defaultColor
															}
															onChange={(e) =>
																updateSegment(
																	selectedSectionData.id,
																	segment.id,
																	{ color: e.target.value },
																)
															}
															className="w-full h-8 border border-gray-300 dark:border-slate-600 rounded"
														/>
													</div>
												</div>

												<div>
													<label
														htmlFor={`segment-font-family-${segment.id}`}
														className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
													>
														Font Family
													</label>
													<select
														id={`segment-font-family-${segment.id}`}
														value={segment.fontFamily ?? ""}
														onChange={(e) =>
															updateSegment(
																selectedSectionData.id,
																segment.id,
																{
																	fontFamily: e.target.value || undefined,
																},
															)
														}
														className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
													>
														<option value="">
															Use Section Default (
															{selectedSectionData.defaultFontFamily})
														</option>
														<option value="Arial">Arial</option>
														<option value="Georgia">Georgia</option>
														<option value="Times New Roman">
															Times New Roman
														</option>
														<option value="Courier New">Courier New</option>
														<option value="Verdana">Verdana</option>
													</select>
												</div>

												<div className="flex space-x-2">
													<button
														type="button"
														onClick={() =>
															updateSegment(
																selectedSectionData.id,
																segment.id,
																{
																	fontWeight:
																		effectiveStyle.fontWeight === "bold"
																			? "normal"
																			: "bold",
																},
															)
														}
														className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
															effectiveStyle.fontWeight === "bold"
																? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
																: "bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-500"
														}`}
													>
														<Bold className="w-3 h-3 mr-1" />
														Bold
													</button>
													<button
														type="button"
														onClick={() =>
															updateSegment(
																selectedSectionData.id,
																segment.id,
																{
																	textDecoration:
																		effectiveStyle.textDecoration ===
																		"underline"
																			? "none"
																			: "underline",
																},
															)
														}
														className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
															effectiveStyle.textDecoration === "underline"
																? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
																: "bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-500"
														}`}
													>
														<Underline className="w-3 h-3 mr-1" />
														Underline
													</button>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Navigation */}
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
						disabled={sections.length === 0}
						className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next: Upload CSV
						<ArrowRight className="w-4 h-4 ml-2" />
					</button>
				</div>
			</div>
		</div>
	);
}
