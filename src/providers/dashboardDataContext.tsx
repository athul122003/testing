"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { getPaymentInfo, getSummaryStats } from "~/actions/payment-info";
import type {
	PaymentWithUser,
	SummaryStats,
} from "~/actions/tanstackHooks/payment-queries";

type DashboardDataContextType = {
	// Data results
	paymentsQuery: UseQueryResult<PaymentWithUser>;
	summaryStatsQuery: UseQueryResult<SummaryStats>;

	// Refetchers
	refetchPayments: () => void;
	refetchStats: () => void;

	// Params setters
	setPaymentParams: (
		page: number,
		pageSize: number,
		dateFilter?: { startDate?: Date; endDate?: Date },
	) => void;
};

const DashboardDataContext = createContext<DashboardDataContextType | null>(
	null,
);

export const DashboardDataProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	// Store args in state
	const [paymentArgs, setPaymentArgs] = useState<{
		page: number;
		pageSize: number;
		startDate?: Date;
		endDate?: Date;
	}>({
		page: 1,
		pageSize: 20,
	});

	const setPaymentParams = useCallback(
		(
			page: number,
			pageSize: number,
			dateFilter?: { startDate?: Date; endDate?: Date },
		) => {
			setPaymentArgs({ page, pageSize, ...dateFilter });
		},
		[],
	);

	// Query for Payments
	const paymentsQuery = useQuery<PaymentWithUser>({
		queryKey: [
			"payments",
			paymentArgs.page,
			paymentArgs.pageSize,
			paymentArgs.startDate,
			paymentArgs.endDate,
		],
		queryFn: () =>
			getPaymentInfo({
				page: paymentArgs.page,
				pageSize: paymentArgs.pageSize,
				startDate: paymentArgs.startDate,
				endDate: paymentArgs.endDate,
			}),
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});

	// Query for Summary Stats
	const summaryStatsQuery = useQuery<SummaryStats>({
		queryKey: ["summaryStats"],
		queryFn: getSummaryStats,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});

	const value: DashboardDataContextType = {
		paymentsQuery,
		summaryStatsQuery,
		refetchPayments: paymentsQuery.refetch,
		refetchStats: summaryStatsQuery.refetch,
		setPaymentParams,
	};

	return (
		<DashboardDataContext.Provider value={value}>
			{children}
		</DashboardDataContext.Provider>
	);
};

export const useDashboardData = () => {
	const ctx = useContext(DashboardDataContext);
	if (!ctx) {
		throw new Error(
			"useDashboardData must be used within a DashboardDataProvider",
		);
	}
	return ctx;
};
