// lib/env.ts

import { z } from "zod";

const envSchema = z.object({
	NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
	NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
	RAZORPAY_API_KEY_ID: z.string().min(1, "RAZORPAY_API_KEY_ID is required"),
	NEXT_PUBLIC_FRONTEND_URL: z
		.string()
		.url("NEXT_PUBLIC_FRONTEND_URL must be a valid URL"),
	RAZORPAY_SECRET: z.string().min(1, "RAZORPAY_SECRET is required"),
	SMTP_GMAIL: z.string().email("SMTP_GMAIL must be a valid email"),
	SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
	NODE_ENV: z.enum(["development", "production"], {
		message: "NODE_ENV must be either 'development' or 'production'",
	}),
	NEXT_PUBLIC_RAZORPAY_API_KEY_ID: z
		.string()
		.min(1, "NEXT_PUBLIC_RAZORPAY_API_KEY_ID is required"),
	CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
	CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
	CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

let env: z.infer<typeof envSchema>;

try {
	env = envSchema.parse(process.env);
} catch (error) {
	console.error("\n⛔ ENVIRONMENT VALIDATION ERROR");
	console.log("------------------------------------------------------");

	if (error instanceof z.ZodError) {
		for (const issue of error.errors) {
			console.log(
				`🚨 Missing or invalid: ${issue.path.join(".")} → ${issue.message}`,
			);
		}

		console.log("------------------------------------------------------");
		console.log("💡 Fix the above variables in your .env file");
		console.log("🔄 Restart the server after fixing them\n");
	}

	process.exit(1); // Stop the server if env is invalid
}

export { env };
