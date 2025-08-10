"use client";

import {
	AlertCircle,
	Download,
	IndianRupee,
	Search,
	TrendingUp,
	X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { getPaymentInfo } from "~/actions/payment-info";
import { searchPayments } from "~/actions/payment-info";
import { filterPaymentsByDate } from "~/actions/payment-info";
//types
import type {
	PaymentWithUser,
	SummaryStats,
} from "~/actions/tanstackHooks/payment-queries";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { permissionKeys as perm } from "~/actions/middleware/routePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
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
import { useDashboardData } from "~/providers/dashboardDataContext";
import { ComponentLoading } from "../ui/component-loading";
import { AccessDenied } from "../othercomps/access-denied";

type PaymentStatus = "success" | "failed" | "pending";

type DateFilter = {
	startDate?: Date;
	endDate?: Date;
};

type Payment = PaymentWithUser["payments"][number];

export function PaymentsPage() {
	const [searchInput, setSearchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [dateFilter, setDateFilter] = useState<DateFilter>({
		startDate: undefined,
		endDate: undefined,
	});
	const [isSearching, setIsSearching] = useState(false);
	const [isDateFiltering, setIsDateFiltering] = useState(false);

	const pageSize = 20;
	const { hasPerm, paymentsQuery, setPaymentParams, summaryStatsQuery } =
		useDashboardData();
	const canManagePayments = hasPerm(perm.MANAGE_PAYMENTS);
	const { data: paymentsData, isLoading } = paymentsQuery;

	const [searchResults, setSearchResults] = useState<PaymentWithUser | null>(
		null,
	);
	const [dateFilterResults, setDateFilterResults] =
		useState<PaymentWithUser | null>(null);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [dateFilterError, setDateFilterError] = useState<string | null>(null);

	const handleSearch = async (e: FormEvent) => {
		e.preventDefault();

		if (!searchInput || searchInput.length < 2) {
			setSearchError("Search term must be at least 2 characters");
			return;
		}

		setIsSearching(true);
		setSearchError(null);

		try {
			const results = await searchPayments({
				searchTerm: searchInput,
				page: 1,
				pageSize,
				startDate: dateFilter.startDate,
				endDate: dateFilter.endDate,
			});

			setSearchResults(results);
			setPage(1);
		} catch (error) {
			console.error("Search failed:", error);
			setSearchError(error instanceof Error ? error.message : "Search failed");
		} finally {
			setIsSearching(false);
		}
	};

	const handleDateFilter = async (e: FormEvent) => {
		e.preventDefault();

		if (!dateFilter.startDate && !dateFilter.endDate) {
			setDateFilterError("Please select at least one date");
			return;
		}

		setIsDateFiltering(true);
		setDateFilterError(null);

		try {
			const results = await filterPaymentsByDate({
				startDate: dateFilter.startDate,
				endDate: dateFilter.endDate,
				page: 1,
				pageSize,
			});

			setDateFilterResults(results);
			setSearchResults(null); // Clear any search results
			setSearchInput(""); // Clear search input
			setPage(1);
		} catch (error) {
			console.error("Date filtering failed:", error);
			setDateFilterError(
				error instanceof Error ? error.message : "Date filtering failed",
			);
		} finally {
			setIsDateFiltering(false);
		}
	};

	const resetFilters = () => {
		setSearchInput("");
		setSearchResults(null);
		setSearchError(null);
		setDateFilterResults(null);
		setDateFilterError(null);
		setDateFilter({
			startDate: undefined,
			endDate: undefined,
		});
		setPage(1);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need of exhaustive deps here>
	useEffect(() => {
		// Only fetch from server if we don't have any active filters
		if (!searchResults && !dateFilterResults) {
			setPaymentParams(page, pageSize, dateFilter);
		}
	}, [page, pageSize, searchResults, dateFilterResults, setPaymentParams]);

	//fetch payments data
	const displayedData = searchResults || dateFilterResults || paymentsData;
	const payments: PaymentWithUser["payments"] = displayedData?.payments ?? [];
	const totalPages: PaymentWithUser["totalPages"] =
		displayedData?.totalPages ?? 1;

	//fetch summary stats
	const { data: summaryStatsData } = summaryStatsQuery;
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
			const matchesStatus =
				statusFilter === "all" || getPaymentStatus(payment) === statusFilter;
			return matchesStatus;
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

	if (!canManagePayments) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh]">
				<AccessDenied />
				<p className="text-gray-500 dark:text-slate-400 text-center max-w-xs">
					You do not have permission to manage payments.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return <ComponentLoading message="Loading Payments" />;
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-200">
						Payments
					</h1>
					<p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
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

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
				{/* <Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
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
				</Card> */}
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
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
							Payment History
						</CardTitle>
						<div className="flex flex-col sm:flex-row gap-3">
							<form
								onSubmit={handleDateFilter}
								className="flex items-center gap-2"
							>
								<div className="flex gap-2">
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
										className="w-full sm:w-[150px] bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-300"
										aria-label="Start date"
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
										className="w-full sm:w-[150px] bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-300"
										aria-label="End date"
									/>
									<Button
										type="submit"
										className="bg-green-600 hover:bg-green-700 text-white"
										disabled={
											isDateFiltering ||
											(!dateFilter.startDate && !dateFilter.endDate)
										}
									>
										{isDateFiltering ? "Filtering..." : "Go"}
									</Button>
								</div>
								{dateFilterResults && (
									<Button
										type="button"
										onClick={resetFilters}
										variant="outline"
										size="sm"
										className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
									>
										Clear Dates
									</Button>
								)}
							</form>
							{dateFilterError && (
								<div className="text-sm text-red-500 mt-1">
									{dateFilterError}
								</div>
							)}
							<form
								onSubmit={handleSearch}
								className="flex gap-2 w-full sm:w-auto"
							>
								<div className="relative w-full">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
									<Input
										placeholder="Search payments..."
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										className="pl-10 w-full sm:w-64 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200"
										required
										minLength={2}
									/>
								</div>
								<Button
									type="submit"
									className="bg-blue-600 hover:bg-blue-700 text-white"
									disabled={isSearching}
								>
									{isSearching ? "Searching..." : "Search"}
								</Button>
								{searchResults && (
									<Button
										type="button"
										onClick={resetFilters}
										variant="outline"
										className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
									>
										Clear
									</Button>
								)}
							</form>
							{searchError && (
								<div className="text-sm text-red-500 mt-1">{searchError}</div>
							)}
							{/* <Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="success">Success</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
								</SelectContent>
							</Select> */}
						</div>
					</div>
				</CardHeader>
				{(searchResults || dateFilterResults) && (
					<div className="px-6 py-2 bg-gray-50 dark:bg-slate-900/50 border-y border-gray-100 dark:border-slate-800">
						<div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
							<div className="text-sm">
								{searchResults && searchInput.length >= 2 && (
									<p className="font-medium text-gray-900 dark:text-slate-200">
										Search results for:{" "}
										<span className="text-blue-600 dark:text-blue-400">
											"{searchInput}"
										</span>
									</p>
								)}
								{dateFilterResults && !searchResults && (
									<p className="font-medium text-gray-900 dark:text-slate-200">
										Date filter:{" "}
										<span className="text-green-600 dark:text-green-400">
											{dateFilter.startDate && dateFilter.endDate
												? `${dateFilter.startDate.toLocaleDateString()} to ${dateFilter.endDate.toLocaleDateString()}`
												: dateFilter.startDate
													? `From ${dateFilter.startDate.toLocaleDateString()}`
													: dateFilter.endDate
														? `Until ${dateFilter.endDate.toLocaleDateString()}`
														: ""}
										</span>
									</p>
								)}
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={resetFilters}
								className="text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-700"
							>
								<X className="h-3.5 w-3.5 mr-1" />
								Clear All Filters
							</Button>
						</div>
					</div>
				)}

				<CardContent>
					<div className="overflow-x-auto">
						<Table className="min-w-full bg-white dark:bg-black text-gray-900 dark:text-slate-200">
							<TableHeader>
								<TableRow className="bg-gray-50 dark:bg-slate-900">
									<TableHead className="text-gray-900 dark:text-slate-200">
										Order Id
									</TableHead>
									<TableHead className="text-gray-900 dark:text-slate-200">
										User
									</TableHead>
									<TableHead className="text-gray-900 dark:text-slate-200">
										Date & Time
									</TableHead>
									<TableHead className="text-gray-900 dark:text-slate-200">
										Method
									</TableHead>
									<TableHead className="text-gray-900 dark:text-slate-200">
										Amount
									</TableHead>
									<TableHead className="text-gray-900 dark:text-slate-200">
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
					</div>

					<div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
						<Button
							onClick={() => {
								if (page > 1) {
									setPage(page - 1);

									if (searchResults && searchInput.length >= 2) {
										searchPayments({
											searchTerm: searchInput,
											page: page - 1,
											pageSize,
											startDate: dateFilter.startDate,
											endDate: dateFilter.endDate,
										})
											.then(setSearchResults)
											.catch((err) => setSearchError(err.message));
									} else if (dateFilterResults) {
										filterPaymentsByDate({
											startDate: dateFilter.startDate,
											endDate: dateFilter.endDate,
											page: page - 1,
											pageSize,
										})
											.then(setDateFilterResults)
											.catch((err) => setDateFilterError(err.message));
									}
								}
							}}
							disabled={page === 1 || isSearching}
							className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
						>
							⬅ Prev
						</Button>
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-500 dark:text-slate-400">
								Page {page} of {totalPages}
							</span>
							{searchResults && (
								<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
									Search Results
								</Badge>
							)}
							{dateFilterResults && !searchResults && (
								<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
									Date Filtered
								</Badge>
							)}
						</div>
						<Button
							onClick={() => {
								if (page < totalPages) {
									setPage(page + 1);

									if (searchResults && searchInput.length >= 2) {
										searchPayments({
											searchTerm: searchInput,
											page: page + 1,
											pageSize,
											startDate: dateFilter.startDate,
											endDate: dateFilter.endDate,
										})
											.then(setSearchResults)
											.catch((err) => setSearchError(err.message));
									} else if (dateFilterResults) {
										filterPaymentsByDate({
											startDate: dateFilter.startDate,
											endDate: dateFilter.endDate,
											page: page + 1,
											pageSize,
										})
											.then(setDateFilterResults)
											.catch((err) => setDateFilterError(err.message));
									}
								}
							}}
							disabled={page === totalPages || isSearching}
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
