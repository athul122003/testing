"use server";
import { CoreType } from "@prisma/client";
import { User } from "lucide-react";
import prisma from "~/lib/prisma";

export async function addToCore(formData: FormData) {
	try {
		const userIds = JSON.parse(formData.get("userIds") as string) as number[];
		const year = formData.get("year") as string;
		const position = formData.get("position") as string;
		const type = formData.get("type") as CoreType;
		const priorityValue = formData.get("priority");
		const priority = priorityValue !== null ? Number(priorityValue) : undefined;

		for (const userId of userIds) {
			const existingCore = await prisma.core.findFirst({
				where: { userId, year, type },
			});
			if (!existingCore) {
				await prisma.core.create({
					data: {
						userId,
						year,
						position,
						priority: priority!,
						type,
					},
				});
			} else {
				await prisma.core.update({
					where: { id: existingCore.id },
					data: {
						position,
						priority,
					},
				});
			}
		}
		return { status: "success" };
	} catch (error) {
		console.error("Error in addToCore:", error);
		throw new Error("Failed to add to core");
	}
}

export async function getCoreMembers({
	page = 1,
	pageSize = 20,
}: {
	page?: number;
	pageSize?: number;
}) {
	try {
		const skip = (page - 1) * pageSize;
		const [coreMembers, totalCore] = await Promise.all([
			prisma.core.findMany({
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
			prisma.core.count(),
		]);
		const totalPages = Math.ceil(totalCore / pageSize);
		return { coreMembers, totalCore, totalPages, page, pageSize };
	} catch (error) {
		console.error("Error in getCoreMembers:", error);
		throw new Error("Failed to fetch core members");
	}
}
