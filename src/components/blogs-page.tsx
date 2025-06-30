"use client";

import { Bold, ImageIcon, Italic, List, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export function BlogsPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Blogs</h1>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Add Blog
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Blog Post</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="blog-title">Title</Label>
								<Input id="blog-title" placeholder="Enter blog title" />
							</div>

							<div className="space-y-2">
								<Label>Content</Label>
								<div className="border rounded-lg">
									<div className="flex items-center gap-2 p-2 border-b">
										<Button variant="ghost" size="sm">
											<Bold className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm">
											<Italic className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm">
											<List className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm">
											<ImageIcon className="h-4 w-4" />
										</Button>
									</div>
									<Textarea
										placeholder="Write your blog content here..."
										rows={10}
										className="border-0 resize-none"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Featured Image</Label>
								<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
									<ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
									<p className="text-sm text-gray-500">Upload featured image</p>
								</div>
							</div>

							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setIsCreateOpen(false)}
								>
									Cancel
								</Button>
								<Button onClick={() => setIsCreateOpen(false)}>
									Publish Blog
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Blog Posts</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<p>No blog posts yet. Create your first blog post!</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
