// lib/actions/cloudinary.ts
"use server";

import { v2 as cloudinary } from "cloudinary";

// Helper to safely load required env vars
function requireEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
}

// Load and validate env vars
const CLOUDINARY_CLOUD_NAME = requireEnvVar("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = requireEnvVar("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = requireEnvVar("CLOUDINARY_API_SECRET");

// Configure Cloudinary
cloudinary.config({
	cloud_name: CLOUDINARY_CLOUD_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET,
});

// Server action to get signed upload parameters
export async function getCloudinarySignature() {
	const timestamp = Math.round(Date.now() / 1000);
	const folder = "flc-events"; // Optional: change as needed

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
