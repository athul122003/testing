import { IncomingForm } from "formidable";
import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "~/lib/cloudinaryImageUploader";

export const config = {
	api: {
		bodyParser: false,
	},
};

// NOT DONE, DONT USE THIS AS IT MIGHT BE REMOVED IN THE FUTURE

export async function POST(req: NextRequest) {
	const _form = new IncomingForm();

	const buffer = await req.arrayBuffer();
	const tmpFilePath = `/tmp/upload-${Date.now()}`;
	await fs.promises.writeFile(tmpFilePath, Buffer.from(buffer));

	const fileBuffer = fs.readFileSync(tmpFilePath);
	const fileName = `upload-${Date.now()}.jpg`;
	const fileType = "image/jpeg";
	const file = new File([fileBuffer], fileName, { type: fileType });
	const result = await uploadImageToCloudinary(file, "testing");
	// TODO[Rahul]: Create action folder inside cloudinary to store images in different folders and get folder name from the request

	fs.unlinkSync(tmpFilePath);

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
