import { PaymentWithUser } from "~/components/pages/payments-page";
import { formatDateTime } from "~/lib/formatDateTime";

// Utility to convert payments to CSV
export function convertPaymentsToCSV(data: PaymentWithUser[]) {
	const headers = [
		"Order ID",
		"User Name",
		"Email",
		"Date",
		"Time",
		"Method",
		"Amount",
		"Status",
	];

	const rows = data.map((p) => {
		const { date, time } = formatDateTime(new Date(p.createdAt));
		const status =
			p.razorpayPaymentId && p.razorpaySignature && p.amount
				? "success"
				: "failed";
		return [
			p.razorpayOrderId,
			p.User?.name ?? "N/A",
			p.User?.email ?? "N/A",
			date,
			time,
			p.paymentType ?? "N/A",
			p.amount ?? 0,
			status,
		];
	});

	const csvContent = [
		headers.join(","),
		...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
	].join("\n");

	return csvContent;
}

//download csv
export function downloadCSV(csv: string, filename = "payments_export.csv") {
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
