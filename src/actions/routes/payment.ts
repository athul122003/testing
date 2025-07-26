"use server";
import { z } from "zod";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import { razorPay } from "~/server/razorpay";
import { PaymentType } from "@prisma/client";
import { confirmTeam } from "./events";

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
	try {
		let amount = 0;
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
				throw new Error("Already paid for membership", {
					cause: "BAD_REQUEST",
				});
			}
		} else {
			amount = 0;
			const team = await db.team.findUnique({
				where: {
					id: input.teamId,
				},
				include: {
					Leader: true,
					Event: true,
					Members: true,
				},
			});

			if (!team) {
				throw new Error("Team not found", { cause: "NOT_FOUND" });
			}
			const members = team.Members;
			if (members.length === 0) {
				throw new Error("Team has no members", { cause: "BAD_REQUEST" });
			}
			if (team.leaderId !== input.sessionUserId) {
				throw new Error("Only team leader can create order", {
					cause: "FORBIDDEN",
				});
			}
			if (
				members.length < team.Event.minTeamSize ||
				members.length > team.Event.maxTeamSize
			) {
				throw new Error(
					`Team size must be between ${team.Event.minTeamSize} and ${team.Event.maxTeamSize}`,
					{ cause: "BAD_REQUEST" },
				);
			}
			if (team.Event.deadline && new Date(team.Event.deadline) < new Date()) {
				throw new Error("Event registration deadline has passed", {
					cause: "BAD_REQUEST",
				});
			}
			if (team.Event.state !== "PUBLISHED") {
				throw new Error("Event Registration is not open, contact support", {
					cause: "BAD_REQUEST",
				});
			}
			const totalTeams = await db.team.count({
				where: {
					Event: { id: team.Event.id },
				},
			});
			if (totalTeams >= team.Event.maxTeams) {
				throw new Error("Maximum number of teams reached for this event", {
					cause: "BAD_REQUEST",
				});
			}
			if (team.paymentId) {
				// TODO [RAHUL] Confirm if there are unique teams being created and cannot use same team again
				throw new Error("Team has already paid for event", {
					cause: "BAD_REQUEST",
				});
			}
			if (input.sessionUserId !== team.leaderId) {
				throw new Error("Only team leader can create order", {
					cause: "FORBIDDEN",
				});
			}
			const event = team.Event;

			if (!event) {
				throw new Error("Event not found", { cause: "NOT_FOUND" });
			}

			const userRole = await db.role.findUnique({
				where: { name: "USER" },
				select: { id: true },
			});
			if (!userRole) {
				throw new Error("Member role not found", { cause: "NOT_FOUND" });
			}
			team.Members.forEach((m) => {
				if (m.roleId === userRole.id) {
					amount += event.nonFlcAmount;
				} else {
					amount += event.flcAmount;
				}
			});
			if (amount === 0) {
				return {
					success: false,
					error: "No amount to pay for the team",
				};
			}
		}

		const AMOUNT_IN_INR = input.paymentType === "EVENT" ? amount : 409; // TODO [RAHUL] JUST HARDCODED PRVS YEAR VALUE, so have to check it again later
		const CURRENCY = "INR";
		const RECEIPT = input.paymentType.charAt(0) + "_" + uuidv4();
		const PAYMENT_CAPTURE = true;

		const orderRes = await razorPay.orders.create({
			amount: AMOUNT_IN_INR * 100,
			currency: CURRENCY,
			receipt: RECEIPT,
			payment_capture: PAYMENT_CAPTURE,
		});

		return {
			success: true,
			orderId: orderRes.id,
			orderAmount: AMOUNT_IN_INR, // TODO [RAHUL] Can be chaned to orderRes.amount but its fine, will test
			orderCurrency: orderRes.currency,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		};
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
		},
	});

	if (input.paymentType === "MEMBERSHIP") {
		const memberRole = await db.role.findUnique({
			where: { name: "MEMBER" },
			select: { id: true },
		});
		if (!memberRole) {
			throw new Error("Member role not found", { cause: "NOT_FOUND" });
		}
		await db.user.update({
			where: { id: input.sessionUserId },
			data: {
				roleId: memberRole?.id,
				memberSince: new Date(),
			},
		});
	} else {
		await confirmTeam(input.sessionUserId, input.teamId);
	}

	return {
		paymentDbId: payment.id,
		paymentRazorpayId: payment.razorpayPaymentId,
	};
}

export async function webhookCapture(
	paymentId: string,
	paymentSignature: string,
	orderId: string,
	amount: number,
	paymentType: string,
	paymentName: string,
	sessionUserId: number,
	teamId?: string,
) {
	const typeOfPayment =
		paymentType === PaymentType.EVENT
			? {
					amount: amount,
					Team: {
						connect: {
							id: teamId,
						},
					},
				}
			: {
					amount: amount,
					User: {
						connect: {
							id: sessionUserId,
						},
					},
				};

	const payment = await db.payment.findFirst({
		where: {
			razorpayPaymentId: paymentId,
		},
	});

	if (payment) {
		console.log("Payment already exists, skipping capture");
		return;
	}

	await db.payment.create({
		data: {
			paymentType: paymentType as PaymentType,
			paymentName: paymentName,
			razorpayOrderId: orderId,
			razorpayPaymentId: paymentId,
			razorpaySignature: "webhook_capture", // Placeholder, not used in this context
			...typeOfPayment,
		},
	});

	if (paymentType === PaymentType.MEMBERSHIP) {
		const memberRole = await db.role.findUnique({
			where: { name: "MEMBER" },
			select: { id: true },
		});
		if (!memberRole) {
			throw new Error("Member role not found", { cause: "NOT_FOUND" });
		}
		await db.user.update({
			where: { id: sessionUserId },
			data: {
				roleId: memberRole?.id,
				memberSince: new Date(),
			},
		});
	} else if (paymentType === PaymentType.EVENT && teamId) {
		await confirmTeam(sessionUserId, teamId);
	}

	console.log("Payment captured successfully");
}
