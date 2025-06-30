"use client";

import { Bell, Database, Palette, Save, Shield } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

export function SettingsPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
					Settings
				</h1>
				<p className="text-slate-600 dark:text-slate-400">
					Manage your application preferences and configuration
				</p>
			</div>

			<div className="grid gap-6">
				<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
							<Database className="h-5 w-5" />
							General Settings
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="site-name">Site Name</Label>
								<Input id="site-name" defaultValue="Admin Panel" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="site-url">Site URL</Label>
								<Input id="site-url" defaultValue="https://admin.example.com" />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="site-description">Site Description</Label>
							<Textarea
								id="site-description"
								defaultValue="Comprehensive dashboard system for managing events, users, and content"
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="admin-email">Admin Email</Label>
							<Input
								id="admin-email"
								type="email"
								defaultValue="admin@example.com"
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
							<Bell className="h-5 w-5" />
							Notifications
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Email Notifications</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Receive email notifications for important events
								</p>
							</div>
							<Switch defaultChecked />
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Payment Alerts</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Get notified when payments are received or failed
								</p>
							</div>
							<Switch defaultChecked />
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">User Registration</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Notifications for new user registrations
								</p>
							</div>
							<Switch />
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Event Updates</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Notifications when events are created or updated
								</p>
							</div>
							<Switch defaultChecked />
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
							<Shield className="h-5 w-5" />
							Security
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="current-password">Current Password</Label>
								<Input id="current-password" type="password" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-password">New Password</Label>
								<Input id="new-password" type="password" />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<Input id="confirm-password" type="password" />
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Two-Factor Authentication</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Add an extra layer of security to your account
								</p>
							</div>
							<Switch />
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Session Timeout</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Automatically log out after period of inactivity
								</p>
							</div>
							<Switch defaultChecked />
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
							<Palette className="h-5 w-5" />
							Appearance
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Dark Mode</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Use dark theme across the dashboard
								</p>
							</div>
							<Switch defaultChecked />
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Compact Mode</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Use compact layout for better space utilization
								</p>
							</div>
							<Switch />
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-base">Sidebar Auto-collapse</Label>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Automatically collapse sidebar on smaller screens
								</p>
							</div>
							<Switch defaultChecked />
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
						<Save className="h-4 w-4 mr-2" />
						Save All Settings
					</Button>
				</div>
			</div>
		</div>
	);
}
