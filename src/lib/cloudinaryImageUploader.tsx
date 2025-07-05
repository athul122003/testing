"use server";

import cloudinary from "~/lib/cloudinary";

// Helper to safely load required env vars
function requireEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
}
const CLOUDINARY_CLOUD_NAME = requireEnvVar("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = requireEnvVar("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = requireEnvVar("CLOUDINARY_API_SECRET");

// Server action to get signed upload parameters
export async function getCloudinarySignature(folder: string = "flc-events") {
	const timestamp = Math.round(Date.now() / 1000);

	const signature = cloudinary.utils.api_sign_request(
		{ timestamp, folder },
		CLOUDINARY_API_SECRET,
	);

	return {
		timestamp,
		signature,
		apiKey: CLOUDINARY_API_KEY,
		cloudName: CLOUDINARY_CLOUD_NAME,
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
