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
	formData.append("name", file.name);
	formData.append("upload_preset", "eventdocuments");
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

export async function deleteFileFromCloudinary(publicId: string, type: string) {
	try {
		const response = await cloudinary.uploader.destroy(publicId, {
			resource_type: type,
		});

		console.log(type);
		console.log(publicId);

		console.log("Delete response:", response);

		if (response.result === "ok") {
			console.log("File deleted successfully:", response);
			return true;
		} else {
			throw new Error(response.error?.message || "File deletion failed");
		}
	} catch (error) {
		console.error("Error deleting file from Cloudinary:", error);
		throw new Error("File deletion failed");
	}
}

export const detectTypeAndDelete = async (publicId: string) => {
	for (const type of ["image", "video", "raw"]) {
		try {
			const res = await cloudinary.api.resource(publicId, {
				resource_type: type,
			});
			if (res) {
				console.log("Found under type:", type);
				const deleteRes = await cloudinary.uploader.destroy(publicId, {
					resource_type: type,
				});
				console.log("Delete Result:", deleteRes);
				return deleteRes.result === "ok";
			}
		} catch (_) {
			continue;
		}
	}
	const res = await cloudinary.search
		.expression("resource_type:raw")
		.max_results(30)
		.execute();
	console.log("Search Result:", res);
	throw new Error("File not found under any resource_type");
};
