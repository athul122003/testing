"use server";

import prisma from "~/lib/prisma";
import { protectedAction } from "./middleware/protectedAction";

export const toggleRegistration = protectedAction(
	async (newStatus: boolean) => {
		console.log("Toggling registration status to:", newStatus);
		const registerationStatus = await prisma.settings.findUnique({
			where: { name: "registrationsOpen" },
		});
		if (!registerationStatus) {
			throw new Error("Registration setting not found");
		}
		await prisma.settings.update({
			where: { name: "registrationsOpen" },
			data: { status: newStatus },
		});
	},
	{
		actionName: "settings.ALLPERM",
	},
);
