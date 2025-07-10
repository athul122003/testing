import { NextResponse } from "next/server";
import { createOrUpdateBlog, getBlogs } from "~/actions/blog";
import { blogSchema } from "~/zod/blogZ";

export async function GET() {
	try {
		const blogs = await getBlogs();
		return NextResponse.json(blogs, { status: 200 });
	} catch (error) {
		console.error("Error fetching blogs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch blogs" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const validatedData = blogSchema.safeParse(body.formData);
		if (!validatedData.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: validatedData.error.format() },
				{ status: 400 },
			);
		}
		const userId = body.userId;
		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}
		const blog = await createOrUpdateBlog(validatedData.data, userId);
		return NextResponse.json(blog, { status: 201 });
	} catch (error) {
		console.error("Failed to create post", error);
		return NextResponse.json(
			{ error: "Failed to create post" },
			{ status: 500 },
		);
	}
}
