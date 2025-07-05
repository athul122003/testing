import { useQuery } from "@tanstack/react-query";
import { getPaymentInfo, getSummaryStats } from "~/actions/payment-info";

export type PaymentWithUser = Awaited<ReturnType<typeof getPaymentInfo>>;
export type SummaryStats = Awaited<ReturnType<typeof getSummaryStats>>;

export const usePayments = ({
	page,
	pageSize,
	dateFilter,
}: {
	page: number;
	pageSize: number;
	dateFilter?: { startDate?: Date; endDate?: Date };
}) => {
	return useQuery<PaymentWithUser>({
		queryKey: ["payments", page, pageSize, dateFilter],
		queryFn: () => getPaymentInfo({ page, pageSize, ...dateFilter }),
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});
};

export const useSummaryStats = () => {
	return useQuery<SummaryStats>({
		queryKey: ["summaryStats"],
		queryFn: () => getSummaryStats(),
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});
};
