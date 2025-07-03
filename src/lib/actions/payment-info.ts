"use server";

import prisma from "~/lib/prisma";

const getPaymentInfo = async ({
	page = 1,
	pageSize = 20,
}: {
	page?: number;
	pageSize?: number;
}) => {
	const skip = (page - 1) * pageSize;
	try {
		const [payments, totalPayments] = await Promise.all([
			prisma.payment.findMany({
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
				},
			}),
			prisma.payment.count(),
		]);
		const totalPages = Math.ceil(totalPayments / pageSize);
		return { page, pageSize, totalPages, payments };
	} catch (error) {
		console.error("Failed to fetch payment info:", error);
		throw new Error("Unable to fetch payment information.");
	}
};

const getSummaryStats = async () => {
	try {
		const [
			totalPayments,
			totalUsers,
			revenueAggregate,
			totalSuccessfulPayments,
		] = await Promise.all([
			prisma.payment.count(),
			prisma.user.count(),
			prisma.payment.aggregate({ _sum: { amount: true } }),
			prisma.payment.count({
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
};

export { getPaymentInfo, getSummaryStats };
