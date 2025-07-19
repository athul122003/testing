"use client";

import type {
	EventCategory,
	EventState,
	EventType,
	Permission,
	Role,
} from "@prisma/client";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { getAllEvents } from "~/actions/event";
import { getPaymentInfo, getSummaryStats } from "~/actions/payment-info";
import type {
	PaymentWithUser,
	SummaryStats,
} from "~/actions/tanstackHooks/payment-queries";
import { api } from "~/lib/api";
import type { EventsQuery } from "~/actions/event";

type DashboardDataContextType = {
	paymentsQuery: UseQueryResult<PaymentWithUser>;
	summaryStatsQuery: UseQueryResult<SummaryStats>;
	rolesQuery?: UseQueryResult<Role[]>;
	eventsQuery: UseQueryResult<EventsQuery>;
	permissionsQuery?: UseQueryResult<Permission[]>;
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
	}>;

	refetchPayments: () => void;
	refetchStats: () => void;
	refetchUsers?: () => void;
	refetchRoles?: () => void;
	refetchEvents?: () => void;
	refetchPermissions?: () => void;

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
	) => void;

	permissions: string[];
	role: string | undefined;
	user:
		| {
				id: string;
				name: string;
				email: string;
		  }
		| undefined;

	hasPerm: (...perms: string[]) => boolean;
};

const DashboardDataContext = createContext<DashboardDataContextType | null>(
	null,
);

export const DashboardDataProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const { data: session } = useSession();
	const permissions: string[] = session?.user?.permissions ?? [];
	const role: string | undefined = session?.user?.role?.name;
	const user =
		session?.user?.id && session.user.name && session.user.email
			? {
					id: String(session.user.id),
					name: session.user.name,
					email: session.user.email,
				}
			: undefined;

	const hasPerm = (...perms: string[]) =>
		perms.some((perm) => permissions.includes(perm));

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

	const eventsQuery = useQuery<EventsQuery>({
		queryKey: ["events"],
		queryFn: getAllEvents,
		refetchOnWindowFocus: false,
		staleTime: 30_000,
	});

	const value: DashboardDataContextType = {
		paymentsQuery,
		summaryStatsQuery,
		eventsQuery: eventsQuery,
		rolesQuery: canManageRoles ? rolesQuery : undefined,
		permissionsQuery: canManagePermissions ? permissionsQuery : undefined,
		usersQuery: canManageUsers ? usersQuery : undefined,
		refetchPayments: paymentsQuery.refetch,
		refetchEvents: eventsQuery.refetch,
		refetchStats: summaryStatsQuery.refetch,
		refetchUsers: canManageUsers ? usersQuery.refetch : undefined,
		refetchRoles: canManageRoles ? rolesQuery.refetch : undefined,
		setPaymentParams,
		setUserParams: canManageUsers ? setUserParams : undefined,
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
