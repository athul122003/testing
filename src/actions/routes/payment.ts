"use server";
import { z } from "zod";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import { razorPay } from "~/server/razorpay";
import { PaymentType } from "@prisma/client";

const createOrderSchema = z.discriminatedUnion("paymentType", [
	z.object({
		paymentType: z.literal(PaymentType.EVENT),
		amountInINR: z.number(),
		teamId: z.string(),
		sessionUserId: z.number(),
	}),
	z.object({
		paymentType: z.literal(PaymentType.MEMBERSHIP),
		sessionUserId: z.number(),
	}),
]);

const verifyAndSavePaymentSchema = z.discriminatedUnion("paymentType", [
	z.object({
		paymentType: z.literal(PaymentType.EVENT),
		paymentName: z.string(),
		razorpayOrderId: z.string(),
		razorpayPaymentId: z.string(),
		razorpaySignature: z.string(),
		amount: z.number(),
		teamId: z.string(),
		sessionUserId: z.number(),
	}),
	z.object({
		paymentType: z.literal(PaymentType.MEMBERSHIP),
		paymentName: z.string(),
		razorpayOrderId: z.string(),
		razorpayPaymentId: z.string(),
		razorpaySignature: z.string(),
		sessionUserId: z.number(),
	}),
]);

type CreateOrderInput = z.infer<typeof createOrderSchema>;

type VerifyAndSavePaymentInput = z.infer<typeof verifyAndSavePaymentSchema>;

export async function createOrder(input: CreateOrderInput) {
	if (input.paymentType === "MEMBERSHIP") {
		const user = await db.user.findUnique({
			where: {
				id: input.sessionUserId,
			},
		});

		if (!user) {
			throw new Error("User not found", { cause: "NOT_FOUND" });
		}

		if (user.paymentId) {
			throw new Error("Already paid for membership", { cause: "BAD_REQUEST" });
		}
	} else {
		const team = await db.team.findUnique({
			where: {
				id: input.teamId,
			},
		});

		if (!team) {
			throw new Error("Team not found", { cause: "NOT_FOUND" });
		}

		if (team.paymentId) {
			// TODO [RAHUL] Confirm if there are unique teams being created and cannot use same team again
			throw new Error("Team has already paid for event", {
				cause: "BAD_REQUEST",
			});
		}
	}

	const AMOUNT_IN_INR = input.paymentType === "EVENT" ? input.amountInINR : 409; // TODO [RAHUL] JUST HARDCODED PRVS YEAR VALUE, so have to check it again later
	const CURRENCY = "INR";
	const RECEIPT = input.paymentType.charAt(0) + "_" + uuidv4();
	const PAYMENT_CAPTURE = true;

	try {
		const orderRes = await razorPay.orders.create({
			amount: AMOUNT_IN_INR * 100,
			currency: CURRENCY,
			receipt: RECEIPT,
			payment_capture: PAYMENT_CAPTURE,
		});

		return {
			orderId: orderRes.id,
			orderAmount: AMOUNT_IN_INR, // TODO [RAHUL] Can be chaned to orderRes.amount but its fine, will test
			orderCurrency: orderRes.currency,
		};
	} catch {
		throw new Error("Failed to create order", {
			cause: "INTERNAL_SERVER_ERROR",
		});
	}
}

export async function savePayment(input: VerifyAndSavePaymentInput) {
	const typeOfPayment =
		input.paymentType === "EVENT"
			? {
					amount: input.amount,
					Team: {
						connect: {
							id: input.teamId,
						},
					},
				}
			: {
					amount: 409, // TODO [RAHUL] Just hardcoded previous year value, so have to check it again later
					User: {
						connect: {
							id: input.sessionUserId,
						},
					},
				};
	console.log(input);
	console.log(input.sessionUserId);
	const payment = await db.payment.create({
		data: {
			paymentType: input.paymentType,
			paymentName: input.paymentName,
			razorpayOrderId: input.razorpayOrderId,
			razorpayPaymentId: input.razorpayPaymentId,
			razorpaySignature: input.razorpaySignature,
			...typeOfPayment,
			User: {
				connect: {
					id: input.sessionUserId,
				},
			},
		},
	});

	return {
		paymentDbId: payment.id,
		paymentRazorpayId: payment.razorpayPaymentId,
	};
}
