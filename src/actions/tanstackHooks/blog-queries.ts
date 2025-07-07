import { queryClient } from "~/lib/reactQueryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	createOrUpdateBlog,
	getBlogs,
	deleteBlog,
	publishBlog,
	draftBlog,
} from "~/actions/blog";
import type { BlogFormData } from "~/components/blog/blog-form";
import { toast } from "sonner";

export type BlogWithUser = Awaited<ReturnType<typeof getBlogs>>;
export type Blog = BlogWithUser[number];

//fetch blogs query
export function useBlogs() {
	return useQuery({
		queryKey: ["blogs"],
		queryFn: getBlogs,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});
}

//create or update blog mutation
export function useBlogMutation({
	onSuccessCallback,
}: {
	onSuccessCallback?: () => void;
}) {
	return useMutation({
		mutationFn: async ({
			blogData,
			userId,
		}: {
			blogData: BlogFormData;
			userId: number;
		}) => {
			return await createOrUpdateBlog(blogData, userId);
		},
		onSuccess: () => {
			toast.success("blog saved successfully");
			queryClient.invalidateQueries({ queryKey: ["blogs"] });
			onSuccessCallback?.();
		},
		onError: (error) => {
			console.error("Error saving blog:", error);
			toast.error("Failed to save blog");
		},
	});
}

//publish blog mutation
export function usePublishBlogMutation({
	onSuccessCallback,
}: {
	onSuccessCallback?: () => void;
}) {
	return useMutation({
		mutationFn: async (blogId: string) => {
			return await publishBlog(blogId);
		},
		onSuccess: () => {
			toast.success("Blog Published successfully");
			queryClient.invalidateQueries({ queryKey: ["blogs"] });
			onSuccessCallback?.();
		},
		onError: (error) => {
			toast.error("Failed to publish blog");
			console.error("Error publishing blog:", error);
		},
	});
}

//draft blog mutation

export function useDraftBlogMutation({
	onSuccessCallback,
}: {
	onSuccessCallback?: () => void;
}) {
	return useMutation({
		mutationFn: async (blogId: string) => {
			return await draftBlog(blogId);
		},
		onSuccess: () => {
			toast.success("Blog drafted successfully");
			queryClient.invalidateQueries({ queryKey: ["blogs"] });
			onSuccessCallback?.();
		},
		onError: (error) => {
			toast.error("Failed to draft blog");
			console.error("Error drafting blog:", error);
		},
	});
}

//delete blog mutation
export function useDeleteBlogMutation({
	onSuccessCallback,
}: {
	onSuccessCallback?: () => void;
}) {
	return useMutation({
		mutationFn: async (blogId: string) => {
			return await deleteBlog(blogId);
		},
		onSuccess: () => {
			toast.success("Blog Deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["blogs"] });
			onSuccessCallback?.();
		},
		onError: (error) => {
			toast.error("Failed to delete blog");
			console.error("Error deleting blog:", error);
		},
	});
}
