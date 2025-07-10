"use client";

import type { Permission, Role } from "@prisma/client";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react"; // NEW2.0: Used to extract user permissions & role

import { getPaymentInfo, getSummaryStats } from "~/actions/payment-info";
import type {
	PaymentWithUser,
	SummaryStats,
} from "~/actions/tanstackHooks/payment-queries";
import { api } from "~/lib/api";

// 🔧 Updated type to make optional properties conditionally available
type DashboardDataContextType = {
	paymentsQuery: UseQueryResult<PaymentWithUser>;
	summaryStatsQuery: UseQueryResult<SummaryStats>;
	rolesQuery?: UseQueryResult<Role[]>; // ⬅️ optional now based on permission
	permissionsQuery?: UseQueryResult<Permission[]>; // ⬅️ optional now based on permission
	usersQuery?: UseQueryResult<{
		data: Array<{
			id: number;
			name: string;
			usn: string;
			memberSince: Date | null;
			email: string;
			role: {
				id: number | string;
				name: string;
			};
		}>;
		total: number;
		page: number;
		totalPages: number;
	}>; // ⬅️ optional now based on permission

	refetchPayments: () => void;
	refetchStats: () => void;
	refetchUsers?: () => void; // ⬅️ optional now based on permission
	refetchRoles?: () => void; //  NEW
	refetchPermissions?: () => void; //  NEW

	setPaymentParams: (
		page: number,
		pageSize: number,
		dateFilter?: { startDate?: Date; endDate?: Date },
	) => void;

	setUserParams?: (
		query: string,
		page: number,
		limit: number,
		sortBy: string,
		sortOrder: "asc" | "desc",
		role?: string,
	) => void; // ⬅️ optional now based on permission

	permissions: string[]; // NEW2.0: Exposed current user permissions globally
	role: string | undefined; // NEW2.0: Exposed current user role globally
	user:
		| {
				id: string;
				name: string;
				email: string;
		  }
		| undefined;

	hasPerm: (...perms: string[]) => boolean; // NEW2.0: Centralized permission check utility
};

const DashboardDataContext = createContext<DashboardDataContextType | null>(
	null,
);

export const DashboardDataProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const { data: session } = useSession(); // NEW2.0: Getting session for permissions
	const permissions: string[] = session?.user?.permissions ?? []; // NEW2.0
	const role: string | undefined = session?.user?.role?.name; // NEW2.0
	const user =
		session?.user?.id && session.user.name && session.user.email
			? {
					id: String(session.user.id),
					name: session.user.name,
					email: session.user.email,
				}
			: undefined;

	const hasPerm = (...perms: string[]) =>
		perms.some((perm) => permissions.includes(perm)); // NEW2.0

	const canManageUsers = hasPerm("MANAGE_USER_ROLES");
	const canManageRoles = hasPerm(
		"MANAGE_USER_ROLES",
		"MANAGE_ROLE_PERMISSIONS",
	);
	const canManagePermissions = hasPerm("MANAGE_ROLE_PERMISSIONS");

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
		enabled: canManageRoles,
	});

	const permissionsQuery = useQuery({
		queryKey: ["getPermissions"],
		queryFn: api.permission.getAll,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
		enabled: canManagePermissions,
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
		enabled: canManageUsers,
	});

	const value: DashboardDataContextType = {
		paymentsQuery,
		summaryStatsQuery,
		rolesQuery: canManageRoles ? rolesQuery : undefined,
		permissionsQuery: canManagePermissions ? permissionsQuery : undefined,
		usersQuery: canManageUsers ? usersQuery : undefined,
		refetchPayments: paymentsQuery.refetch,
		refetchStats: summaryStatsQuery.refetch,
		refetchUsers: canManageUsers ? usersQuery.refetch : undefined,
		refetchRoles: canManageRoles ? rolesQuery.refetch : undefined,
		setPaymentParams,
		setUserParams: canManageUsers ? setUserParams : undefined,

		// === NEW2.0: Added Global Access to Permission-based Features ===
		permissions,
		role,
		user,
		hasPerm,
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
