"use server";

import {
	type Event,
	EventState,
	EventType,
	PrizeType,
	type Prize,
} from "@prisma/client";
import { z } from "zod";
import { db } from "~/server/db";
import { createEventZ } from "~/zod/eventZ";
import { protectedAction } from "./middleware/protectedAction";
import mime from "mime";
import {
	deleteFileFromCloudinary,
	uploadFileToCloudinary,
} from "~/lib/cloudinaryFileUploader";

export type CreateEventInput = z.infer<typeof createEventZ>;
export type EventsQuery = Awaited<ReturnType<typeof getAllEvents>>;

export interface ExtendedEvent extends Event {
	confirmedTeams: number;
	prizes?: Prize[];
}

function extractPublicIdFromUrl({
	url,
	resType,
}: {
	url: string;
	resType: string;
}): string {
	const urlObj = new URL(url);
	const pathname = urlObj.pathname; // /your-cloud-name/image/upload/v1234567890/folder/filename.jpg
	const parts = pathname.split("/");

	const publicIdParts = parts.slice(5); // starting after /image/upload/v123...
	const fullFilename = publicIdParts.join("/"); // folder/filename.jpg

	// Remove extension (.jpg, .png etc)
	const lastDotIndex = fullFilename.lastIndexOf(".");
	if (resType === "raw") {
		return fullFilename;
	} else {
		return fullFilename.substring(0, lastDotIndex);
	}
}

function toUTC(date: string | Date | undefined): Date | undefined {
	if (!date) return undefined;
	if (typeof date === "string" && !date.endsWith("Z") && date.length >= 16) {
		return new Date(date + "Z");
	}
	return new Date(date);
}

export const createEventAction = protectedAction(
	async (values: CreateEventInput) => {
		try {
			const validated = createEventZ.parse(values);

			// Validation...
			if (validated.fromDate > validated.toDate) {
				return {
					success: false,
					error: "From date must be before To date.",
				};
			}
			if (validated.statusOfBatchRestriction === true) {
				if (
					!validated.batchRestriction ||
					validated.batchRestriction.length === 0
				) {
					return {
						success: false,
						error:
							"Batch restrictions are enabled but no batch restrictions provided.",
					};
				}
				const totalMaxTeams = validated.batchRestriction.reduce(
					(sum, restriction) => sum + (restriction.maxCapacity || 0),
					0,
				);
				validated.maxTeams = totalMaxTeams;
			}
			if (
				validated.deadline &&
				(validated.deadline > validated.fromDate ||
					validated.deadline > validated.toDate)
			) {
				return {
					success: false,
					error: "Deadline must be before event start and end dates.",
				};
			}
			if (validated.eventType === EventType.SOLO) {
				if (validated.minTeamSize !== 1 || validated.maxTeamSize !== 1) {
					return {
						success: false,
						error: "SOLO event must have team size = 1.",
					};
				}
			}
			if (validated.maxTeams === 0) {
				return {
					success: false,
					error: "Max teams cannot be zero.",
				};
			}
			if (validated.minTeamSize < 1 || validated.maxTeamSize < 1) {
				return {
					success: false,
					error: "Team sizes must be at least 1.",
				};
			}
			if (validated.minTeamSize > validated.maxTeamSize) {
				return {
					success: false,
					error: "Minimum team size cannot be greater than maximum team size.",
				};
			}

			// Step 1: Create Event
			const event = await db.event.create({
				data: {
					name: validated.name,
					imgSrc: validated.imgSrc,
					description: validated.description,
					venue: validated.venue,
					eventType: validated.eventType,
					category: validated.category,
					state: validated.state ?? EventState.DRAFT,
					fromDate: toUTC(validated.fromDate) ?? new Date(),
					toDate: toUTC(validated.toDate) ?? new Date(),
					deadline: validated.deadline ? toUTC(validated.deadline) : undefined,
					maxTeams: validated.maxTeams,
					minTeamSize: validated.minTeamSize,
					maxTeamSize: validated.maxTeamSize,
					isMembersOnly: validated.isMembersOnly,
					statusOfBatchRestriction: validated.statusOfBatchRestriction,
					// yearRestrictions: validated.yearRestrictions?.map((yr) => ({
					flcAmount: validated.flcAmount,
					nonFlcAmount: validated.nonFlcAmount,
				},
			});

			if (validated.statusOfBatchRestriction && validated.batchRestriction) {
				await db.batch.createMany({
					data: validated.batchRestriction.map((batch) => ({
						year: batch.year,
						maxCapacity: batch.maxCapacity,
						eventId: event.id,
					})),
				});
			}

			// Step 2: Create Prizes (all 4 types)
			const prizeTypes: PrizeType[] = Object.values(PrizeType);

			const inputPrizeMap = new Map<PrizeType, number>(
				(validated.prizes || []).map((p) => [p.prizeType, p.flcPoints ?? 0]),
			);

			await db.prize.createMany({
				data: prizeTypes.map((type) => ({
					eventId: event.id,
					prizeType: type,
					flcPoints: inputPrizeMap.get(type) ?? 0,
				})),
			});

			return { success: true, event };
		} catch (error) {
			console.error("createEventAction Error:", error);
			if (error instanceof z.ZodError) {
				const firstIssue = error.issues[0]?.message || "Validation failed";
				return {
					success: false,
					error: firstIssue,
					issues: error.issues,
				};
			}
			return {
				success: false,
				error: "An unexpected error occurred while creating event.",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);

export const toggleEventStatus = protectedAction(
	async (eventId: number) => {
		try {
			const event = await db.event.findUnique({
				where: { id: eventId },
				select: { id: true, state: true },
			});
			if (!event) {
				return { success: false, error: "Event not found" };
			}
			let newState: EventState;
			switch (event.state) {
				case EventState.DRAFT:
					newState = EventState.PUBLISHED;
					break;
				case EventState.PUBLISHED:
					newState = EventState.LIVE;
					break;
				case EventState.LIVE:
					newState = EventState.COMPLETED;
					break;
				default:
					return { success: false, error: "Invalid event state" };
			}
			const updatedEvent = await db.event.update({
				where: { id: eventId },
				data: { state: newState },
			});
			return { success: true, event: updatedEvent };
		} catch (error) {
			console.error("toggleEventStatus Error:", error);
			return {
				success: false,
				error: "Failed to toggle event status.",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);

export const editEventAction = protectedAction(
	async (eventId: number, values: CreateEventInput) => {
		try {
			const validated = createEventZ.parse(values);

			if (validated.fromDate > validated.toDate) {
				return {
					success: false,
					error: "From date must be before To date.",
				};
			}
			if (
				validated.deadline &&
				(validated.deadline > validated.fromDate ||
					validated.deadline > validated.toDate)
			) {
				return {
					success: false,
					error: "Deadline must be before event start and end dates.",
				};
			}
			if (validated.eventType === EventType.SOLO) {
				if (validated.minTeamSize !== 1 || validated.maxTeamSize !== 1) {
					return {
						success: false,
						error: "SOLO event must have team size = 1.",
					};
				}
			}
			if (validated.maxTeams === 0) {
				return {
					success: false,
					error: "Max teams cannot be zero.",
				};
			}
			if (validated.minTeamSize < 1 || validated.maxTeamSize < 1) {
				return {
					success: false,
					error: "Team sizes must be at least 1.",
				};
			}
			if (validated.minTeamSize > validated.maxTeamSize) {
				return {
					success: false,
					error: "Minimum team size cannot be greater than maximum team size.",
				};
			}

			const updated = await db.event.update({
				where: { id: eventId },
				data: {
					name: validated.name,
					imgSrc: validated.imgSrc,
					description: validated.description,
					venue: validated.venue,
					eventType: validated.eventType,
					category: validated.category,
					state: validated.state ?? EventState.DRAFT,
					fromDate: toUTC(validated.fromDate) ?? new Date(),
					toDate: toUTC(validated.toDate) ?? new Date(),
					deadline: validated.deadline ? toUTC(validated.deadline) : undefined,
					maxTeams: validated.maxTeams,
					minTeamSize: validated.minTeamSize,
					maxTeamSize: validated.maxTeamSize,
					isMembersOnly: validated.isMembersOnly,
					statusOfBatchRestriction: validated.statusOfBatchRestriction,
					flcAmount: validated.flcAmount,
					nonFlcAmount: validated.nonFlcAmount,
				},
			});

			await db.batch.deleteMany({
				where: { eventId },
			});

			if (validated.statusOfBatchRestriction && validated.batchRestriction) {
				await db.batch.createMany({
					data: validated.batchRestriction.map((batch) => ({
						year: batch.year,
						maxCapacity: batch.maxCapacity,
						eventId: eventId,
					})),
				});
			}

			// Step 2: Update prizes (ONLY if changed)
			const existingPrizes = await db.prize.findMany({
				where: { eventId },
				include: { Teams: { include: { Members: true } } },
			});

			if (existingPrizes.length > 0) {
				const changedPrizes = validated.prizes?.filter((newPrize) => {
					const oldPrize = existingPrizes.find(
						(p) => p.prizeType === newPrize.prizeType,
					);
					return oldPrize && oldPrize.flcPoints !== newPrize.flcPoints;
				});

				if (changedPrizes?.length) {
					for (const prize of changedPrizes) {
						const oldPrize = existingPrizes.find(
							(p) => p.prizeType === prize.prizeType,
						);
						if (!oldPrize) continue;

						// 1. Update prize points
						await db.prize.update({
							where: {
								eventId_prizeType: {
									eventId,
									prizeType: prize.prizeType,
								},
							},
							data: {
								flcPoints: prize.flcPoints ?? 0,
							},
						});

						// 2. Update all members in teams who won this prize
						for (const team of oldPrize.Teams) {
							const members = team.Members;
							for (const member of members) {
								await db.user.update({
									where: { id: member.id },
									data: {
										totalActivityPoints: {
											decrement: oldPrize.flcPoints ?? 0,
										},
									},
								});
								await db.user.update({
									where: { id: member.id },
									data: {
										totalActivityPoints: {
											increment: prize.flcPoints ?? 0,
										},
									},
								});
							}
						}
					}
				}
			} else {
				const prizeTypes: PrizeType[] = Object.values(PrizeType);
				const inputPrizeMap = new Map<PrizeType, number>(
					(validated.prizes || []).map((p) => [p.prizeType, p.flcPoints ?? 0]),
				);

				await db.prize.createMany({
					data: prizeTypes.map((type) => ({
						eventId,
						prizeType: type,
						flcPoints: inputPrizeMap.get(type) ?? 0,
					})),
				});
			}
			return { success: true, event: updated };
		} catch (error) {
			console.error("editEventAction Error:", error);
			if (error instanceof z.ZodError) {
				return {
					success: false,
					error: "Validation failed",
					issues: error.issues,
				};
			}
			return {
				success: false,
				error: "An unexpected error occurred while updating the event.",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);

export const publishEventAction = protectedAction(async (eventId: number) => {
	try {
		const event = await db.event.update({
			where: { id: eventId },
			data: { state: EventState.PUBLISHED },
		});

		return { success: true, event };
	} catch (error) {
		console.error("publishEventAction Error:", error);
		return {
			success: false,
			error: "Failed to publish event.",
		};
	}
});

export const getAllEvents = protectedAction(
	async ({
		year,
	}: {
		year?: number;
	}): Promise<
		| {
				success: true;
				data: ExtendedEvent[];
				years: number[];
				error?: undefined;
		  }
		| {
				success: false;
				error: string;
				data: [];
		  }
	> => {
		try {
			const events = await db.event.findMany({
				where: year
					? {
							fromDate: {
								gte: new Date(`${year}-01-01T00:00:00.000Z`),
								lte: new Date(`${year}-12-31T23:59:59.999Z`),
							},
						}
					: undefined,
				orderBy: { fromDate: "desc" },
				include: {
					batchRestriction: true,
					Team: {
						select: {
							id: true,
							isConfirmed: true,
							Prize: {
								select: {
									prizeType: true,
									flcPoints: true,
								},
							},
							yearOfStudy: true,
						},
					},
					Prize: true,
				},
			});

			// Get all unique years from events in DB
			const yearsRaw = await db.event.findMany({
				select: { fromDate: true },
				orderBy: { fromDate: "desc" },
			});
			const years = Array.from(
				new Set(yearsRaw.map((e) => e.fromDate.getFullYear())),
			);

			const filteredEvents = events;

			const formattedEvents: ExtendedEvent[] = filteredEvents.map((event) => ({
				...event,
				confirmedTeams: event.Team.filter((team) => team.isConfirmed).length,
				prizes: event.Prize ?? [],
			}));

			return {
				success: true,
				data: formattedEvents,
				years,
			};
		} catch (error) {
			console.error("getAllEvents Error:", error);
			return {
				success: false,
				error: "Failed to fetch events.",
				data: [],
			};
		}
	},
	{ actionName: "event.getAll" },
);

export const getEventDocs = protectedAction(
	async (eventId: number) => {
		try {
			const event = await db.event.findUnique({
				where: { id: eventId },
				include: {
					EventDocument: true,
				},
			});
			if (!event) {
				return { success: false, error: "Event not found" };
			}
			return {
				success: true,
				data: event.EventDocument.map((doc) => ({
					id: doc.id,
					name: doc.name,
					url: doc.fileUrl,
					fileType: doc.fileType,
					fileSize: doc.fileSize,
					createdAt: doc.createdAt,
				})),
			};
		} catch (error) {
			console.error("getEventDocs Error:", error);
			return {
				success: false,
				error: "Failed to fetch event documents.",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);

export const createEventDoc = protectedAction(
	async (eventId: number, file: File, name: string, description: string) => {
		try {
			const event = await db.event.findUnique({
				where: { id: eventId },
				select: { id: true, name: true },
			});

			if (!event) {
				return { success: false, error: "Event not found" };
			}
			let resType: string | undefined;
			const mimeType = mime.getType(file.name);
			console.log("MIME type detected:", mimeType);
			if (!mimeType) {
				resType = "unknown";
			}

			if (mimeType) {
				if (!(mimeType.startsWith("image/") || mimeType.startsWith("video/"))) {
					console.log("MIME type is not image or video, using raw type");
					resType = "raw" + "/" + mimeType.split("/")[1] || "unknown";
				} else {
					resType = mimeType;
				}
			} else {
				console.log("MIME type is unknown, using raw/unknown");
				resType = "raw/unknown";
			}
			console.log("Resource type determined as:", resType);
			const fileType = resType || "unknown/unknown";
			const fileSize = file.size;
			const fileUrl = await uploadFileToCloudinary(
				file,
				`event-documents/${event.name}-${eventId}`,
			);
			const newDoc = await db.eventDocument.create({
				data: {
					name,
					fileUrl,
					description,
					fileType,
					fileSize,
					eventId: event.id,
				},
			});
			return {
				success: true,
				data: {
					id: newDoc.id,
					name: newDoc.name,
					url: newDoc.fileUrl,
					fileType: newDoc.fileType,
					fileSize: newDoc.fileSize,
					createdAt: newDoc.createdAt,
				},
			};
		} catch (error) {
			console.error("createEventDoc Error:", error);
			if (error instanceof z.ZodError) {
				return {
					success: false,
					error: "Validation failed",
					issues: error.issues,
				};
			}
			return {
				success: false,
				error: "An unexpected error occurred while uploading the document.",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);

export async function deleteEventDoc(
	eventId: number,
	docId: string,
): Promise<
	{ success: true; message: string } | { success: false; error: string }
> {
	try {
		const event = await db.event.findUnique({
			where: { id: eventId },
			select: { id: true, name: true },
		});
		if (!event) {
			return { success: false, error: "Event not found" };
		}
		const doc = await db.eventDocument.findUnique({
			where: { id: docId, eventId: event.id },
			select: { id: true, fileUrl: true, fileType: true },
		});
		if (!doc) {
			return { success: false, error: "Document not found" };
		}
		let resourceType: string;
		const resType = doc.fileType?.split("/")[0] || "unknown";
		if (resType === "unknown") {
			resourceType = "raw";
		} else if (resType === "image" || resType === "video") {
			resourceType = resType;
		} else {
			resourceType = "raw";
		}
		const res = await deleteFileFromCloudinary(
			extractPublicIdFromUrl({ url: doc.fileUrl, resType: resType }),
			resourceType,
		);
		if (!res) {
			return { success: false, error: "Failed to delete file from Cloudinary" };
		}
		await db.eventDocument.delete({
			where: { id: doc.id },
		});
		return { success: true, message: "Document deleted successfully" };
	} catch (error) {
		console.error("deleteEventDoc Error:", error);
		return {
			success: false,
			error: "An unexpected error occurred while deleting the document.",
		};
	}
}

export const deleteEventAction = protectedAction(
	async (eventId: number) => {
		try {
			if (!eventId) {
				return {
					success: false,
					error: "Event ID is required.",
				};
			}
			const teamsCount = await db.team.count({
				where: { eventId },
			});
			if (teamsCount > 0) {
				return {
					success: false,
					error:
						"Cannot delete event with existing teams. Please delete teams first.",
				};
			}
			const certificatesCount = await db.certificate.count({
				where: { eventId },
			});
			if (certificatesCount > 0) {
				return {
					success: false,
					error:
						"Cannot delete event with existing certificates. Please delete certificates first.",
				};
			}
			await db.prize.deleteMany({
				where: { eventId },
			});
			// await db.certificate.deleteMany({
			// 	where: { eventId },
			// });
			const deleted = await db.event.delete({
				where: { id: eventId },
			});

			return {
				success: true,
				event: deleted,
			};
		} catch (error) {
			console.error("deleteEventAction Error:", error);
			return {
				success: false,
				error: "Failed to delete event. It may not exist.",
			};
		}
	},
	{ actionName: "event.ALLPERM" },
);
