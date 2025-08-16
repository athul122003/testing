"use client";
import { OctagonAlert, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { changePasswordAction } from "~/actions/auth";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { useDashboardData } from "~/providers/dashboardDataContext";
import MaintainenceSwitch from "../ui/switches/maintainenceSwitch";
import NukeSwitch from "../ui/switches/nukeSwitch";
import { permissionKeys as perm } from "~/actions/middleware/routePermissions";
import RegisterSwitch from "../ui/switches/regSwitch";
import { AccessDenied } from "../othercomps/access-denied";
import { getBannerSettings, updateBanner } from "~/actions/others";
import { Switch } from "../ui/switch";
import { ComponentLoading } from "../ui/component-loading";

export function SettingsPage() {
	const [globalLoading, setGlobalLoading] = useState(true);
	const { user, hasPerm } = useDashboardData();
	const [bannerSaveLoading, setBannerSaveLoading] = useState(false);
	const [bannerEnabled, setBannerEnabled] = useState(false);
	const [updatedBanner, setUpdatedBanner] = useState(false);
	const [bannerDesc, setBannerDesc] = useState("");
	const [currPass, setCurrPass] = useState("");
	const [newPass, setNewPass] = useState("");
	const [confirmPass, setConfirmPass] = useState("");
	const [_isLoading, setIsLoading] = useState(false);
	const fetchBannerSettings = async () => {
		try {
			setGlobalLoading(true);
			const bannerSettings = await getBannerSettings();
			if (bannerSettings) {
				setBannerEnabled(bannerSettings.status);
				setBannerDesc(bannerSettings.description || "");
			}
		} catch (error) {
			console.error("Error fetching banner settings:", error);
		} finally {
			setUpdatedBanner(false);
			setGlobalLoading(false);
		}
	};
	const handleSaveBanner = async () => {
		try {
			setBannerSaveLoading(true);
			await updateBanner(bannerEnabled, bannerDesc);
		} catch (error) {
			console.error("Error saving banner settings:", error);
		} finally {
			setUpdatedBanner(false);
			setBannerSaveLoading(false);
		}
	};
	const handleChangePassword = async () => {
		if (newPass !== confirmPass) {
			alert("Passwords do not match");
			return;
		}

		setIsLoading(true);
		try {
			if (!currPass || !newPass || !confirmPass) {
				alert("Please fill in all fields");
				return;
			}
			if (!user || !user.id) {
				alert("User not found");
				return;
			}
			const result = await changePasswordAction(
				currPass,
				newPass,
				confirmPass,
				parseInt(user.id),
			);
			if (result.success) {
				alert("Password changed successfully");
			} else {
				alert(`Failed to change password: ${result.error}`);
			}
		} catch (error) {
			console.error("Error changing password:", error);
			alert("An error occurred while changing the password");
		} finally {
			setIsLoading(false);
			setConfirmPass("");
			setNewPass("");
			setCurrPass("");
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need>
	useEffect(() => {
		fetchBannerSettings();
	}, []);

	const canManageSettings = hasPerm(perm.MANAGE_SETTINGS);

	if (!canManageSettings) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh]">
				<AccessDenied />
				<p className="text-gray-500 dark:text-slate-400 text-center max-w-xs">
					You do not have permission to manage settings.
				</p>
			</div>
		);
	} else if (globalLoading) {
		return <ComponentLoading message="Loading Settings" />;
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
					Settings
				</h1>
			</div>

			<div className="grid gap-6">
				<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
							<OctagonAlert className="h-5 w-5" />
							Danger Zone
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6 flex justify-center items-center">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-center items-center w-full">
							<div className="border-4 border-black dark:border-white min-h-80 rounded-xl flex flex-col justify-between items-center p-4">
								<Label
									htmlFor="register_switch"
									className="text-xl font-bold self-center"
								>
									Registration Switch
								</Label>
								<RegisterSwitch />
							</div>
							{/* <div className="border-4 border-black dark:border-white min-h-80 rounded-xl flex flex-col justify-between items-center p-4">
								<Label
									htmlFor="maintainence_mode"
									className="text-xl font-bold self-center"
								>
									Maintainence Mode
								</Label>
								<MaintainenceSwitch />
							</div> */}
							<div className="border-4 border-black dark:border-white min-h-80 rounded-xl flex flex-col justify-between items-center p-4">
								<Label
									htmlFor="nuke_switch"
									className="text-xl font-bold self-center"
								>
									Redeploy Website
								</Label>
								<NukeSwitch />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
							Banner / Marquee Control
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center gap-4">
							<Label htmlFor="banner-toggle" className="text-base">
								Show Banner
							</Label>
							<Switch
								checked={bannerEnabled}
								onCheckedChange={() => {
									setBannerEnabled((prev) => !prev);
									setUpdatedBanner(true);
								}}
								id="banner-toggle"
							/>
						</div>
						<div
							className={`transition-all duration-300 overflow-hidden ${
								bannerEnabled || updatedBanner
									? "max-h-40 opacity-100 mt-2"
									: "max-h-0 opacity-0 pointer-events-none"
							}`}
						>
							<div className="space-y-2">
								<Label htmlFor="banner-desc">Banner Description</Label>
								<Input
									id="banner-desc"
									value={bannerDesc}
									className="ml-2 w-[90%]"
									onChange={(e) => {
										setBannerDesc(e.target.value);
										setUpdatedBanner(true);
									}}
									placeholder="Enter banner/marquee text"
									disabled={!bannerEnabled}
								/>
							</div>
							<Button
								className="w-fit bg-blue-900 text-white hover:bg-blue-700 mt-4"
								disabled={bannerSaveLoading || !updatedBanner}
								onClick={() => {
									if (bannerEnabled && !bannerDesc.trim()) {
										alert("Banner description cannot be blank.");
										return;
									}
									handleSaveBanner();
								}}
							>
								<Save className="mr-2 h-4 w-4" />
								Save Banner Settings
								{bannerSaveLoading && <ComponentLoading size="sm" message="" />}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
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
				</Card> */}

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
								<Input
									id="current-password"
									value={currPass}
									onChange={(e) => setCurrPass(e.target.value)}
									type="password"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-password">New Password</Label>
								<Input
									id="new-password"
									value={newPass}
									onChange={(e) => setNewPass(e.target.value)}
									type="password"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<Input
								id="confirm-password"
								value={confirmPass}
								onChange={(e) => setConfirmPass(e.target.value)}
								type="password"
							/>
						</div>
						<Separator />
						<Button
							className="w-fit bg-blue-900 text-white hover:bg-blue-700"
							onClick={() => {
								handleChangePassword();
							}}
						>
							<Save className="mr-2 h-4 w-4" />
							Change Password
						</Button>
					</CardContent>
				</Card>

				{/* <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
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
				</Card> */}
			</div>
		</div>
	);
}
