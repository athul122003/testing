import { useQuery } from "@tanstack/react-query";
import { getAllEvents } from "../actions/event";
import { EventType } from "../../../generated/prisma";

export const useEvents = () => {
	return useQuery({
		queryKey: ["events"],
		queryFn: getAllEvents,
		refetchOnWindowFocus: false,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
