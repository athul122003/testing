"use client";

import { Calendar, DollarSign, FileText, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const stats = [
	{
		title: "Total Events",
		value: "24",
		icon: Calendar,
	},
	{
		title: "Total Posts",
		value: "12",
		icon: FileText,
	},
	{
		title: "Gallery Items",
		value: "156",
		icon: ImageIcon,
	},
	{
		title: "Total Revenue",
		value: "$12,450",
		icon: DollarSign,
	},
];

export function DashboardContent() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Dashboard</h1>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<stat.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded border">
                <span>Tech Conference 2024</span>
                <span className="text-sm text-muted-foreground">Jan 15</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded border">
                <span>Workshop: React Basics</span>
                <span className="text-sm text-muted-foreground">Jan 20</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded border">
                <span>New user registered</span>
                <span className="text-sm text-muted-foreground">2h ago</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded border">
                <span>Payment received</span>
                <span className="text-sm text-muted-foreground">4h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
		</div>
	);
}
