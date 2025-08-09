"use server";

import { db } from "~/server/db";
import { protectedAction } from "./middleware/protectedAction";

export const toggleRegistration = protectedAction(
	async (newStatus: boolean) => {
		console.log("Toggling registration status to:", newStatus);
		const registerationStatus = await db.settings.findUnique({
			where: { name: "registrationsOpen" },
		});
		if (!registerationStatus) {
			throw new Error("Registration setting not found");
		}
		await db.settings.update({
			where: { name: "registrationsOpen" },
			data: { status: newStatus },
		});
	},
	{
		actionName: "settings.ALLPERM",
	},
);

export const updateBanner = protectedAction(
	async (newStatus: boolean, desc: string) => {
		const bannerStatus = await db.settings.findUnique({
			where: {
				name: "notice",
			},
		});
		if (!bannerStatus) {
			throw new Error("Banner setting not found");
		}
		if (!desc || desc.length > 100) {
			throw new Error("Description must be between 1 and 100 characters");
		}
		await db.settings.update({
			where: {
				name: "notice",
			},
			data: {
				status: newStatus,
				description: desc,
			},
		});
	},
	{
		actionName: "settings.ALLPERM",
	},
);

export const getBannerSettings = protectedAction(
	async () => {
		const bannerSettings = await db.settings.findUnique({
			where: {
				name: "notice",
			},
		});
		if (!bannerSettings) {
			throw new Error("Banner settings not found");
		}
		return {
			status: bannerSettings.status,
			description: bannerSettings.description ?? "",
		};
	},
	{
		actionName: "settings.ALLPERM",
	},
);
