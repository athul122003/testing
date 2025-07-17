//:TODO
import { useMutation } from "@tanstack/react-query";
import { addToCore } from "../core";
import { queryClient } from "~/lib/reactQueryClient";
import { toast } from "sonner";

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
