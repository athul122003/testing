"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	getTeamMembersWithAttendance,
	getTeamsForEvent,
	hasAttended,
	markAttendance,
	unmarkAttendance,
} from "~/actions/teams";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { QRCodeScanner } from "../othercomps/qrCodeScanner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Dialog as ExportDialog,
	DialogContent as ExportDialogContent,
} from "../ui/dialog";
import { saveAs } from "file-saver";
import { PrizeType } from "@prisma/client";

function exportEmails(
	members: Array<Member & { email?: string }>,
	filename: string,
) {
	const emails = Array.from(
		new Set(members.map((m) => m.email).filter(Boolean)),
	);
	const blob = new Blob([emails.join("\n")], {
		type: "text/plain;charset=utf-8",
	});
	saveAs(blob, filename);
}

type Member = {
	id: number;
	name: string;
	hasAttended?: boolean;
	email?: string;
};

type Team = {
	id: string;
	name: string;
	isConfirmed: boolean;
	leaderId?: number;
	hasAttended?: boolean;
	leaderName?: string;
	members: Member[];
	isUnmarking?: boolean;
};

interface AttedendedTeam extends Team {
	Members: {
		hasAttended: boolean;
		id: number;
		name: string;
		email: string;
	}[];
	Prize: {
		prizeType: PrizeType;
		flcPoints: number;
	} | null;
	Leader: {
		id: number;
		name: string;
	};
}

type EventAttendanceProps = {
	// biome-ignore lint/suspicious/noExplicitAny: <TODO>
	editingEvent: any;
};

export function EventAttendance({ editingEvent: event }: EventAttendanceProps) {
	const [teams, setTeams] = useState<AttedendedTeam[]>([]);
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [memberAttendance, setMemberAttendance] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [sortOrder, setSortOrder] = useState<"default" | "reversed">("default");

	async function fetchTeamsWithAttendance() {
		if (!event?.id) return;
		const teamDataWithAttendance = await getTeamMembersWithAttendance(event.id);

		const finalRes: AttedendedTeam[] = teamDataWithAttendance.map((team) => {
			const matchedTeam = teamDataWithAttendance.find((t) => t.id === team.id);

			if (matchedTeam) {
				matchedTeam.Members.sort((a, b) => {
					if (a.hasAttended === b.hasAttended) return 0;
					return a.hasAttended ? -1 : 1;
				});

				return {
					...matchedTeam,
					leaderName: matchedTeam.Leader?.name,
					members: matchedTeam.Members,
					Prize: matchedTeam.Prize,
					Leader: matchedTeam.Leader,
				} as AttedendedTeam;
			}
			return team as unknown as AttedendedTeam;
		});
		setTeams(finalRes);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: <its fine>
	useEffect(() => {
		fetchTeamsWithAttendance();
	}, [event?.id]);

	const filteredTeams = teams
		.filter((team) => team.name.toLowerCase().includes(search.toLowerCase()))
		.sort((a, b) => {
			const aAllAttended = a.members.every((m) => m.hasAttended);
			const aSomeAttended = a.members.some((m) => m.hasAttended);
			const bAllAttended = b.members.every((m) => m.hasAttended);
			const bSomeAttended = b.members.some((m) => m.hasAttended);

			if (sortOrder === "default") {
				if (!aSomeAttended && bSomeAttended) return -1;
				if (aSomeAttended && !bSomeAttended) return 1;

				if (aSomeAttended && !aAllAttended && bAllAttended) return -1;
				if (aAllAttended && bSomeAttended && !bAllAttended) return 1;
			} else {
				if (aAllAttended && !bAllAttended) return -1;
				if (!aAllAttended && bAllAttended) return 1;

				// Then, partial attendance (Yellow)
				if (aSomeAttended && !aAllAttended && !bSomeAttended) return -1;
				if (!aSomeAttended && bSomeAttended && !bAllAttended) return 1;
			}

			return a.name.localeCompare(b.name);
		});

	async function handleConfirmSolo(teamId: string) {
		if (!event?.id) return;
		const team = teams.find((t) => t.id === teamId);
		if (!team) return toast.error("Team not found");

		setConfirmAction({
			type: "mark",
			teamId,
			teamName: team.name,
		});
		setConfirmDialogOpen(true);
	}

	async function executeConfirmSolo(teamId: string) {
		if (!event?.id) return;
		const team = teams.find((t) => t.id === teamId);
		if (!team) return toast.error("Team not found");

		setLoading(true);
		try {
			await Promise.all(
				team.members.map((member) => markAttendance(event.id, member.id)),
			);
			toast.success(`Attendance confirmed for ${team.name}`);
			await refreshTeams();
		} catch (err) {
			console.error("Error confirming attendance:", err);
			toast.error("Failed to confirm attendance.");
		} finally {
			setLoading(false);
		}
	}

	async function handleUnmarkSolo(teamId: string) {
		if (!event?.id) return;
		const team = teams.find((t) => t.id === teamId);
		if (!team) return toast.error("Team not found");

		setConfirmAction({
			type: "unmark",
			teamId,
			teamName: team.name,
		});
		setConfirmDialogOpen(true);
	}

	async function executeUnmarkSolo(teamId: string) {
		if (!event?.id) return;
		const team = teams.find((t) => t.id === teamId);
		if (!team) return toast.error("Team not found");

		setLoading(true);
		try {
			await Promise.all(
				team.members
					.filter((member) => member.hasAttended)
					.map((member) => unmarkAttendance(event.id, member.id)),
			);
			toast.success(`Attendance removed for ${team.name}`);
			await refreshTeams();
		} catch (err) {
			console.error("Error unmarking attendance:", err);
			toast.error("Failed to unmark attendance.");
		} finally {
			setLoading(false);
		}
	}

	async function handleConfirmMembers(memberIds: number[]) {
		if (!event?.id || !selectedTeam) return;
		setLoading(true);
		try {
			await Promise.all(memberIds.map((id) => markAttendance(event.id, id)));
			toast.success(
				`Attendance confirmed for: ${selectedTeam.members
					.filter((m) => memberIds.includes(m.id))
					.map((m) => m.name)
					.join(", ")}`,
			);
			setSelectedTeam(null);
			setMemberAttendance([]);
			await refreshTeams();
		} catch (err) {
			console.error("Error confirming attendance:", err);
			toast.error("Failed to confirm attendance.");
		} finally {
			setLoading(false);
		}
	}

	async function refreshTeams() {
		setRefreshing(true);
		if (!event?.id) return;
		fetchTeamsWithAttendance();
		setRefreshing(false);
	}

	useEffect(() => {
		if (!selectedTeam) setMemberAttendance([]);
	}, [selectedTeam]);

	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [confirmAction, setConfirmAction] = useState<{
		type: "mark" | "unmark";
		teamId: string;
		teamName: string;
	} | null>(null);
	return (
		<div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6 min-h-screen">
			<div className="flex flex-col gap-4 sm:gap-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-2">
							Event Attendance
						</h1>
						<p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
							{event?.name || "Track team attendance"}
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
						<Button
							onClick={() => setExportDialogOpen(true)}
							variant="outline"
							className="w-full sm:w-auto text-sm py-2"
						>
							Export Emails
						</Button>
						<ExportDialog
							open={exportDialogOpen}
							onOpenChange={setExportDialogOpen}
						>
							<ExportDialogContent className="w-[95vw] max-w-xs mx-auto">
								<div className="flex flex-col gap-4 items-center p-4">
									<h2 className="text-lg font-semibold mb-2">Export Emails</h2>
									<Button
										className="w-full"
										onClick={() => {
											const present = teams.flatMap((t) =>
												t.members.filter((m) => m.hasAttended),
											);
											exportEmails(present, "present-emails.txt");
											setExportDialogOpen(false);
										}}
									>
										Present People Emails
									</Button>
									<Button
										className="w-full"
										onClick={() => {
											const absent = teams.flatMap((t) =>
												t.members.filter((m) => !m.hasAttended),
											);
											exportEmails(absent, "absent-emails.txt");
											setExportDialogOpen(false);
										}}
									>
										Absent People Emails
									</Button>
								</div>
							</ExportDialogContent>
						</ExportDialog>
						<Button
							variant="outline"
							onClick={refreshTeams}
							disabled={refreshing}
							className="w-full sm:w-auto text-sm py-2"
						>
							{refreshing ? "Refreshing..." : "Refresh"}
						</Button>

						<Dialog>
							<DialogTrigger asChild>
								<Button
									variant="default"
									className="w-full sm:w-auto text-sm py-2"
								>
									Scan QR Code
								</Button>
							</DialogTrigger>
							<DialogContent className="w-[95vw] max-w-md mx-auto">
								<DialogHeader>
									<DialogTitle>Scan Team QR Code</DialogTitle>
								</DialogHeader>
								<QRCodeScanner
									eventId={event?.id}
									refreshTeams={refreshTeams}
								/>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
						<CardHeader className="pb-2 sm:pb-3">
							<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
								Total Teams
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
								{teams.length}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-lg bg-white dark:bg-black border border-green-500 dark:border-green-600">
						<CardHeader className="pb-2 sm:pb-3">
							<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
								Fully Present Teams
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
								{
									teams.filter((team) =>
										team.members.every((m) => m.hasAttended),
									).length
								}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-lg bg-white dark:bg-black border border-yellow-500 dark:border-yellow-600">
						<CardHeader className="pb-2 sm:pb-3">
							<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
								Partially Present Teams
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
								{
									teams.filter(
										(team) =>
											team.members.some((m) => m.hasAttended) &&
											!team.members.every((m) => m.hasAttended),
									).length
								}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-lg bg-white dark:bg-black border border-red-500 dark:border-red-600">
						<CardHeader className="pb-2 sm:pb-3">
							<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
								Absent Teams
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
								{
									teams.filter(
										(team) => !team.members.some((m) => m.hasAttended),
									).length
								}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
				<CardHeader className="pb-3 sm:pb-4">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
						<CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-slate-200">
							Team Attendance
						</CardTitle>
						<div className="relative w-full sm:w-64">
							<Input
								placeholder="Search teams..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="text-sm bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="px-0 sm:px-6">
					<div className="block sm:hidden space-y-3 px-4">
						{filteredTeams.map((team) => (
							<Card
								key={team.id}
								className={`border ${
									team.members.every((m) => m.hasAttended)
										? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
										: team.members.some((m) => m.hasAttended)
											? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
											: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
								}`}
							>
								<CardContent className="p-4">
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<h3 className="font-medium text-gray-900 dark:text-slate-200 text-sm break-words flex-1 mr-2">
												{team.name}
											</h3>
											<Badge
												variant={team.isConfirmed ? "default" : "secondary"}
												className="text-xs shrink-0"
											>
												{team.isConfirmed ? "Confirmed" : "Pending"}
											</Badge>
										</div>

										<div>
											<span className="text-xs text-gray-500 dark:text-slate-400">
												Leader:
											</span>
											<div className="mt-1">
												<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
													{team.leaderName ?? "N/A"}
													{team.leaderId && (
														<span className="ml-1 text-xs text-slate-500">
															({team.leaderId})
														</span>
													)}
												</span>
											</div>
										</div>

										<div>
											<span className="text-xs text-gray-500 dark:text-slate-400">
												Attendance:
											</span>
											<div className="mt-1">
												{team.members.every((m) => m.hasAttended) ? (
													<span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-semibold flex items-center gap-1 px-3 py-1 rounded-full text-xs w-fit">
														All Present ✔
													</span>
												) : team.members.some((m) => m.hasAttended) ? (
													<span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 font-semibold flex items-center gap-1 px-3 py-1 rounded-full text-xs w-fit">
														Partially Present ✔
													</span>
												) : (
													<span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 font-semibold flex items-center gap-1 px-3 py-1 rounded-full text-xs w-fit">
														Absent ❌
													</span>
												)}
											</div>
										</div>

										<div>
											<span className="text-xs text-gray-500 dark:text-slate-400">
												Members:
											</span>
											<div className="flex flex-wrap gap-1 mt-1">
												{team.members.map((m) => (
													<span
														key={m.id}
														className={`inline-flex items-center px-2 py-1 text-xs rounded ${
															m.hasAttended
																? "bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 border border-green-400"
																: "bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 border border-red-400"
														}`}
													>
														{m.name}
														<span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
															({m.id})
														</span>
													</span>
												))}
											</div>
										</div>

										<div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex gap-2">
											<Button
												size="sm"
												variant={team.isConfirmed ? "default" : "outline"}
												disabled={
													loading || team.members.every((m) => m.hasAttended)
												}
												onClick={() => {
													if (event.eventType === "SOLO")
														handleConfirmSolo(team.id);
													else {
														setSelectedTeam(team);
													}
												}}
												className="flex-1 text-xs"
											>
												{team.members.every((m) => m.hasAttended)
													? "✅ Marked"
													: "Mark"}
											</Button>

											{team.members.some((m) => m.hasAttended) && (
												<Button
													size="sm"
													variant="destructive"
													disabled={loading}
													onClick={() => {
														if (event.eventType === "SOLO")
															handleUnmarkSolo(team.id);
														else
															setSelectedTeam({ ...team, isUnmarking: true });
													}}
													className="flex-1 text-xs"
												>
													Unmark
												</Button>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					<div className="hidden sm:block overflow-x-auto">
						<Table className="bg-white dark:bg-black text-gray-900 dark:text-slate-200">
							<TableHeader>
								<TableRow className="bg-gray-50 dark:bg-slate-900">
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Team
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Leader
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Members
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Status
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										<button
											type="button"
											className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 font-semibold text-inherit"
											onClick={() =>
												setSortOrder(
													sortOrder === "default" ? "reversed" : "default",
												)
											}
											aria-label={
												sortOrder === "default"
													? "Sort with present teams first"
													: "Sort with absent teams first"
											}
										>
											Attendance
											<span className="inline-flex items-center justify-center w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full">
												{sortOrder === "default" ? "↑" : "↓"}
											</span>
										</button>
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Mark
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTeams.map((team) => (
									<TableRow
										key={team.id}
										className={`hover:bg-gray-50 dark:hover:bg-slate-900 ${
											team.members.every((m) => m.hasAttended)
												? "bg-green-50 dark:bg-green-900/30"
												: team.members.some((m) => m.hasAttended)
													? "bg-yellow-50 dark:bg-yellow-900/20"
													: "bg-red-50 dark:bg-red-900/20"
										}`}
									>
										<TableCell className="font-semibold">{team.name}</TableCell>
										<TableCell>
											{team.leaderName ?? "N/A"}
											{team.leaderId && (
												<span className="ml-2 text-xs text-slate-500">
													({team.leaderId})
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1">
												{team.members.map((m) => (
													<span
														key={m.id}
														className={`inline-flex items-center px-2 py-1 text-xs rounded ${
															m.hasAttended
																? "bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 border border-green-400"
																: "bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 border border-red-400"
														}`}
													>
														{m.name}
														<span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
															({m.id})
														</span>
													</span>
												))}
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={team.isConfirmed ? "default" : "secondary"}
											>
												{team.isConfirmed ? "Confirmed" : "Pending"}
											</Badge>
										</TableCell>
										<TableCell>
											{team.members.every((m) => m.hasAttended) ? (
												<span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-semibold flex items-center gap-1 px-3 py-1 rounded-full">
													All Present
													<span>✔</span>
												</span>
											) : team.members.some((m) => m.hasAttended) ? (
												<span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 font-semibold flex items-center gap-1 px-3 py-1 rounded-full">
													Partially Present
													<span>✔</span>
												</span>
											) : (
												<span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 font-semibold flex items-center gap-1 px-3 py-1 rounded-full">
													Absent
													<span>❌</span>
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant={team.isConfirmed ? "default" : "outline"}
													disabled={
														loading || team.members.every((m) => m.hasAttended)
													}
													onClick={() => {
														if (event.eventType === "SOLO")
															handleConfirmSolo(team.id);
														else {
															setSelectedTeam(team);
														}
													}}
												>
													{team.members.every((m) => m.hasAttended)
														? "✅ Marked"
														: "Mark"}
												</Button>

												{team.members.some((m) => m.hasAttended) && (
													<Button
														size="sm"
														variant="destructive"
														disabled={loading}
														onClick={() => {
															if (event.eventType === "SOLO")
																handleUnmarkSolo(team.id);
															else
																setSelectedTeam({ ...team, isUnmarking: true });
														}}
													>
														Unmark
													</Button>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
				<DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="pb-3 sm:pb-4">
						<DialogTitle className="text-base sm:text-lg break-words">
							{selectedTeam?.isUnmarking
								? "Unmark Attendance: "
								: "Mark Attendance: "}
							{selectedTeam?.name}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						{selectedTeam?.members.map((member) => {
							const present = selectedTeam.isUnmarking
								? member.hasAttended
								: memberAttendance.includes(member.id) || member.hasAttended;

							return (
								<div
									key={member.id}
									className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border p-2 rounded ${
										member.hasAttended
											? selectedTeam.isUnmarking
												? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
												: "bg-green-100 dark:bg-green-800"
											: ""
									}`}
								>
									<span className="font-medium text-sm break-words flex-1">
										{member.name}
										<span className="ml-2 text-xs text-slate-500">
											({member.id})
										</span>
										{member.hasAttended && !selectedTeam.isUnmarking && (
											<span className="ml-2 text-green-600 dark:text-green-300 text-xs font-semibold">
												(Already Marked)
											</span>
										)}
									</span>
									{selectedTeam.isUnmarking ? (
										member.hasAttended ? (
											<Button
												size="sm"
												variant={
													memberAttendance.includes(member.id)
														? "destructive"
														: "outline"
												}
												onClick={() => {
													setMemberAttendance((prev) =>
														prev.includes(member.id)
															? prev.filter((id) => id !== member.id)
															: [...prev, member.id],
													);
												}}
												className="w-full sm:w-auto text-xs"
											>
												{memberAttendance.includes(member.id)
													? "❌ Absent"
													: "Mark Absent"}
											</Button>
										) : (
											<span className="text-slate-500 px-4 py-2 text-xs">
												Not Marked
											</span>
										)
									) : (
										<Button
											size="sm"
											variant={present ? "default" : "secondary"}
											disabled={member.hasAttended}
											onClick={() => {
												setMemberAttendance((prev) =>
													prev.includes(member.id)
														? prev.filter((id) => id !== member.id)
														: [...prev, member.id],
												);
											}}
											className="w-full sm:w-auto text-xs"
										>
											{present ? "✅ Present" : "❌ Absent"}
										</Button>
									)}
								</div>
							);
						})}

						{selectedTeam?.isUnmarking ? (
							<Button
								onClick={async () => {
									if (!event?.id || !selectedTeam) return;
									setLoading(true);
									try {
										await Promise.all(
											memberAttendance.map((id) =>
												unmarkAttendance(event.id, id),
											),
										);
										toast.success(
											`Attendance unmarked for: ${selectedTeam.members
												.filter((m) => memberAttendance.includes(m.id))
												.map((m) => m.name)
												.join(", ")}`,
										);
										setSelectedTeam(null);
										setMemberAttendance([]);
										await refreshTeams();
									} catch (err) {
										console.error("Error unmarking attendance:", err);
										toast.error("Failed to unmark attendance.");
									} finally {
										setLoading(false);
									}
								}}
								className="w-full mt-4 bg-red-600 hover:bg-red-700 text-sm py-2"
								disabled={loading || memberAttendance.length === 0}
							>
								{loading ? "Unmarking..." : "Unmark Selected Attendance"}
							</Button>
						) : (
							<Button
								onClick={() => handleConfirmMembers(memberAttendance)}
								className="w-full mt-4 text-sm py-2"
								disabled={
									loading ||
									memberAttendance.length === 0 ||
									selectedTeam?.members.filter((m) => !m.hasAttended).length ===
										0
								}
							>
								{loading ? "Confirming..." : "Confirm Selected"}
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
				<DialogContent className="w-[95vw] max-w-sm mx-auto p-4 sm:p-6">
					<DialogHeader className="pb-3 sm:pb-4">
						<DialogTitle className="text-base sm:text-lg break-words">
							{confirmAction?.type === "mark"
								? "Confirm Attendance"
								: "Remove Attendance"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-slate-400 break-words">
							{confirmAction?.type === "mark"
								? `Are you sure you want to mark attendance for "${confirmAction?.teamName}"?`
								: `Are you sure you want to remove attendance for "${confirmAction?.teamName}"?`}
						</p>
						<div className="flex flex-col sm:flex-row gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setConfirmDialogOpen(false);
									setConfirmAction(null);
								}}
								className="w-full sm:w-auto text-sm py-2"
							>
								Cancel
							</Button>
							<Button
								variant={
									confirmAction?.type === "mark" ? "default" : "destructive"
								}
								onClick={async () => {
									if (confirmAction) {
										if (confirmAction.type === "mark") {
											await executeConfirmSolo(confirmAction.teamId);
										} else {
											await executeUnmarkSolo(confirmAction.teamId);
										}
									}
									setConfirmDialogOpen(false);
									setConfirmAction(null);
								}}
								disabled={loading}
								className="w-full sm:w-auto text-sm py-2"
							>
								{loading
									? "Processing..."
									: confirmAction?.type === "mark"
										? "Confirm"
										: "Unmark"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
