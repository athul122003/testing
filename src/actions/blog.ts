"use server";

import prisma from "~/lib/prisma";
import type { BlogFormData } from "~/components/blog/blog-form";

const getBlogs = async () => {
	try {
		const blogs = await prisma.blog.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				User: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});
		return blogs;
	} catch (error) {
		console.error("Error fetching blogs:", error);
		throw new Error("Failed to fetch blogs");
	}
};
const createOrUpdateBlog = async (blogData: BlogFormData, userId: number) => {
	try {
		if (blogData.id) {
			const updatedBlog = await prisma.blog.update({
				where: { id: blogData.id },
				data: {
					title: blogData.title,
					content: blogData.content,
					description: blogData.excerpt ?? "",
					blogState: blogData.status,
					readTime: blogData.readTime ?? 0,
					words: blogData.words ?? 0,
					image: blogData.featuredImage ?? null,
				},
			});

			console.log("Blog updated successfully:", updatedBlog);
			return updatedBlog;
		} else {
			const newBlog = await prisma.blog.create({
				data: {
					title: blogData.title,
					content: blogData.content,
					description: blogData.excerpt ?? "",
					userId,
					blogState: blogData.status,
					reviewState: "PENDING",
					readTime: blogData.readTime ?? 0,
					words: blogData.words ?? 0,
					image: blogData.featuredImage ?? null,
					feedback: "",
				},
			});

			console.log("Blog created successfully:", newBlog);
			return newBlog;
		}
	} catch (error) {
		console.error("Error creating/updating blog:", error);
		throw new Error("Failed to create or update blog");
	}
};

const deleteBlog = async (blogId: string) => {
	try {
		const deletedBlog = await prisma.blog.delete({
			where: { id: blogId },
		});
		console.log("Blog deleted successfully:", deletedBlog);
		return deletedBlog;
	} catch (error) {
		console.error("Error deleting blog:", error);
		throw new Error("Failed to delete blog");
	}
};

export { getBlogs, createOrUpdateBlog, deleteBlog };
