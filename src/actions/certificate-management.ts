"use server";

import { db } from "../server/db";
import nodemailer from "nodemailer";
import {
	deleteImageFromCloudinary,
	uploadImageToCloudinary,
} from "../lib/cloudinaryImageUploader";

export interface CertificateUploadResult {
	success: boolean;
	certificateId?: string;
	error?: string;
	url?: string;
}

export interface CertificateStatus {
	id: string;
	eventId: number;
	userId: number;
	userName: string;
	userEmail: string;
	userUsn: string;
	link: string;
	statusOfMailing: boolean;
	errorInMailing: boolean;
	createdAt: Date;
}

export interface EventCertificateStatus {
	eventId: number;
	totalCertificates: number;
	sentCertificates: number;
	errorCertificates: number;
	certificates: CertificateStatus[];
}

export interface CertificateWithStatus {
	usn: string;
	name: string;
	email: string;
	certificateUrl: string;
	filename?: string;
	prizeType?: string;
	// Upload status
	uploading?: boolean;
	uploaded?: boolean;
	uploadError?: string;
	cloudinaryUrl?: string;
	certificateId?: string;
	// Mail status
	mailing?: boolean;
	mailed?: boolean;
	mailError?: string;
}

function extractPublicIdFromUrl(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname; // /your-cloud-name/image/upload/v1234567890/folder/filename.jpg
		const parts = pathname.split("/");
		// Remove the first parts like /image/upload/v123456
		const publicIdParts = parts.slice(5); // starting after /image/upload/v123...
		const fullFilename = publicIdParts.join("/"); // folder/filename.jpg

		// Remove extension (.jpg, .png etc)
		const lastDotIndex = fullFilename.lastIndexOf(".");
		return fullFilename.substring(0, lastDotIndex);
	} catch (error) {
		console.error("Error extracting public ID from URL:", error);
		return null;
	}
}

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false, // use false for STARTTLS; true for SSL on port 465
	auth: {
		user: process.env.SMTP_GMAIL,
		pass: process.env.SMTP_PASSWORD,
	},
});

export async function uploadCertificateToCloudinary(
	eventId: number,
	userId: number,
	certificateDataUrl: string,
	filename: string,
	certificateType:
		| "WINNER"
		| "RUNNER_UP"
		| "SECOND_RUNNER_UP"
		| "PARTICIPATION",
): Promise<CertificateUploadResult> {
	try {
		const event = await db.event.findUnique({
			where: { id: eventId },
			select: { name: true },
		});

		if (!event) {
			return { success: false, error: "Event not found" };
		}

		const response = await fetch(certificateDataUrl);
		const blob = await response.blob();
		const file = new File([blob], filename, { type: "image/png" });

		const folderName = `certificates/${event.name.replace(/\s+/g, "-").toLowerCase()}`;

		const cloudinaryUrl = await uploadImageToCloudinary(file, folderName);

		const certificate = await db.certificate.upsert({
			where: {
				eventId_userId: {
					eventId,
					userId,
				},
			},
			create: {
				eventId,
				userId,
				certificateType,
				link: cloudinaryUrl,
				issuedOn: new Date(),
				statusOfMailing: false,
				errorInMailing: false,
			},
			update: {
				certificateType,
				link: cloudinaryUrl,
				issuedOn: new Date(),
				statusOfMailing: false,
				errorInMailing: false,
			},
		});

		return {
			success: true,
			certificateId: certificate.id,
			url: cloudinaryUrl,
		};
	} catch (error) {
		console.error("Error uploading certificate:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function getCertificatesForEvent(eventId: number) {
	try {
		const certificates = await db.certificate.findMany({
			where: { eventId },
			include: {
				User: {
					select: {
						id: true,
						name: true,
						email: true,
						usn: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return {
			success: true,
			data: certificates,
		};
	} catch (error) {
		console.error("Error fetching certificates:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function sendCertificateEmail(certificateId: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		// Get certificate details
		const certificate = await db.certificate.findUnique({
			where: { id: certificateId },
			include: {
				User: {
					select: {
						name: true,
						email: true,
					},
				},
				Event: {
					select: {
						name: true,
					},
				},
			},
		});

		if (!certificate) {
			return { success: false, error: "Certificate not found" };
		}
		const res = await transporter.sendMail({
			from: '"Finite Loop Club" <flc@nmamit.in>',
			to: certificate.User.email,
			subject: `Your ${certificate.certificateType} Certificate for ${certificate.Event.name}`,
			html: `<p>Dear ${certificate.User.name},</p>
                   <p>Your ${certificate.certificateType} certificate for the event <strong>${certificate.Event.name}</strong> has been successfully generated.</p>
                   <p>You can download your certificate from the link below:</p>
                   <p><a href="${certificate.link}">Download Certificate</a></p>
                   <p>Thank you for participating!</p>
                   <p>Best regards,</p>
                   <p>Finite Loop Club</p>`,
		});

		if (res) {
			await db.certificate.update({
				where: { id: certificateId },
				data: {
					statusOfMailing: true,
					errorInMailing: false,
				},
			});

			return { success: true };
		} else {
			// Mark as failed
			await db.certificate.update({
				where: { id: certificateId },
				data: {
					statusOfMailing: false,
					errorInMailing: true,
				},
			});

			return { success: false, error: "Failed to send email" };
		}
	} catch (error) {
		console.error("Error sending certificate email:", error);

		// Mark as failed in database
		try {
			await db.certificate.update({
				where: { id: certificateId },
				data: {
					statusOfMailing: false,
					errorInMailing: true,
				},
			});
		} catch (dbError) {
			console.error("Error updating certificate status:", dbError);
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function getEventCertificateStatus(eventId: number): Promise<{
	success: boolean;
	status?:
		| "not_started"
		| "uploading"
		| "uploaded"
		| "mailing"
		| "completed"
		| "partial_failure";
	totalCertificates?: number;
	uploadedCertificates?: number;
	mailedCertificates?: number;
	failedMails?: number;
	error?: string;
}> {
	try {
		const certificates = await db.certificate.findMany({
			where: { eventId },
			select: {
				statusOfMailing: true,
				errorInMailing: true,
				link: true,
			},
		});

		const totalCertificates = certificates.length;

		if (totalCertificates === 0) {
			return {
				success: true,
				status: "not_started",
				totalCertificates: 0,
				uploadedCertificates: 0,
				mailedCertificates: 0,
				failedMails: 0,
			};
		}

		const uploadedCertificates = certificates.filter(
			(cert) => cert.link,
		).length;
		const mailedCertificates = certificates.filter(
			(cert) => cert.statusOfMailing,
		).length;
		const failedMails = certificates.filter(
			(cert) => cert.errorInMailing,
		).length;

		let status:
			| "not_started"
			| "uploading"
			| "uploaded"
			| "mailing"
			| "completed"
			| "partial_failure";

		if (uploadedCertificates === 0) {
			status = "not_started";
		} else if (uploadedCertificates < totalCertificates) {
			status = "uploading";
		} else if (mailedCertificates === 0 && failedMails === 0) {
			status = "uploaded";
		} else if (mailedCertificates < totalCertificates && failedMails === 0) {
			status = "mailing";
		} else if (mailedCertificates === totalCertificates) {
			status = "completed";
		} else {
			status = "partial_failure";
		}

		return {
			success: true,
			status,
			totalCertificates,
			uploadedCertificates,
			mailedCertificates,
			failedMails,
		};
	} catch (error) {
		console.error("Error getting certificate status:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function getEventCertificateList(eventId: number): Promise<{
	success: boolean;
	data?: EventCertificateStatus;
	error?: string;
}> {
	try {
		const certificates = await db.certificate.findMany({
			where: {
				eventId: eventId,
			},
			include: {
				User: {
					select: {
						name: true,
						email: true,
						usn: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (certificates.length === 0) {
			return {
				success: true,
				data: {
					eventId,
					totalCertificates: 0,
					sentCertificates: 0,
					errorCertificates: 0,
					certificates: [],
				},
			};
		}

		const sentCount = certificates.filter(
			(cert) => cert.statusOfMailing === true,
		).length;
		const errorCount = certificates.filter(
			(cert) => cert.errorInMailing === true,
		).length;

		const certificateStatuses: CertificateStatus[] = certificates.map(
			(cert) => ({
				id: cert.id,
				eventId: cert.eventId,
				userId: cert.userId,
				userName: cert.User.name,
				userEmail: cert.User.email,
				userUsn: cert.User.usn,
				link: cert.link || "",
				statusOfMailing: cert.statusOfMailing,
				errorInMailing: cert.errorInMailing,
				createdAt: cert.createdAt,
			}),
		);

		return {
			success: true,
			data: {
				eventId,
				totalCertificates: certificates.length,
				sentCertificates: sentCount,
				errorCertificates: errorCount,
				certificates: certificateStatuses,
			},
		};
	} catch (error) {
		console.error("Error getting event certificate list:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function clearAllCertificates({ eventId }: { eventId: number }) {
	try {
		const existingCertificates = await db.certificate.findMany({
			where: {
				eventId,
			},
			select: {
				id: true,
				link: true,
			},
		});
		for (const cert of existingCertificates) {
			if (cert.link) {
				const publicId = extractPublicIdFromUrl(cert.link);
				if (!publicId) {
					throw new Error("Invalid Cloudinary URL");
				}
				await deleteImageFromCloudinary(publicId);
			}

			await db.certificate.delete({
				where: { id: cert.id },
			});
		}

		return { success: true };
	} catch (error) {
		console.error("Error deleting certificates:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
