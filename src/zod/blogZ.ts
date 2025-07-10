import { z } from "zod";

export const StatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export type StatusType = z.infer<typeof StatusEnum>;

export const blogSchema = z.object({
	id: z.string().cuid().optional(),
	title: z
		.string()
		.min(1, { message: "Title is required" })
		.max(100, { message: "Title must be less than 100 characters" }),
	content: z.string().min(1, { message: "Content is required" }),
	excerpt: z.string().optional(),
	featuredImage: z
		.string()
		.url({ message: "must be a valid img URL" })
		.optional(),
	status: StatusEnum,
	readTime: z.number().min(1).optional(),
	words: z.number().min(1).optional(),
});

export type BlogType = z.infer<typeof blogSchema>;
