import { NextResponse, NextRequest } from "next/server";
import cloudinary from "~/lib/cloudinary";
import { IncomingForm } from "formidable";
import fs from "fs";

export const config = {
	api: {
		bodyParser: false,
	},
};

export async function POST(req: NextRequest) {
	const form = new IncomingForm();

	const buffer = await req.arrayBuffer();
	const tmpFilePath = `/tmp/upload-${Date.now()}`;
	await fs.promises.writeFile(tmpFilePath, Buffer.from(buffer));

	const result = await cloudinary.uploader.upload(tmpFilePath, {
		folder: "events", // TODO[Rahul]: Create action folder inside cloudinary to store images in different folders and get folder name from the request
	});

	fs.unlinkSync(tmpFilePath);

	return NextResponse.json(
		{
			url: result.secure_url,
			publicId: result.public_id,
		},
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}
