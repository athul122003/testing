"use server";

import prisma from "~/lib/prisma";

const getPaymentInfo = async () => {
	try {
		const payments = await prisma.payment.findMany({
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
		});

		return payments;
	} catch (error) {
		console.error("Failed to fetch payment info:", error);
		throw new Error("Unable to fetch payment information.");
	}
};
export { getPaymentInfo };
