"use client";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

const payments = [
	{
		id: "PAY001",
		userId: "USR001",
		username: "john_doe",
		date: "2024-01-15",
		time: "10:30 AM",
		amount: "$99.00",
		status: "success",
	},
	{
		id: "PAY002",
		userId: "USR002",
		username: "jane_smith",
		date: "2024-01-14",
		time: "2:15 PM",
		amount: "$149.00",
		status: "failed",
	},
];

export function PaymentsPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Payments</h1>

			<Card>
				<CardHeader>
					<CardTitle>Payment History</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Payment ID</TableHead>
								<TableHead>User ID</TableHead>
								<TableHead>Username</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payments.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell className="font-medium">{payment.id}</TableCell>
									<TableCell>{payment.userId}</TableCell>
									<TableCell>{payment.username}</TableCell>
									<TableCell>{payment.date}</TableCell>
									<TableCell>{payment.time}</TableCell>
									<TableCell>{payment.amount}</TableCell>
									<TableCell>
										<Badge
											variant={
												payment.status === "success" ? "default" : "destructive"
											}
										>
											{payment.status}
										</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
