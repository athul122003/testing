"use server";
import { CoreType } from "@prisma/client";
import { db } from "~/server/db";
import { protectedAction } from "./middleware/protectedAction";

export const addToCore = protectedAction(
	async (formData: FormData) => {
		try {
			const coreId = formData.get("coreId") as string | null;
			const userIds = JSON.parse(formData.get("userIds") as string) as number[];
			const year = formData.get("year") as string;
			const position = formData.get("position") as string;
			const type = formData.get("type") as CoreType;
			const priorityValue = formData.get("priority");
			const priority =
				priorityValue !== null ? Number(priorityValue) : undefined;

			if (coreId) {
				const userId = userIds[0];
				const duplicate = await db.core.findFirst({
					where: { userId, year, id: { not: coreId } },
				});
				if (duplicate) {
					throw new Error("User already exists in core for this year and type");
				}
				await db.core.update({
					where: { id: coreId },
					data: { position, year, type, priority },
				});
			} else {
				for (const userId of userIds) {
					const duplicate = await db.core.findFirst({
						where: { userId, year },
					});

					if (duplicate) {
						throw new Error("User already exists in core for this year");
					}

					await db.core.create({
						data: {
							userId,
							year,
							position,
							priority: priority!,
							type,
						},
					});
				}
			}

			return { status: "success" };
		} catch (error) {
			console.error("Error in addToCore:", error);
			throw new Error("Failed to add to core");
		}
	},
	{ actionName: "core.ALLPERM" },
);

export const getCoreMembers = protectedAction(
	async ({
		page = 1,
		pageSize = 20,
		search = "",
	}: {
		page?: number;
		pageSize?: number;
		search?: string;
	}) => {
		try {
			const skip = (page - 1) * pageSize;
			const searchFilter = search.trim()
				? {
						OR: [
							{ position: { contains: search, mode: "insensitive" as const } },
							{ year: { contains: search, mode: "insensitive" as const } },
							{
								User: {
									name: { contains: search, mode: "insensitive" as const },
								},
							},
							{
								User: {
									email: { contains: search, mode: "insensitive" as const },
								},
							},
							...(Number.isNaN(Number(search))
								? []
								: [{ userId: Number(search) }]),
						],
					}
				: {};

			const [coreMembers, totalCore] = await Promise.all([
				db.core.findMany({
					where: searchFilter,
					skip,
					take: pageSize,
					orderBy: { priority: "asc" },
					include: {
						User: {
							select: {
								name: true,
								email: true,
							},
						},
					},
				}),
				db.core.count({ where: searchFilter }),
			]);
			const totalPages = Math.ceil(totalCore / pageSize);
			return { coreMembers, totalCore, totalPages, page, pageSize };
		} catch (error) {
			console.error("Error in getCoreMembers:", error);
			throw new Error("Failed to fetch core members", { cause: error });
		}
	},
	{ actionName: "core.ALLPERM" },
);

export const deleteBulkCore = protectedAction(
	async (coreIds: string[]) => {
		try {
			if (coreIds.length === 0) {
				throw new Error("No core IDs provided for deletion");
			}
			const deletedResult = await db.core.deleteMany({
				where: {
					id: { in: coreIds },
				},
			});
			return { status: "success", deletedCount: deletedResult.count };
		} catch (error) {
			console.error("Error in deleteBulkCore:", error);
			throw new Error("Failed to delete core", { cause: error });
		}
	},
	{
		actionName: "core.ALLPERM",
	},
);
