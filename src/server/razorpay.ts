import Razorpay from "razorpay";

export const razorPay = new Razorpay({
	key_id: process.env.RAZORPAY_API_KEY_ID,
	key_secret: process.env.RAZORPAY_SECRET,
});
