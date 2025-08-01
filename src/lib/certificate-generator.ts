import type { Section, TextSegment } from "../components/types";
import type { EventParticipant } from "./certificate-types";
import { availableVariables } from "./certificate-types";
import type { ExtendedEvent } from "../actions/event";

export interface CertificateGenerationOptions {
	templateImage: string;
	sections: Section[];
	participant: EventParticipant;
	selectedEvent: ExtendedEvent;
	variableMapping: Record<string, string>;
	extraData?: Record<string, string>;
	filenameFormat: string[];
}

// Helper function to get effective style for a segment
function getEffectiveStyle(segment: TextSegment, section: Section) {
	return {
		fontSize: segment.fontSize || section.defaultFontSize || 20,
		fontFamily: segment.fontFamily || section.defaultFontFamily || "Arial",
		fontWeight: segment.fontWeight || section.defaultFontWeight || "normal",
		color: segment.color || section.defaultColor || "#000000",
	};
}

// Helper function to break text into lines based on max width
function getTextLines(
	segments: TextSegment[],
	section: Section,
	maxWidth: number | undefined,
	ctx: CanvasRenderingContext2D,
): TextSegment[][] {
	if (!maxWidth) {
		return [segments];
	}

	const lines: TextSegment[][] = [];
	let currentLine: TextSegment[] = [];
	let currentWidth = 0;

	for (const segment of segments) {
		const style = getEffectiveStyle(segment, section);
		ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
		const segmentWidth = ctx.measureText(segment.text).width;

		if (currentWidth + segmentWidth > maxWidth && currentLine.length > 0) {
			lines.push(currentLine);
			currentLine = [segment];
			currentWidth = segmentWidth;
		} else {
			currentLine.push(segment);
			currentWidth += segmentWidth;
		}
	}

	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines.length > 0 ? lines : [[]];
}

export async function generateCertificate(
	options: CertificateGenerationOptions,
): Promise<{
	success: boolean;
	dataUrl?: string;
	filename?: string;
	error?: string;
}> {
	try {
		const {
			templateImage,
			sections,
			participant,
			selectedEvent,
			variableMapping,
			extraData = {},
			filenameFormat,
		} = options;

		// Create a new image element
		const image = new Image();
		image.crossOrigin = "anonymous";

		return new Promise((resolve) => {
			image.onload = () => {
				try {
					// Create canvas
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");

					if (!ctx) {
						resolve({ success: false, error: "Canvas context not available" });
						return;
					}

					// Set canvas dimensions to match image
					canvas.width = image.naturalWidth;
					canvas.height = image.naturalHeight;

					// Draw template image
					ctx.drawImage(image, 0, 0);

					// Process sections with actual data
					sections.forEach((section) => {
						const processedSegments = section.segments
							.map((segment) => {
								if (segment.isVariable && segment.variableName) {
									// Check if it's mapped to extra data (CSV)
									if (extraData[segment.variableName]) {
										return {
											...segment,
											text: extraData[segment.variableName],
										};
									}

									// Check if it's mapped to database variable
									const databaseVariable =
										variableMapping[segment.variableName];
									if (databaseVariable) {
										let actualValue = `{${segment.variableName}}`;

										switch (databaseVariable) {
											case "usn":
												actualValue = participant.usn || "N/A";
												break;
											case "name":
												actualValue = participant.name || "N/A";
												break;
											case "email":
												actualValue = participant.email || "N/A";
												break;
											case "eventName":
												actualValue = selectedEvent?.name || "N/A";
												break;
											case "eventVenue":
												actualValue = selectedEvent?.venue || "N/A";
												break;
											case "eventType":
												actualValue = selectedEvent?.eventType || "N/A";
												break;
											case "eventCategory":
												actualValue = selectedEvent?.category || "N/A";
												break;
											case "eventFromDate":
												actualValue = selectedEvent?.fromDate
													? new Date(
															selectedEvent.fromDate,
														).toLocaleDateString()
													: "N/A";
												break;
											case "eventToDate":
												actualValue = selectedEvent?.toDate
													? new Date(selectedEvent.toDate).toLocaleDateString()
													: "N/A";
												break;
											case "prizeType":
												actualValue = participant.prizeType || "PARTICIPATION";
												break;
											case "prizePosition": {
												const prizeType = participant.prizeType;
												if (prizeType === "WINNER") {
													actualValue = "1st";
												} else if (prizeType === "RUNNER_UP") {
													actualValue = "2nd";
												} else if (prizeType === "SECOND_RUNNER_UP") {
													actualValue = "3rd";
												} else {
													actualValue = "Participant";
												}
												break;
											}
											case "teamName":
												actualValue = participant.teamName || "Individual";
												break;
											case "isTeamLeader":
												actualValue = participant.isTeamLeader
													? "Team Leader"
													: "Team Member";
												break;
											default: {
												// Fallback to label if variable not found
												const variable = availableVariables.find(
													(v) => v.key === databaseVariable,
												);
												actualValue =
													variable?.label || `{${segment.variableName}}`;
												break;
											}
										}

										return { ...segment, text: actualValue };
									}

									// If no mapping found, keep original text
									return segment;
								}
								return segment;
							})
							.filter(Boolean) as TextSegment[];

						// Render text on canvas
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
							}

							for (const segment of line) {
								const style = getEffectiveStyle(segment, section);
								ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
								ctx.fillStyle = style.color;
								ctx.fillText(
									segment.text,
									currentX,
									section.y + lineIndex * lineHeight,
								);
								currentX += ctx.measureText(segment.text).width;
							}
						});
					});

					// Generate filename with actual data
					const filenameData = {
						usn: participant.usn,
						name: participant.name,
						email: participant.email,
						eventName: selectedEvent?.name || "",
						eventVenue: selectedEvent?.venue || "",
						eventType: selectedEvent?.eventType || "",
						eventCategory: selectedEvent?.category || "",
						prizeType: participant.prizeType || "PARTICIPATION",
						teamName: participant.teamName || "",
						...extraData,
					};

					const filenameComponents = filenameFormat.map((component) => {
						if (component.startsWith("custom:")) {
							return component.replace("custom:", "");
						}
						return (
							filenameData[component as keyof typeof filenameData] || component
						);
					});
					const filename =
						filenameComponents
							.filter(Boolean)
							.join("-")
							.replace(/[^a-zA-Z0-9-_]/g, "_") + ".png";

					// Convert canvas to data URL
					const dataUrl = canvas.toDataURL("image/png", 1.0);

					resolve({
						success: true,
						dataUrl,
						filename,
					});
				} catch (error) {
					console.error("Error generating certificate:", error);
					resolve({
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error generating certificate",
					});
				}
			};

			image.onerror = () => {
				resolve({ success: false, error: "Failed to load template image" });
			};

			image.src = templateImage;
		});
	} catch (error) {
		console.error("Error in generateCertificate:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export function downloadCertificate(dataUrl: string, filename: string) {
	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
