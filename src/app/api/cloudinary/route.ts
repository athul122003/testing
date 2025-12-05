import { IncomingForm } from "formidable";
import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "~/lib/cloudinaryImageUploader";

export const runtime = "nodejs";
// NOT DONE, DONT USE THIS AS IT MIGHT BE REMOVED IN THE FUTURE

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file") as File;

	if (!file) {
		return NextResponse.json(
			{
				error: "No file uploaded",
			},
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}

	const result = await uploadImageToCloudinary(file, "testing");
	// TODO[Rahul]: Create action folder inside cloudinary to store images in different folders and get folder name from the request

	return NextResponse.json(
		{
			url: result,
		},
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}
