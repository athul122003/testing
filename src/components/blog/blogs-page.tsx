"use client";

import { Calendar, Eye, FileText, Plus, User } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { deleteBlog } from "~/actions/blog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";

import { getBlogs } from "~/actions/blog";
import { BlogPreview } from "./BlogPreview";

export type BlogWithUser = Awaited<ReturnType<typeof getBlogs>>;
export type Blog = BlogWithUser[number];

interface BlogsPageProps {
	setActivePage: (page: string) => void;
	setEditingBlog: (blog: Blog | null) => void;
}

export function BlogsPage({ setActivePage, setEditingBlog }: BlogsPageProps) {
	const { data: session } = useSession();
	const currentUserId = session?.user?.id;

	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchBlogs = async () => {
			try {
				const blogs = await getBlogs();
				setBlogs(blogs);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching blogs:", error);
			}
		};

		fetchBlogs();
	}, []);

	const handleCreateBlog = () => {
		setEditingBlog(null);
		setActivePage("blog-form");
	};

	const handleEditBlog = (blog: Blog) => {
		setEditingBlog(blog);
		setActivePage("blog-form");
		setIsDetailOpen(false);
	};

	const handleDeleteBlog = async (blogId: string) => {
		try {
			await deleteBlog(blogId);
			setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
			setIsDetailOpen(false);
		} catch (error) {
			console.error("Failed to delete blog:", error);
			alert("Something went wrong while deleting the blog.");
		}
	};

	const handlePublishBlog = (blogId: string) => {
		setBlogs((prev) =>
			prev.map((blog) =>
				blog.id === blogId ? { ...blog, blogState: "PUBLISHED" } : blog,
			),
		);
		setIsDetailOpen(false);
	};

	const getStatusColor = (status: string) => {
		return status === "PUBLISHED"
			? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
			: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-gray-500 dark:text-gray-400">Loading blogs...</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
						Blog Posts
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Create and manage your blog content
					</p>
				</div>
				<Button
					onClick={handleCreateBlog}
					className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
				>
					<Plus className="h-4 w-4 mr-2" />
					Create Post
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{blogs.map((blog) => (
					<Card
						key={blog.id}
						className="border-0 shadow-lg bg-white dark:bg-gray-900 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
						onClick={() => {
							setSelectedBlog(blog);
							setIsDetailOpen(true);
						}}
					>
						<div className="relative">
							<Image
								width={400}
								height={300}
								src={blog.image || "/placeholder.svg"}
								alt={blog.title}
								className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
							<div
								className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
									blog.blogState,
								)}`}
							>
								{blog.blogState}
							</div>
						</div>
						<CardContent className="p-6">
							<div className="space-y-4">
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
										{blog.title}
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
										{blog.description}
									</p>
								</div>

								<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
									<div className="flex items-center gap-2">
										<User className="h-4 w-4" />
										<span>{blog.User.name}</span>
									</div>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										<span>{new Date(blog.createdAt).toLocaleDateString()}</span>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Eye className="h-4 w-4" />
									<span className="text-sm">
										{blog.words} words • {blog.readTime} min read
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{blogs.length === 0 && (
				<Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
					<CardContent className="text-center py-12">
						<FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<p className="text-gray-600 dark:text-gray-400 text-lg">
							No blog posts yet
						</p>
						<p className="text-gray-500 dark:text-gray-500">
							Create your first blog post to get started!
						</p>
					</CardContent>
				</Card>
			)}

			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					{selectedBlog && (
						<>
							<DialogHeader>
								<DialogTitle className="text-2xl">
									{selectedBlog.title}
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-6">
								<div className="relative">
									<Image
										width={400}
										height={300}
										src={selectedBlog.image || "/placeholder.svg"}
										alt={selectedBlog.title}
										className="w-full h-64 object-cover rounded-lg"
									/>
									<div
										className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
											selectedBlog.blogState,
										)}`}
									>
										{selectedBlog.blogState}
									</div>
								</div>

								<div className="space-y-4">
									<div className="space-y-4">
										<div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
											<BlogPreview content={selectedBlog.content} />
										</div>
									</div>

									{selectedBlog.feedback && (
										<div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded">
											<h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
												Reviewer Feedback:
											</h4>
											<p className="text-sm text-yellow-700 dark:text-yellow-200">
												{selectedBlog.feedback}
											</p>
										</div>
									)}

									<div className="text-sm text-gray-600 dark:text-gray-400">
										<p>Author: {selectedBlog.User.name}</p>
										<p>
											Posted on:{" "}
											{new Date(selectedBlog.createdAt).toLocaleDateString()}
										</p>
										<p>Review State: {selectedBlog.reviewState}</p>
									</div>

									<div className="flex justify-end gap-2 pt-4 border-t">
										{selectedBlog.blogState === "DRAFT" && (
											<Button
												onClick={() => handlePublishBlog(selectedBlog.id)}
												className="bg-green-600 hover:bg-green-700 text-white"
											>
												Publish
											</Button>
										)}

										{selectedBlog.userId === currentUserId && (
											<Button
												variant="outline"
												onClick={() => handleEditBlog(selectedBlog)}
											>
												Edit
											</Button>
										)}

										<Button
											variant="destructive"
											onClick={() => handleDeleteBlog(selectedBlog.id)}
										>
											Delete
										</Button>
									</div>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
