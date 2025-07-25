import { NextResponse } from "next/server";
import { createBlog, getBlogs } from "~/actions/blog";
import { parseJwtFromAuthHeader } from "~/lib/utils";
import { blogSchema } from "~/zod/blogZ";

//fetch all blogs or fetch blogs by userId
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId") || undefined;
		const blogs = await getBlogs(userId);
		return NextResponse.json(blogs, { status: 200 });
	} catch (error) {
		console.error("Error fetching blogs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch blogs" },
			{ status: 500 },
		);
	}
}

//create blog
export async function POST(request: Request) {
	try {
		const authHeaders = request.headers.get("authorization");
		const data = parseJwtFromAuthHeader(authHeaders || "");
		if (!data || !data.userId) {
			return NextResponse.json(
				{ error: "Invalid or missing authentication data" },
				{ status: 401 },
			);
		}
		const body = await request.json();
		if (!body?.formData) {
			return NextResponse.json(
				{ error: "Form Data and User ID are required" },
				{ status: 400 },
			);
		}
		const validatedData = blogSchema.safeParse(body.formData);
		if (!validatedData.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: validatedData.error.format() },
				{ status: 400 },
			);
		}

		const newBlog = await createBlog(validatedData.data, data.userId);
		return NextResponse.json(newBlog, { status: 201 });
	} catch (error) {
		console.error("Failed to create post", error);
		return NextResponse.json(
			{ error: "Failed to create post" },
			{ status: 500 },
		);
	}
}
