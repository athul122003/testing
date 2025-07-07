"use client";

import type { Permission, Role } from "@prisma/client";
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
import { api } from "~/lib/api";

type DashboardDataContextType = {
	paymentsQuery: UseQueryResult<PaymentWithUser>;
	summaryStatsQuery: UseQueryResult<SummaryStats>;
	rolesQuery: UseQueryResult<Role[]>;
	permissionsQuery: UseQueryResult<Permission[]>;

	refetchPayments: () => void;
	refetchStats: () => void;
	refetchUsers: () => void;

	setPaymentParams: (
		page: number,
		pageSize: number,
		dateFilter?: { startDate?: Date; endDate?: Date },
	) => void;

	usersQuery: UseQueryResult<any>;

	setUserParams: (
		query: string,
		page: number,
		limit: number,
		sortBy: string,
		sortOrder: "asc" | "desc",
		role?: string,
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
	const [paymentArgs, setPaymentArgs] = useState<{
		page: number;
		pageSize: number;
		startDate?: Date;
		endDate?: Date;
	}>({
		page: 1,
		pageSize: 20,
	});

	const [userArgs, setUserArgs] = useState<{
		query: string;
		page: number;
		limit: number;
		sortBy: string;
		sortOrder: "asc" | "desc";
		role?: string;
	}>({
		query: "",
		page: 1,
		limit: 10,
		sortBy: "role",
		sortOrder: "asc",
	});

	const setUserParams = useCallback(
		(
			query: string,
			page: number,
			limit: number,
			sortBy: string,
			sortOrder: "asc" | "desc",
			role?: string,
		) => {
			setUserArgs({ query, page, limit, sortBy, sortOrder, role });
		},
		[],
	);

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

	const summaryStatsQuery = useQuery<SummaryStats>({
		queryKey: ["summaryStats"],
		queryFn: getSummaryStats,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});

	const rolesQuery = useQuery({
		queryKey: ["getRoles"],
		queryFn: api.role.getAll,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});

	const permissionsQuery = useQuery({
		queryKey: ["getPermissions"],
		queryFn: api.permission.getAll,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});

	const usersQuery = useQuery({
		queryKey: [
			"users",
			userArgs.query,
			userArgs.page,
			userArgs.limit,
			userArgs.sortBy,
			userArgs.sortOrder,
			userArgs.role,
		],
		queryFn: () =>
			api.user.searchUser({
				query: userArgs.query,
				page: userArgs.page,
				limit: userArgs.limit,
				sortBy: userArgs.sortBy,
				sortOrder: userArgs.sortOrder,
				role: userArgs.role,
			}),
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});

	const value: DashboardDataContextType = {
		paymentsQuery,
		summaryStatsQuery,
		rolesQuery,
		permissionsQuery,
		usersQuery,
		refetchUsers: usersQuery.refetch,
		refetchPayments: paymentsQuery.refetch,
		refetchStats: summaryStatsQuery.refetch,
		setPaymentParams,
		setUserParams,
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
