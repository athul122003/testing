import { useMutation, useQuery } from "@tanstack/react-query";
import { addToCore } from "../core";
import { queryClient } from "~/lib/reactQueryClient";
import { getCoreMembers } from "../core";
import { toast } from "sonner";

export type CoreMemberType = {
	User: {
		name: string;
		email: string;
	};
	id: string;
	userId: number;
	year: string;
	type: string;
	priority: number;
	position: string;
};

export const useCoreMembersQuery = () => {
	return useQuery<CoreMemberType[]>({
		queryKey: ["coreMembers"],
		queryFn: getCoreMembers,
		placeholderData: (prev) => prev,
		staleTime: 1000 * 60 * 5,
	});
};

export const useAddToCoreMutation = ({
	onSuccessCallback,
}: {
	onSuccessCallback?: () => void;
}) => {
	return useMutation({
		mutationFn: async (formData: FormData) => {
			return await addToCore(formData);
		},
		onSuccess: () => {
			toast.success("Added to core successfully");
			onSuccessCallback?.();
		},
		onError: (error) => {
			toast.error("Failed to add to core");
			console.error("Error adding to core:", error);
		},
	});
};
