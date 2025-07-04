"use client";

import {
	AlertCircle,
	Calendar,
	Download,
	Filter,
	IndianRupee,
	Search,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { getPaymentInfo, getSummaryStats } from "~/lib/actions/payment-info";
import { convertPaymentsToCSV, downloadCSV } from "~/lib/exportPaymentData";
import { formatCurrency } from "~/lib/formatCurrency";
import { formatDateTime } from "~/lib/formatDateTime";
import { createPersistentLRUCache } from "~/lib/lru-cache";
//types
import type {
	PaymentWithUser,
	SummaryStats,
} from "~/lib/queries/payment-queries";
import { usePayments, useSummaryStats } from "~/lib/queries/payment-queries";

type PaymentStatus = "success" | "failed" | "pending";

type DateFilter = {
	startDate?: Date;
	endDate?: Date;
};

// const paymentsCache = createPersistentLRUCache<string, any>(
//   "payments",
//   30_000,
//   5
// );

export function PaymentsPage() {
	// const [payments, setPayments] = useState<PaymentWithUser[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [dateFilter, setDateFilter] = useState<DateFilter>({
		startDate: undefined,
		endDate: undefined,
	});
	//to fetch paginated payments data
	// useEffect(() => {
	// 	const cached = paymentsCache.get(paymentsKey);
	// 	console.log("Cache hit for key:", paymentsKey, "Cached data:", cached);
	// 	if (cached) {
	// 		setPayments(cached);
	// 		setTotalPages(cached.totalPages);
	// 		setLoading(false);
	// 		return;
	// 	}

	// 	console.log("Fetching payments for page:", page, "size:", pageSize);

	// 	const fetchPayments = async () => {
	// 		try {
	// 			const data = await getPaymentInfo({ page, pageSize, ...dateFilter });
	// 			paymentsCache.set(paymentsKey, data.payments);

	// 			setPayments(data.payments);
	// 			setTotalPages(data.totalPages);
	// 		} catch (err) {
	// 			console.error("Failed to fetch payments:", err);
	// 		} finally {
	// 			setLoading(false);
	// 		}
	// 	};

	// 	fetchPayments();
	// }, [page, dateFilter, paymentsKey]);
	const pageSize = 20;
	const { data: paymentsData, isLoading } = usePayments({
		page,
		pageSize,
		dateFilter,
	});

	//fetch payments data
	const payments: PaymentWithUser["payments"] = paymentsData?.payments ?? [];
	const totalPages: PaymentWithUser["totalPages"] =
		paymentsData?.totalPages ?? 1;

	//fetch summary stats
	const { data: summaryStatsData } = useSummaryStats();
	const summaryStats: SummaryStats = summaryStatsData ?? {
		totalPayments: 0,
		totalUsers: 0,
		totalRevenue: 0,
		totalSuccessfulPayments: 0,
		totalFailedPayments: 0,
	};

	// //to fetch summary stats  only once on mount
	// useEffect(() => {
	// 	const cached = paymentsCache.get(paymentsSummaryKey);
	// 	console.log(
	// 		"Cache hit for summary stats key:",
	// 		paymentsSummaryKey,
	// 		"Cached data:",
	// 		cached,
	// 	);
	// 	if (cached) {
	// 		setSummaryStats(cached);
	// 		return;
	// 	}

	// 	const fetchSummaryStats = async () => {
	// 		try {
	// 			const data = await getSummaryStats();
	// 			paymentsCache.set(paymentsSummaryKey, data);
	// 			setSummaryStats(data);
	// 		} catch (error) {
	// 			console.error("Error fetching summary stats:", error);
	// 		}
	// 	};
	// 	fetchSummaryStats();
	// }, []);

	//filtered Payments
	const filteredPayments: PaymentWithUser["payments"] = payments.filter(
		(payment) => {
			const lowerSearch = searchTerm.toLowerCase();
			const matchesSearch =
				payment.User?.name.toLowerCase().includes(lowerSearch) ||
				payment.User?.id?.toString().includes(lowerSearch) ||
				payment.User?.email.includes(lowerSearch) ||
				payment.id.toLowerCase().includes(lowerSearch) ||
				payment.paymentType?.toLowerCase().includes(lowerSearch);
			const matchesStatus =
				statusFilter === "all" || getPaymentStatus(payment) === statusFilter;

			const createdAt = new Date(payment.createdAt);
			const matchesDateRange =
				(!dateFilter.startDate || createdAt >= dateFilter.startDate) &&
				(!dateFilter.endDate || createdAt <= dateFilter.endDate);
			return matchesSearch && matchesStatus && matchesDateRange;
		},
	);

	function getPaymentStatus(
		payment: PaymentWithUser["payments"][number],
	): PaymentStatus {
		if (
			payment.razorpayPaymentId &&
			payment.razorpaySignature &&
			payment.amount
		) {
			return "success";
		}
		return "failed";
	}

	const currentSuccessfulPayments = filteredPayments.filter(
		(p) => getPaymentStatus(p) === "success",
	).length;

	const currentFailedPayments = filteredPayments.filter(
		(p) => getPaymentStatus(p) === "failed",
	).length;

	const currentRevenue = filteredPayments
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

	const handleExportFilteredPayments = () => {
		const csvData = convertPaymentsToCSV(filteredPayments);
		if (!csvData) {
			console.error("No data to export");
			return;
		}
		downloadCSV(csvData, "filtered_payments.csv");
	};

	const handleExportAllPayments = async () => {
		try {
			const data = await getPaymentInfo({
				page: 1,
				pageSize: 10000,
			});
			const csvData = convertPaymentsToCSV(data.payments);
			if (!csvData) {
				console.error("No data to export");
				return;
			}
			downloadCSV(csvData, "all_payments.csv");
		} catch (error) {
			console.error("Error exporting all payments:", error);
		}
	};

	if (isLoading) {
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

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
							<Download className="h-4 w-4 mr-2" />
							Export Data
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem onClick={handleExportFilteredPayments}>
							Export Current View
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleExportAllPayments}>
							Export All Records
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Revenue Summary
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
								<IndianRupee className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
							{formatCurrency(summaryStats.totalRevenue)}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							Across all records
						</div>
						<div className="mt-2 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
							{formatCurrency(currentRevenue)}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							In current view
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Successful Transactions
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
								<TrendingUp className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{summaryStats.totalSuccessfulPayments}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							Across all records
						</div>
						<div className="mt-2 text-lg font-semibold text-green-700 dark:text-green-400">
							{currentSuccessfulPayments}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							In current view
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								Failed Transactions
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
								<AlertCircle className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{summaryStats.totalFailedPayments}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							Across all records
						</div>
						<div className="mt-2 text-lg font-semibold text-red-700 dark:text-red-400">
							{currentFailedPayments}
						</div>
						<div className="text-sm text-slate-500 dark:text-slate-400">
							In current view
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-slate-600 dark:text-slate-400">
								User & Payment Metrics
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
								<TrendingUp className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
								{summaryStats.totalUsers}
							</div>
							<div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
								Total Users
							</div>
						</div>

						<div>
							<div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
								{summaryStats.totalPayments}
							</div>
							<div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
								Total Payments
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
							<Input
								type="date"
								value={
									dateFilter.startDate
										? dateFilter.startDate.toISOString().split("T")[0]
										: ""
								}
								onChange={(e) =>
									setDateFilter((prev) => ({
										...prev,
										startDate: e.target.value
											? new Date(e.target.value)
											: undefined,
									}))
								}
								className="w-[150px] [color-scheme:dark]  text-slate-400
             [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 
             [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
							/>
							<Input
								type="date"
								value={
									dateFilter.endDate
										? dateFilter.endDate.toISOString().split("T")[0]
										: ""
								}
								onChange={(e) =>
									setDateFilter((prev) => ({
										...prev,
										endDate: e.target.value
											? new Date(e.target.value)
											: undefined,
									}))
								}
								className="w-[150px] [color-scheme:dark]  text-slate-400
             [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 
             [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
							/>
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

					<div className="flex justify-between items-center mt-6">
						<Button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							⬅ Prev
						</Button>
						<span className="text-sm text-slate-600 dark:text-slate-400">
							Page {page} of {totalPages}
						</span>
						<Button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
						>
							Next ➡
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
