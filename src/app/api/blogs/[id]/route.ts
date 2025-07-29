import { NextResponse, type NextRequest } from "next/server";
import { getBlogById, updateBlogById } from "~/actions/blog";
import { parseJwtFromAuthHeader } from "~/lib/utils";
import { blogSchema } from "~/zod/blogZ";

//fixed build error its due to the latest nextjs version which expects params to be a promise
export const GET = async (
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) => {
	const { id } = await context.params;
	console.log("GET request received for blog ID:", id);
	try {
		if (!id) {
			return NextResponse.json(
				{ error: "Blog ID is required" },
				{ status: 400 },
			);
		}
		const blog = await getBlogById(id);
		if (!blog) {
			return NextResponse.json({ error: "Blog not found" }, { status: 404 });
		}
		return NextResponse.json(blog, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json(
			{ error: "Failed to fetch blog", details: (error as Error).message },
			{ status: 500 },
		);
	}
};

export const PATCH = async (
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) => {
	const authHeaders = request.headers.get("authorization");
	const data = parseJwtFromAuthHeader(authHeaders || "");

	if (!data || !data.userId) {
		return NextResponse.json(
			{ error: "Invalid or missing authentication data" },
			{ status: 401 },
		);
	}
	const userId = data.userId;
	console.log("User ID from token:", userId);
	const body = await request.json();

	if (!body?.formData) {
		return NextResponse.json(
			{ error: "Form Data is required" },
			{ status: 400 },
		);
	}

	const { id } = await context.params;
	if (!id) {
		return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
	}

	const result = blogSchema.safeParse(body.formData);
	if (!result.success) {
		return NextResponse.json(
			{ error: "Invalid data", details: result.error.format() },
			{ status: 400 },
		);
	}
	try {
		const updatedBlog = await updateBlogById(id, userId, result.data);
		if (!updatedBlog) {
			throw new Error("Blog not found or update failed");
		}
		return NextResponse.json(updatedBlog, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json(
			{ error: "Failed to update blog", details: (error as Error).message },
			{ status: 500 },
		);
	}
};
