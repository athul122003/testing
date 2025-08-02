import { v2 as cloudinary } from "cloudinary";
import mime from "mime";

export async function uploadFileToCloudinary(file: File, folder: string) {
	const mimeType = mime.getType(file.name) || "application/octet-stream";

	let resourceType: "image" | "video" | "raw" = "raw";

	if (mimeType.startsWith("image/")) {
		resourceType = "image";
	} else if (mimeType.startsWith("video/")) {
		resourceType = "video";
	}

	const formData = new FormData();
	formData.append("file", file);
	formData.append("upload_preset", "eventdocuments"); // Replace with your upload preset
	formData.append("folder", folder || "default-folder");

	const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/${resourceType}/upload`;
	try {
		const response = await fetch(uploadUrl, {
			method: "POST",
			body: formData,
		});

		const data = await response.json();

		if (data.secure_url) {
			console.log("File uploaded successfully:", data);
			return data.secure_url;
		} else {
			throw new Error(data.error?.message || "File upload failed");
		}
	} catch (error) {
		console.error("Error uploading file to Cloudinary:", error);
		throw new Error("File upload failed");
	}
}
