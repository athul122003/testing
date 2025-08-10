"use server";

import type { Payment } from "@prisma/client";
import { db } from "~/server/db";
import { protectedAction } from "./middleware/protectedAction";

export type PaymentQueryResponse = {
	page: number;
	pageSize: number;
	totalPages: number;
	payments: Payment[];
};

type SearchPaymentsInput = {
	searchTerm: string;
	page: number;
	pageSize: number;
	startDate?: Date;
	endDate?: Date;
};

type DateFilterInput = {
	startDate?: Date;
	endDate?: Date;
	page: number;
	pageSize: number;
};

const getPaymentInfo = protectedAction(
	async ({
		page = 1,
		pageSize = 20,
		startDate,
		endDate,
	}: {
		page?: number;
		pageSize?: number;
		startDate?: Date;
		endDate?: Date;
	}) => {
		const skip = (page - 1) * pageSize;

		const dateFilter: { gte?: Date; lte?: Date } = {};
		if (startDate) {
			dateFilter.gte = startDate;
		}
		if (endDate) {
			dateFilter.lte = endDate;
		}

		const whereCondition = Object.keys(dateFilter).length
			? { createdAt: dateFilter }
			: {};

		try {
			const [payments, totalPayments] = await Promise.all([
				db.payment.findMany({
					where: whereCondition,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						User: {
							select: {
								name: true,
								id: true,
								email: true,
							},
						},
						Team: {
							select: {
								Leader: {
									select: {
										name: true,
										id: true,
										email: true,
									},
								},
							},
						},
					},
				}),
				db.payment.count({
					where: whereCondition,
				}),
			]);

			// If User is empty, use Leader instead
			const paymentsWithUserOrLeader = payments.map((payment) => {
				if (!payment.User && payment.Team?.Leader) {
					return { ...payment, User: payment.Team.Leader };
				} else {
					return { ...payment, User: payment.User };
				}
			});
			const totalPages = Math.ceil(totalPayments / pageSize);
			return { page, pageSize, totalPages, payments: paymentsWithUserOrLeader };
		} catch (error) {
			console.error("Failed to fetch payment info:", error);
			throw new Error("Unable to fetch payment information.");
		}
	},
	{
		actionName: "payment.ALLPERM",
	},
);

const getSummaryStats = protectedAction(
	async () => {
		try {
			const [
				totalPayments,
				totalUsers,
				revenueAggregate,
				totalSuccessfulPayments,
			] = await Promise.all([
				db.payment.count(),
				db.user.count(),
				db.payment.aggregate({ _sum: { amount: true } }),
				db.payment.count({
					where: {
						AND: [
							{ razorpayPaymentId: { not: "" } },
							{ razorpaySignature: { not: "" } },
							{ amount: { gt: 0 } },
						],
					},
				}),
			]);
			const totalRevenue = revenueAggregate._sum.amount ?? 0;
			const totalFailedPayments = totalPayments - totalSuccessfulPayments;
			return {
				totalPayments,
				totalUsers,
				totalRevenue,
				totalSuccessfulPayments,
				totalFailedPayments,
			};
		} catch (error) {
			console.error("Error fetching summary stats:", error);
			throw error;
		}
	},
	{
		actionName: "payment.ALLPERM",
	},
);

const searchPayments = protectedAction(
	async ({
		searchTerm,
		page = 1,
		pageSize = 20,
		startDate,
		endDate,
	}: SearchPaymentsInput) => {
		if (!searchTerm || searchTerm.length < 2) {
			throw new Error("Search term must be at least 2 characters");
		}

		const skip = (page - 1) * pageSize;
		const searchTermLower = searchTerm.toLowerCase();

		const dateFilter: { gte?: Date; lte?: Date } = {};
		if (startDate) {
			dateFilter.gte = startDate;
		}
		if (endDate) {
			dateFilter.lte = endDate;
		}

		try {
			const matchingUsers = await db.user.findMany({
				where: {
					OR: [
						{ name: { contains: searchTermLower, mode: "insensitive" } },
						{ email: { contains: searchTermLower, mode: "insensitive" } },
					],
				},
				select: { id: true },
			});

			const whereCondition: {
				OR: Array<Record<string, unknown>>;
				createdAt?: { gte?: Date; lte?: Date };
			} = {
				OR: [
					{
						razorpayOrderId: { contains: searchTermLower, mode: "insensitive" },
					},
					{
						razorpayPaymentId: {
							contains: searchTermLower,
							mode: "insensitive",
						},
					},
					{
						User: {
							OR: [
								{ name: { contains: searchTermLower, mode: "insensitive" } },
								{ id: { in: matchingUsers.map((user) => user.id) } },
							],
						},
					},
				],
			};

			if (Object.keys(dateFilter).length > 0) {
				whereCondition.createdAt = dateFilter;
			}

			const [payments, totalCount] = await Promise.all([
				db.payment.findMany({
					where: whereCondition,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						User: {
							select: {
								name: true,
								id: true,
								email: true,
							},
						},
						Team: {
							select: {
								Leader: {
									select: {
										name: true,
										id: true,
										email: true,
									},
								},
							},
						},
					},
				}),
				db.payment.count({
					where: whereCondition,
				}),
			]);

			const paymentsWithUserOrLeader = payments.map((payment) => {
				if (!payment.User && payment.Team?.Leader) {
					return { ...payment, User: payment.Team.Leader };
				} else {
					return { ...payment, User: payment.User };
				}
			});

			const totalPages = Math.ceil(totalCount / pageSize);
			return {
				page,
				pageSize,
				totalPages,
				payments: paymentsWithUserOrLeader,
				totalCount,
			};
		} catch (error) {
			console.error("Error searching payments:", error);
			throw new Error("Failed to search payments");
		}
	},
	{
		actionName: "payment.ALLPERM",
	},
);

const filterPaymentsByDate = protectedAction(
	async ({ startDate, endDate, page = 1, pageSize = 20 }: DateFilterInput) => {
		if (!startDate && !endDate) {
			throw new Error("At least one date must be provided");
		}

		const skip = (page - 1) * pageSize;

		const dateFilter: { gte?: Date; lte?: Date } = {};
		if (startDate) {
			dateFilter.gte = startDate;
		}
		if (endDate) {
			const endOfDay = new Date(endDate);
			endOfDay.setHours(23, 59, 59, 999);
			dateFilter.lte = endOfDay;
		}

		try {
			const [payments, totalCount] = await Promise.all([
				db.payment.findMany({
					where: {
						createdAt: dateFilter,
					},
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						User: {
							select: {
								name: true,
								id: true,
								email: true,
							},
						},
						Team: {
							select: {
								Leader: {
									select: {
										name: true,
										id: true,
										email: true,
									},
								},
							},
						},
					},
				}),
				db.payment.count({
					where: {
						createdAt: dateFilter,
					},
				}),
			]);

			const paymentsWithUserOrLeader = payments.map((payment) => {
				if (!payment.User && payment.Team?.Leader) {
					return { ...payment, User: payment.Team.Leader };
				} else {
					return { ...payment, User: payment.User };
				}
			});

			const totalPages = Math.ceil(totalCount / pageSize);
			return {
				page,
				pageSize,
				totalPages,
				payments: paymentsWithUserOrLeader,
				totalCount,
				dateFilter: { startDate, endDate },
			};
		} catch (error) {
			console.error("Error filtering payments by date:", error);
			throw new Error("Failed to filter payments by date");
		}
	},
	{
		actionName: "payment.ALLPERM",
	},
);

export {
	getPaymentInfo,
	getSummaryStats,
	searchPayments,
	filterPaymentsByDate,
};
