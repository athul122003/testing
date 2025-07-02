"use client";

import { useEffect, useState } from "react";
import { getPaymentInfo } from "~/lib/actions/payment-info";
import { formatDateTime } from "~/lib/formatDateTime";
import { formatCurrency } from "~/lib/formatCurrency";
import {
	AlertCircle,
	IndianRupee,
	Download,
	Filter,
	Search,
	TrendingUp,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

type PaymentWithUser = Awaited<ReturnType<typeof getPaymentInfo>>[number];

type PaymentStatus = "success" | "failed" | "pending";

export function PaymentsPage() {
	const [payments, setPayments] = useState<PaymentWithUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const filteredPayments = payments.filter((payment) => {
		const lowerSearch = searchTerm.toLowerCase();
		const matchesSearch =
			payment.User?.name.toLowerCase().includes(lowerSearch) ||
			payment.User?.id?.toString().includes(lowerSearch) ||
			payment.User?.email.includes(lowerSearch) ||
			payment.id.toLowerCase().includes(lowerSearch) ||
			payment.paymentType?.toLowerCase().includes(lowerSearch);
		const matchesStatus =
			statusFilter === "all" || getPaymentStatus(payment) === statusFilter;
		return matchesSearch && matchesStatus;
	});

	useEffect(() => {
		const fetchPayments = async () => {
			try {
				const data = await getPaymentInfo();
				setPayments(data);
			} catch (err) {
				console.error("Failed to fetch payments:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchPayments();
	}, []);

	function getPaymentStatus(payment: PaymentWithUser): PaymentStatus {
		if (
			payment.razorpayPaymentId &&
			payment.razorpaySignature &&
			payment.amount
		) {
			return "success";
		}
		return "failed";
	}

	const successfulPayments = payments.filter(
		(p) => getPaymentStatus(p) === "success",
	).length;

	const failedPayments = payments.filter(
		(p) => getPaymentStatus(p) === "failed",
	).length;

	const totalUsers = payments.filter((p) => p.User).length;
	const totalPayments = payments.length;

	const totalRevenue = payments
		.filter((p) => getPaymentStatus(p) === "success")
		.reduce((sum, p) => sum + p.amount, 0);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "success":
				return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
			case "failed":
				return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
			default:
				return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "success":
				return <TrendingUp className="h-3 w-3" />;
			case "failed":
				return <AlertCircle className="h-3 w-3" />;
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<div className="text-center py-10 text-slate-500">
				Loading payments...
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
						Payments
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Track and manage payment transactions
					</p>
				</div>
				<Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
					<Download className="h-4 w-4 mr-2" />
					Export Data
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Total Revenue
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
								<IndianRupee className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-900 dark:text-white">
							{formatCurrency(totalRevenue)}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							Based on latest records
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Successful
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
								<TrendingUp className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{successfulPayments}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							Completed payments
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Failed
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
								<AlertCircle className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{failedPayments}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							Failed transactions
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Platform Summary
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
								<TrendingUp className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									Users
								</span>
								<span className="text-lg font-semibold text-indigo-600">
									{totalUsers}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									Payments
								</span>
								<span className="text-lg font-semibold text-purple-600">
									{totalPayments}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="shadow-lg bg-white dark:bg-slate-800">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="text-xl text-slate-900 dark:text-white">
							Payment History
						</CardTitle>
						<div className="flex gap-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Search payments..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 w-64"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="success">Success</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Order Id</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Date & Time</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredPayments.map((payment) => {
								const { date, time } = formatDateTime(
									new Date(payment.createdAt),
								);
								const paymentStatus = getPaymentStatus(payment);

								return (
									<TableRow
										key={payment.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
									>
										<TableCell className="font-medium">
											<div className="max-w-[180px] overflow-x-auto whitespace-nowrap">
												{payment.razorpayOrderId}
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium text-slate-900 dark:text-white">
													{payment.User?.name}
												</div>
												<div className="text-sm text-slate-500 dark:text-slate-400">
													{payment.User?.email}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium">{date}</div>
												<div className="text-sm text-slate-500 dark:text-slate-400">
													{time}
												</div>
											</div>
										</TableCell>
										<TableCell>{payment.paymentType}</TableCell>
										<TableCell className="font-bold">
											{payment.amount > 0
												? formatCurrency(payment.amount)
												: "-"}
										</TableCell>
										<TableCell>
											<Badge
												className={`${getStatusColor(
													paymentStatus,
												)} flex items-center gap-1 w-fit`}
											>
												{getStatusIcon(paymentStatus)}
												{paymentStatus}
											</Badge>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
