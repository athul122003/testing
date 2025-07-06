"use client";

import {
	AlertCircle,
	Download,
	Filter,
	IndianRupee,
	Search,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { getPaymentInfo } from "~/actions/payment-info";
//types
import type {
	PaymentWithUser,
	SummaryStats,
} from "~/actions/tanstackHooks/payment-queries";
import {
	usePayments,
	useSummaryStats,
} from "~/actions/tanstackHooks/payment-queries";
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
import { convertPaymentsToCSV, downloadCSV } from "~/lib/exportPaymentData";
import { formatCurrency } from "~/lib/formatCurrency";
import { formatDateTime } from "~/lib/formatDateTime";
import { ComponentLoading } from "../ui/component-loading";

type PaymentStatus = "success" | "failed" | "pending";

type DateFilter = {
	startDate?: Date;
	endDate?: Date;
};

type Payment = PaymentWithUser["payments"][number];

export function PaymentsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [dateFilter, setDateFilter] = useState<DateFilter>({
		startDate: undefined,
		endDate: undefined,
	});

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

	//filtered Payments
	const filteredPayments: PaymentWithUser["payments"] = payments.filter(
		(payment: Payment) => {
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
		(p: Payment) => getPaymentStatus(p) === "success",
	).length;

	const currentFailedPayments = filteredPayments.filter(
		(p: Payment) => getPaymentStatus(p) === "failed",
	).length;

	const currentRevenue = filteredPayments
		.filter((p: Payment) => getPaymentStatus(p) === "success")
		.reduce((sum: number, p: Payment) => sum + p.amount, 0);

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
		return <ComponentLoading message="Loading Payments" />;
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
						Payments
					</h1>
					<p className="text-gray-600 dark:text-slate-400">
						Track and manage payment transactions
					</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg">
							<Download className="h-4 w-4 mr-2" />
							Export Data
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-48 bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200"
					>
						<DropdownMenuItem
							onClick={handleExportFilteredPayments}
							className="hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Export Current View
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={handleExportAllPayments}
							className="hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Export All Records
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
								Revenue Summary
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800">
								<IndianRupee className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
							{formatCurrency(summaryStats.totalRevenue)}
						</div>
						<div className="text-sm text-gray-500 dark:text-slate-400">
							Across all records
						</div>
						<div className="mt-2 text-lg font-semibold text-emerald-500 dark:text-emerald-300">
							{formatCurrency(currentRevenue)}
						</div>
						<div className="text-sm text-gray-500 dark:text-slate-400">
							In current view
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
								Successful Transactions
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-700 dark:to-green-800">
								<TrendingUp className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600 dark:text-green-400">
							{summaryStats.totalSuccessfulPayments}
						</div>
						<div className="text-sm text-gray-500 dark:text-slate-400">
							Across all records
						</div>
						<div className="mt-2 text-lg font-semibold text-green-500 dark:text-green-300">
							{currentSuccessfulPayments}
						</div>
						<div className="text-sm text-gray-500 dark:text-slate-400">
							In current view
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
								Failed Transactions
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 dark:from-red-700 dark:to-red-800">
								<AlertCircle className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600 dark:text-red-400">
							{summaryStats.totalFailedPayments}
						</div>
						<div className="text-sm text-gray-500 dark:text-slate-400">
							Across all records
						</div>
						<div className="mt-2 text-lg font-semibold text-red-500 dark:text-red-300">
							{currentFailedPayments}
						</div>
						<div className="text-sm text-gray-500 dark:text-slate-400">
							In current view
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
								User & Payment Metrics
							</CardTitle>
							<div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800">
								<TrendingUp className="h-4 w-4 text-white" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
								{summaryStats.totalUsers}
							</div>
							<div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
								Total Users
							</div>
						</div>

						<div>
							<div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
								{summaryStats.totalPayments}
							</div>
							<div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
								Total Payments
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
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
								className="w-[150px] bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-300 [color-scheme:light] dark:[color-scheme:dark]
             [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 
             dark:[&::-webkit-calendar-picker-indicator]:invert-[0.7]"
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
								className="w-[150px] bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-300 [color-scheme:light] dark:[color-scheme:dark]
             [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 
             dark:[&::-webkit-calendar-picker-indicator]:invert-[0.7]"
							/>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
								<Input
									placeholder="Search payments..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 w-64 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="success">Success</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table className="bg-white dark:bg-black text-gray-900 dark:text-slate-200">
						<TableHeader>
							<TableRow className="bg-gray-50 dark:bg-slate-900">
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									Order Id
								</TableHead>
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									User
								</TableHead>
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									Date & Time
								</TableHead>
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									Method
								</TableHead>
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									Amount
								</TableHead>
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									Status
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredPayments.map((payment: Payment) => {
								const { date, time } = formatDateTime(
									new Date(payment.createdAt),
								);
								const paymentStatus = getPaymentStatus(payment);

								return (
									<TableRow
										key={payment.id}
										className="hover:bg-gray-50 dark:hover:bg-slate-900"
									>
										<TableCell className="font-medium">
											<div className="max-w-[180px] overflow-x-auto whitespace-nowrap text-gray-900 dark:text-slate-200">
												{payment.razorpayOrderId}
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium text-gray-900 dark:text-slate-200">
													{payment.User?.name}
												</div>
												<div className="text-sm text-gray-500 dark:text-slate-400">
													{payment.User?.email}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium text-gray-900 dark:text-slate-200">
													{date}
												</div>
												<div className="text-sm text-gray-500 dark:text-slate-400">
													{time}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-gray-900 dark:text-slate-200">
											{payment.paymentType}
										</TableCell>
										<TableCell className="font-bold text-gray-900 dark:text-slate-200">
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
							className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
						>
							⬅ Prev
						</Button>
						<span className="text-sm text-gray-500 dark:text-slate-400">
							Page {page} of {totalPages}
						</span>
						<Button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
						>
							Next ➡
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
