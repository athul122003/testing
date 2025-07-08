"use server";

import { env } from "~/env";
import cloudinary from "~/lib/cloudinary";

export async function getCloudinarySignature(
	folder: string = "default-flc-folder",
) {
	const timestamp = Math.round(Date.now() / 1000);

	const signature = cloudinary.utils.api_sign_request(
		{ timestamp, folder },
		process.env.CLOUDINARY_API_SECRET,
	);

	return {
		timestamp,
		signature,
		apiKey: process.env.CLOUDINARY_API_KEY,
		cloudName: process.env.CLOUDINARY_CLOUD_NAME,
		folder,
	};
}

export async function uploadImageToCloudinary(file: File, folder?: string) {
	const sign = await getCloudinarySignature(folder);

	const formData = new FormData();
	formData.append("file", file);
	formData.append("api_key", sign.apiKey);
	formData.append("timestamp", String(sign.timestamp));
	formData.append("signature", sign.signature);
	formData.append("folder", sign.folder);

	const upload = await fetch(
		`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
		{
			method: "POST",
			body: formData,
		},
	);

	const json = await upload.json();

	if (!upload.ok) {
		throw new Error(json.error?.message || "Upload failed");
	}

	console.log("Image uploaded successfully:", json);

	return json.secure_url;
}
