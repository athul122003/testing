"use client";

import {
	ArrowLeft,
	Bold,
	Eye,
	ImageIcon,
	Italic,
	Link,
	List,
	Save,
	Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";

interface BlogFormProps {
	setActivePage: (page: string) => void;
	editingBlog: any;
	setEditingBlog: (blog: any) => void;
}

export function BlogForm({
	setActivePage,
	editingBlog,
	setEditingBlog,
}: BlogFormProps) {
	const [formData, setFormData] = useState({
		title: "",
		content: "",
		excerpt: "",
		tags: "",
		status: "Draft",
	});

	useEffect(() => {
		if (editingBlog) {
			setFormData({
				title: editingBlog.title || "",
				content: editingBlog.content || "",
				excerpt: editingBlog.excerpt || "",
				tags: editingBlog.tags?.join(", ") || "",
				status: editingBlog.status || "Draft",
			});
		}
	}, [editingBlog]);

	const handleSave = () => {
		console.log("Saving blog:", formData);
		setActivePage("blogs");
		setEditingBlog(null);
	};

	const handleCancel = () => {
		setActivePage("blogs");
		setEditingBlog(null);
	};

	const formatText = (format: string) => {
		const textarea = document.getElementById(
			"blog-content",
		) as HTMLTextAreaElement;
		if (textarea) {
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const selectedText = formData.content.substring(start, end);

			let formattedText = "";
			switch (format) {
				case "bold":
					formattedText = `**${selectedText}**`;
					break;
				case "italic":
					formattedText = `*${selectedText}*`;
					break;
				case "list":
					formattedText = `\n- ${selectedText}`;
					break;
				case "link":
					formattedText = `[${selectedText}](url)`;
					break;
				default:
					formattedText = selectedText;
			}

			const newContent =
				formData.content.substring(0, start) +
				formattedText +
				formData.content.substring(end);
			setFormData({ ...formData, content: newContent });

			setTimeout(() => {
				textarea.focus();
				textarea.setSelectionRange(
					start + formattedText.length,
					start + formattedText.length,
				);
			}, 0);
		}
	};

	const insertImage = () => {
		const textarea = document.getElementById(
			"blog-content",
		) as HTMLTextAreaElement;
		if (textarea) {
			const start = textarea.selectionStart;
			const imageText = "\n![Image description](image-url)\n";
			const newContent =
				formData.content.substring(0, start) +
				imageText +
				formData.content.substring(start);
			setFormData({ ...formData, content: newContent });

			setTimeout(() => {
				textarea.focus();
				textarea.setSelectionRange(
					start + imageText.length,
					start + imageText.length,
				);
			}, 0);
		}
	};

	const renderPreview = () => {
		return (
			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h1 className="text-3xl font-bold mb-4">
					{formData.title || "Blog Title"}
				</h1>
				{formData.excerpt && (
					<p className="text-lg text-gray-600 dark:text-gray-400 italic mb-6">
						{formData.excerpt}
					</p>
				)}
				<div className="space-y-4">
					{formData.content.split("\n").map((line, index) => {
						// Generate a stable key based on line content and index for duplicates
						const key = `${line}-${index}`;
						if (line.startsWith("![")) {
							const match = line.match(/!\[([^\]]*)\]$$([^)]*)$$/);
							if (match) {
								return (
									<div
										key={`image-${key}`}
										className="my-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center"
									>
										<ImageIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
										<p className="text-sm text-blue-700 dark:text-blue-300">
											📷 {match[1] || "Image"}
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											{match[2]}
										</p>
									</div>
								);
							}
						}
						if (line.startsWith("**") && line.endsWith("**")) {
							return (
								<p key={`bold-${key}`} className="font-bold">
									{line.slice(2, -2)}
								</p>
							);
						}
						if (
							line.startsWith("*") &&
							line.endsWith("*") &&
							!line.startsWith("**")
						) {
							return (
								<p key={`italic-${key}`} className="italic">
									{line.slice(1, -1)}
								</p>
							);
						}
						if (line.startsWith("- ")) {
							return (
								<li key={`list-${key}`} className="ml-4 list-disc">
									{line.slice(2)}
								</li>
							);
						}
						if (line.startsWith("[") && line.includes("](")) {
							const match = line.match(/\[([^\]]*)\]$$([^)]*)$$/);
							if (match) {
								return (
									<p key={`link-${key}`}>
										<a
											href={match[2]}
											className="text-blue-500 hover:underline"
										>
											{match[1]}
										</a>
									</p>
								);
							}
						}
						return line ? (
							<p key={`plain-${key}`}>{line}</p>
						) : (
							<br key={`br-${key}`} />
						);
					})}
				</div>
				{formData.tags && (
					<div className="mt-6 pt-4 border-t">
						<div className="flex gap-2">
							{formData.tags.split(",").map((tag) => {
								const trimmedTag = tag.trim();
								if (!trimmedTag) return null;
								return (
									<Badge key={trimmedTag} variant="outline">
										{trimmedTag}
									</Badge>
								);
							})}
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-4">
				<Button variant="ghost" onClick={handleCancel} className="p-2">
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
						{editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						{editingBlog
							? "Update your blog post"
							: "Write and publish your blog content"}
					</p>
				</div>
			</div>

			<Tabs defaultValue="edit" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="edit">Edit</TabsTrigger>
					<TabsTrigger value="preview">Preview</TabsTrigger>
				</TabsList>

				<TabsContent value="edit" className="space-y-6">
					<Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
						<CardHeader>
							<CardTitle className="text-xl text-gray-900 dark:text-white">
								Blog Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="title">Title *</Label>
								<Input
									id="title"
									placeholder="Enter blog title"
									value={formData.title}
									onChange={(e) =>
										setFormData({ ...formData, title: e.target.value })
									}
									className="text-lg"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="excerpt">Excerpt</Label>
								<Textarea
									id="excerpt"
									placeholder="Brief description of your blog post"
									rows={2}
									value={formData.excerpt}
									onChange={(e) =>
										setFormData({ ...formData, excerpt: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Featured Image</Label>
								<div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
									<Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
									<p className="text-gray-600 dark:text-gray-400">
										Upload featured image
									</p>
									<p className="text-sm text-gray-500 dark:text-gray-500">
										PNG, JPG up to 5MB
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Content</Label>
								<div className="border rounded-xl overflow-hidden">
									<div className="flex items-center gap-2 p-3 border-b bg-gray-50 dark:bg-gray-800">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => formatText("bold")}
											title="Bold"
										>
											<Bold className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => formatText("italic")}
											title="Italic"
										>
											<Italic className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => formatText("list")}
											title="List"
										>
											<List className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => formatText("link")}
											title="Link"
										>
											<Link className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={insertImage}
											title="Insert Image"
										>
											<ImageIcon className="h-4 w-4" />
										</Button>
									</div>
									<Textarea
										id="blog-content"
										placeholder="Write your blog content here... Use **bold**, *italic*, and ![image](url) for formatting"
										rows={20}
										className="border-0 resize-none font-mono"
										value={formData.content}
										onChange={(e) =>
											setFormData({ ...formData, content: e.target.value })
										}
									/>
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Tip: Select text and use formatting buttons, or use markdown
									syntax directly
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="tags">Tags</Label>
								<Input
									id="tags"
									placeholder="Enter tags separated by commas (e.g., React, JavaScript, Web Development)"
									value={formData.tags}
									onChange={(e) =>
										setFormData({ ...formData, tags: e.target.value })
									}
								/>
							</div>

							<div className="flex justify-end space-x-3 pt-6 border-t">
								<Button variant="outline" onClick={handleCancel}>
									Cancel
								</Button>
								<Button
									onClick={handleSave}
									className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
								>
									<Save className="h-4 w-4 mr-2" />
									{editingBlog ? "Update Post" : "Save as Draft"}
								</Button>
								<Button
									onClick={() =>
										setFormData({ ...formData, status: "Published" })
									}
									className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
								>
									Publish Post
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="preview">
					<Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
								<Eye className="h-5 w-5" />
								Preview
							</CardTitle>
						</CardHeader>
						<CardContent className="p-8">{renderPreview()}</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
