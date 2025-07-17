"use server";
import { CoreType } from "@prisma/client";
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
