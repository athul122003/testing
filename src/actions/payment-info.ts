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

export { getPaymentInfo, getSummaryStats };
