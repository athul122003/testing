// @ts-nocheck
"use client";

import { Calendar, Eye, FileText, Plus, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";

const initialBlogs = [
	{
		id: 1,
		title: "Getting Started with React: A Comprehensive Guide",
		content:
			"React is a powerful JavaScript library for building user interfaces. In this comprehensive guide, we'll explore the fundamentals of React and how to build modern web applications. We'll cover components, state management, hooks, and best practices for modern React development.",
		excerpt:
			"Learn the fundamentals of React and build modern web applications with this comprehensive guide.",
		date: "2024-01-15",
		author: "Admin",
		status: "Published",
		views: 1250,
		image: "/placeholder.svg?height=300&width=500",
		tags: ["React", "JavaScript", "Web Development"],
	},
	{
		id: 2,
		title: "Modern CSS Techniques for Better Web Design",
		content:
			"Explore the latest CSS features and how to use them effectively in your projects. From Grid and Flexbox to custom properties and animations, we'll cover everything you need to know about modern CSS development.",
		excerpt:
			"Discover the latest CSS features and techniques for creating beautiful, responsive web designs.",
		date: "2024-01-10",
		author: "Admin",
		status: "Draft",
		views: 0,
		image: "/placeholder.svg?height=300&width=500",
		tags: ["CSS", "Web Design", "Frontend"],
	},
];

interface BlogsPageProps {
	setActivePage: (page: string) => void;
	setEditingBlog: (blog: any) => void;
}

export function BlogsPage({ setActivePage, setEditingBlog }: BlogsPageProps) {
	const [blogs, setBlogs] = useState(initialBlogs);
	const [selectedBlog, setSelectedBlog] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const handleCreateBlog = () => {
		setEditingBlog(null);
		setActivePage("blog-form");
	};

	const handleEditBlog = (blog) => {
		setEditingBlog(blog);
		setActivePage("blog-form");
		setIsDetailOpen(false);
	};

	const handleDeleteBlog = (blogId) => {
		setBlogs(blogs.filter((blog) => blog.id !== blogId));
		setIsDetailOpen(false);
	};

	const handlePublishBlog = (blogId) => {
		setBlogs(
			blogs.map((blog) =>
				blog.id === blogId ? { ...blog, status: "Published" } : blog,
			),
		);
		setIsDetailOpen(false);
	};

	const handleBlogClick = (blog) => {
		setSelectedBlog(blog);
		setIsDetailOpen(true);
	};

	const getStatusColor = (status: string) => {
		return status === "Published"
			? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
			: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
	};

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
						onClick={() => handleBlogClick(blog)}
					>
						<div className="relative">
							<img
								src={blog.image || "/placeholder.svg"}
								alt={blog.title}
								className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
							<div
								className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}
							>
								{blog.status}
							</div>
							<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
									<Eye className="h-4 w-4" />
								</div>
							</div>
						</div>
						<CardContent className="p-6">
							<div className="space-y-4">
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
										{blog.title}
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
										{blog.excerpt}
									</p>
								</div>

								<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
									<div className="flex items-center gap-2">
										<User className="h-4 w-4" />
										<span>{blog.author}</span>
									</div>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										<span>{blog.date}</span>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Eye className="h-4 w-4" />
										<span className="text-sm">{blog.views} views</span>
									</div>
									<Badge
										variant={
											blog.status === "Published" ? "default" : "secondary"
										}
									>
										{blog.status}
									</Badge>
								</div>

								<div className="flex gap-2">
									{blog.tags.slice(0, 2).map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
									{blog.tags.length > 2 && (
										<Badge variant="outline" className="text-xs">
											+{blog.tags.length - 2}
										</Badge>
									)}
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

			{/* Blog Detail Modal */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-2xl">
							{selectedBlog?.title}
						</DialogTitle>
					</DialogHeader>
					{selectedBlog && (
						<div className="space-y-6">
							<div className="relative">
								<img
									src={selectedBlog.image || "/placeholder.svg"}
									alt={selectedBlog.title}
									className="w-full h-64 object-cover rounded-lg"
								/>
								<div
									className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBlog.status)}`}
								>
									{selectedBlog.status}
								</div>
							</div>

							<div className="grid grid-cols-3 gap-6">
								<div className="col-span-2 space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
											Content
										</h3>
										<div className="prose prose-gray dark:prose-invert max-w-none">
											<p className="text-gray-600 dark:text-gray-400">
												{selectedBlog.content}
											</p>
										</div>
									</div>

									<div className="flex gap-2">
										{selectedBlog.tags.map((tag) => (
											<Badge key={tag} variant="outline">
												{tag}
											</Badge>
										))}
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
											Post Details
										</h3>
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<User className="h-4 w-4 text-gray-500" />
												<span className="text-sm">
													Author: {selectedBlog.author}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-gray-500" />
												<span className="text-sm">
													Published: {selectedBlog.date}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Eye className="h-4 w-4 text-gray-500" />
												<span className="text-sm">
													Views: {selectedBlog.views}
												</span>
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
											Status
										</h3>
										<Badge
											className={getStatusColor(selectedBlog.status)}
											variant="outline"
										>
											{selectedBlog.status}
										</Badge>
									</div>
								</div>
							</div>

							<div className="flex justify-end space-x-3 pt-4 border-t">
								{selectedBlog.status === "Draft" && (
									<Button
										onClick={() => handlePublishBlog(selectedBlog.id)}
										className="bg-green-600 hover:bg-green-700 text-white"
									>
										Publish Post
									</Button>
								)}
								<Button
									variant="outline"
									onClick={() => handleEditBlog(selectedBlog)}
								>
									Edit Post
								</Button>
								<Button
									variant="destructive"
									onClick={() => handleDeleteBlog(selectedBlog.id)}
								>
									Delete Post
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
