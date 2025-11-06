"use server";

import { env } from "~/env";
import cloudinary from "~/lib/cloudinary";

const CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET;
const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
	throw new Error("Missing Cloudinary environment variables");
}

export async function getCloudinarySignature(
	folder: string = "default-flc-folder",
) {
	const timestamp = Math.round(Date.now() / 1000);

	const finalFolderName = folder.replace(/[^a-zA-Z0-9-_]/g, "");

	const signature = cloudinary.utils.api_sign_request(
		{ timestamp, folder: finalFolderName },
		CLOUDINARY_API_SECRET,
	);

	return {
		timestamp,
		signature,
		apiKey: CLOUDINARY_API_KEY,
		cloudName: CLOUDINARY_CLOUD_NAME,
		finalFolderName,
	};
}

export async function getCloudinaryDeleteSignature(publicId: string) {
	const timestamp = Math.round(Date.now() / 1000);

	const signature = cloudinary.utils.api_sign_request(
		{ timestamp, public_id: publicId },
		CLOUDINARY_API_SECRET,
	);

	return {
		timestamp,
		signature,
		apiKey: CLOUDINARY_API_KEY,
		cloudName: CLOUDINARY_CLOUD_NAME,
		publicId,
	};
}

export async function uploadImageToCloudinary(file: File, folder?: string) {
	const sign = await getCloudinarySignature(folder);

	const formData = new FormData();
	formData.append("file", file);
	formData.append("api_key", sign.apiKey);
	formData.append("timestamp", String(sign.timestamp));
	formData.append("signature", sign.signature);
	formData.append("folder", sign.finalFolderName);

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

export async function deleteImageFromCloudinary(publicId: string) {
	console.log("Deleting image with public ID:", publicId);

	const signature = await getCloudinaryDeleteSignature(publicId);

	const formData = new URLSearchParams();
	formData.append("public_id", publicId);
	formData.append("api_key", signature.apiKey);
	formData.append("timestamp", signature.timestamp.toString());
	formData.append("signature", signature.signature);

	const response = await fetch(
		`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/destroy`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData,
		},
	);

	const json = await response.json();

	if (!response.ok) {
		const error = json.error || { message: "Delete failed" };
		throw new Error(error.error?.message || "Delete failed");
	}

	console.log("Image deleted successfully:", publicId);
	return json;
}
