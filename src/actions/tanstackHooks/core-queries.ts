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

export type CorePageResponse = {
	coreMembers: CoreMemberType[];
	totalPages: number;
	totalCore: number;
	page: number;
	pageSize: number;
};

export const useCoreMembersQuery = ({
	page,
	pageSize,
}: {
	page: number;
	pageSize: number;
}) => {
	return useQuery<CorePageResponse>({
		queryKey: ["coreMembers", page, pageSize],
		queryFn: () => getCoreMembers({ page, pageSize }),
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
		mutationFn: addToCore,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["coreMembers"] });
			toast.success("Updated Core Successfully");
			onSuccessCallback?.();
		},
		onError: (error) => {
			toast.error(
				`Failed to add to core: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
			console.error("Error adding to core:", error);
		},
	});
};
