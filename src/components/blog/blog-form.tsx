"use client";

import type { Blog } from "@prisma/client";
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
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { uploadImageToCloudinary } from "~/lib/cloudinaryImageUploader";
import { getBlogMeta } from "~/lib/getBlogMetaData";
import { BlogPreview } from "./BlogPreview";
import { formatMarkdownText } from "~/lib/formatMarkdownText";
import type { FormatType } from "~/lib/formatMarkdownText";
import { useBlogMutation } from "~/actions/tanstackHooks/blog-queries";
import { blogSchema, type BlogType, type StatusType } from "~/zod/blogZ";
import { toast } from "sonner";

interface BlogFormProps {
	setActivePage: (page: string) => void;
	editingBlog: Blog | null;
	setEditingBlog: (blog: Blog | null) => void;
}

export function BlogForm({
	setActivePage,
	editingBlog,
	setEditingBlog,
}: BlogFormProps) {
	const [formData, setFormData] = useState<BlogType>({
		title: "",
		content: "",
		excerpt: "",
		featuredImage: "",
		status: "DRAFT",
	});

	const [isPending, setIsPending] = useState(false);
	const { mutate } = useBlogMutation({
		onSuccessCallback: () => {
			setActivePage("blogs");
			setEditingBlog(null);
		},
	});

	const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);

	const { data: session } = useSession();

	const markdownImageInputRef = useRef<HTMLInputElement | null>(null);
	const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (editingBlog) {
			setFormData({
				title: editingBlog.title || "",
				content: editingBlog.content || "",
				excerpt: editingBlog.description || "",
				// tags: editingBlog.tags?.join(", ") || "",
				featuredImage: editingBlog.coverImage || "",
				status: editingBlog.blogState as StatusType,
			});
		}
	}, [editingBlog]);

	const handleSubmit = async (status: StatusType) => {
		if (!session?.user?.id) {
			alert("You must be logged in to submit a blog.");
			return;
		}
		setIsPending(true);
		const userId = session.user.id as number;
		let imageUrl = formData.featuredImage;

		if (featuredImageFile) {
			if (featuredImageFile.size > 1024 * 1024) {
				toast.error("Featured image must be ≤ 1MB.");
				return;
			}

			try {
				imageUrl = await uploadImageToCloudinary(
					featuredImageFile,
					"flc-blogs/featured",
				);
			} catch (err) {
				console.error("Failed to upload image", err);
				alert("Image upload failed.");
				return;
			}
		}

		const { readTime, words } = getBlogMeta(formData.content);

		const blogData: BlogType = {
			...formData,
			status,
			featuredImage: imageUrl || "",
			readTime,
			words,
			id: editingBlog?.id || undefined,
		};

		const validatedData = blogSchema.safeParse(blogData);
		if (!validatedData.success) {
			const errorMessage = validatedData.error.errors
				.map((err) => `${err.path.join(".")}: ${err.message}`)
				.join("\n");
			toast.error("Invalid Blog Data: " + errorMessage);
			return;
		}

		mutate({
			blogData,
			userId,
		});
		setIsPending(false);
	};

	const handleCancel = () => {
		setActivePage("blogs");
		setEditingBlog(null);
	};

	const formatText = (type: FormatType) => {
		const textarea = textAreaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const newContent = formatMarkdownText({
			content: formData.content,
			type,
			start,
			end,
		});
		setFormData({ ...formData, content: newContent });

		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(
				start + (newContent.length - formData.content.length),
				start + (newContent.length - formData.content.length),
			);
		}, 0);
	};

	const handleImageUpload = async (file: File) => {
		try {
			const imageUrl = await uploadImageToCloudinary(file, "flc-blogs");
			const textarea = document.getElementById(
				"blog-content",
			) as HTMLTextAreaElement;
			if (!textarea) return;

			const start = textarea.selectionStart;
			const markdown = `\n![Image description](${imageUrl})\n`;
			const updated =
				formData.content.slice(0, start) +
				markdown +
				formData.content.slice(start);

			setFormData({ ...formData, content: updated });

			setTimeout(() => {
				textarea.focus();
				textarea.setSelectionRange(
					start + markdown.length,
					start + markdown.length,
				);
			}, 0);
		} catch (error) {
			console.error("Image insert failed:", error);
			alert("Failed to upload image");
		}
	};

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file) {
			await handleImageUpload(file);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			await handleImageUpload(file);
		}
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

								<div className="space-y-2">
									<Label htmlFor="featured-image-upload">Featured Image</Label>

									<button
										type="button"
										onClick={() => featuredImageInputRef.current?.click()}
										className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
									>
										{formData.featuredImage ? (
											<>
												<Image
													src={formData.featuredImage}
													alt="Featured"
													width={800}
													height={400}
													className="mx-auto h-48 object-contain rounded-lg shadow"
												/>
												<p className="mt-4 text-green-600 dark:text-green-400 text-sm font-medium">
													Image Selected
												</p>
											</>
										) : (
											<>
												<Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
												<p className="text-gray-600 dark:text-gray-400">
													Upload featured image
												</p>
												<p className="text-sm text-gray-500 dark:text-gray-500">
													PNG, JPG up to 5MB
												</p>
											</>
										)}
									</button>

									<input
										type="file"
										id="featured-image-upload"
										accept="image/*"
										ref={featuredImageInputRef}
										className="hidden"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (!file) return;
											setFeaturedImageFile(file);
											const previewUrl = URL.createObjectURL(file);
											setFormData((prev) => ({
												...prev,
												featuredImage: previewUrl,
											}));
										}}
									/>
								</div>

								<div className="space-y-2">
									<Label id="blog-content-label" htmlFor="blog-content">
										Content
									</Label>

									<section
										onDrop={handleDrop}
										onDragOver={(e) => e.preventDefault()}
										className="border rounded-xl overflow-hidden"
										aria-labelledby="blog-content-label"
									>
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
												onClick={() => markdownImageInputRef.current?.click()}
												title="Upload Image"
											>
												<ImageIcon className="h-4 w-4" />
											</Button>

											<input
												type="file"
												accept="image/*"
												ref={markdownImageInputRef}
												className="hidden"
												onChange={handleFileChange}
											/>
										</div>

										<Textarea
											id="blog-content"
											ref={textAreaRef}
											placeholder="Write your blog content here..."
											rows={20}
											className="border-0 resize-none font-mono"
											value={formData.content}
											onChange={(e) =>
												setFormData({ ...formData, content: e.target.value })
											}
										/>
									</section>
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Tip: Drag and drop or use the image icon to insert images.
								</div>
							</div>

							{/* <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g., React, JavaScript, Web Development)"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div> */}

							<div className="flex justify-end space-x-3 pt-6 border-t">
								<Button variant="outline" onClick={handleCancel}>
									Cancel
								</Button>
								<Button
									disabled={isPending}
									onClick={() =>
										handleSubmit(
											editingBlog?.blogState === "PUBLISHED"
												? "PUBLISHED"
												: "DRAFT",
										)
									}
									className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
								>
									<Save className="h-4 w-4 mr-2" />
									{isPending
										? editingBlog
											? "Updating..."
											: "Saving..."
										: editingBlog
											? "Update"
											: "Save as Draft"}
								</Button>

								{editingBlog?.blogState === "PUBLISHED" && (
									<Button
										variant="secondary"
										disabled={isPending}
										onClick={() => handleSubmit("DRAFT")}
										className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-800"
									>
										{isPending ? "Reverting..." : "Revert to Draft"}
									</Button>
								)}

								<Button
									disabled={isPending}
									onClick={() => handleSubmit("PUBLISHED")}
									className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
								>
									{`${isPending ? "Publishing..." : "Publish"}`}
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
						<CardContent className="p-8">
							<BlogPreview
								title={formData.title}
								excerpt={formData.excerpt}
								content={formData.content}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
