import { useQuery } from "@tanstack/react-query";
import { getAllEvents } from "../event";

export const useEvents = () => {
	return useQuery({
		queryKey: ["events"],
		queryFn: getAllEvents,
		refetchOnWindowFocus: false,
		staleTime: 30_000,
	});
};
