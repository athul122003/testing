"use server";

import { google } from "googleapis";
import { Readable } from "stream";

const streamFromBuffer = (buffer: Buffer) => Readable.from([buffer]);

// const auth = new google.auth.GoogleAuth({
// 	keyFile: "./src/lib/service.json",
// 	scopes: ["https://www.googleapis.com/auth/drive"],
// });

const oauth2Client = new google.auth.OAuth2({
	client_id: process.env.GOOGLE_CLIENT_ID,
	client_secret: process.env.GOOGLE_CLIENT_SECRET,
	redirect_uris: [process.env.GOOGLE_REDIRECT_URI || ""],
});

// const scopes = ["https://www.googleapis.com/auth/drive"];

// const url = oauth2Client.generateAuthUrl({
// 	access_type: "offline",
// 	scope: scopes,
// 	prompt: "consent",
// });

const DRIVE_ID = "1mYJyNr30BA1c_ovEJvOBrN4rE5yiuHsz";

export async function uploadFileToGoogleDrive(
	data: { buffer: string; originalname: string },
	folderName: string,
) {
	console.log(oauth2Client);
	// oauth2Client.setCredentials({
	// 	refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
	// });

	const tokens = await oauth2Client.getToken(
		process.env.GOOGLE_REFRESH_TOKEN || "",
	);
	console.log("Tokens:", tokens);

	// oauth2Client
	// 	.getAccessToken()
	// 	.then((res) => {
	// 		console.log("Access token:", res.token);
	// 	})
	// 	.catch((err) => {
	// 		console.error("Error:", err);
	// 	});
	async function getDriveClient() {
		return google.drive({
			version: "v3",
			auth: oauth2Client,
		});
	}

	const file = Buffer.from(data.buffer, "base64");
	const drive = await getDriveClient();
	const fileName = data.originalname;

	const folderRes = await drive.files.list({
		q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
		fields: "files(id)",
	});

	let folderId: string | undefined;

	if (folderRes.data.files?.length) {
		folderId = folderRes.data.files[0].id || "";
	} else {
		const folder = await drive.files.create({
			requestBody: {
				name: folderName,
				mimeType: "application/vnd.google-apps.folder",
				parents: [DRIVE_ID],
			},
			fields: "id",
		});
		folderId = folder.data.id || "";
	}

	const res = await drive.files.create({
		requestBody: {
			name: fileName,
			parents: [folderId],
		},
		media: {
			body: streamFromBuffer(file),
		},
		fields: "id, name",
		supportsAllDrives: true,
	});

	return res.data;
}

export async function listFilesInFolder(folderName: string) {
	const drive = await getDriveClient();

	const folderRes = await drive.files.list({
		q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
		fields: "files(id)",
	});

	if (!folderRes.data.files?.length) {
		throw new Error(`Folder "${folderName}" not found`);
	}

	const folderId = folderRes.data.files[0].id || "";

	const filesRes = await drive.files.list({
		q: `'${folderId}' in parents and trashed=false`,
		fields: "files(id, name, webViewLink, webContentLink, mimeType)",
	});

	return filesRes.data.files || [];
}

export async function deleteFile(fileId: string) {
	const drive = await getDriveClient();

	try {
		await drive.files.delete({
			fileId: fileId,
		});
		return { success: true };
	} catch (error) {
		console.error("Error deleting file:", error);
		return { success: false };
	}
}
