"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
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

type EventAttendanceProps = {
	// biome-ignore lint/suspicious/noExplicitAny: <TODO>
	editingEvent: any;
};

export function EventAttendance({ editingEvent: event }: EventAttendanceProps) {
	const [teams, setTeams] = useState<Team[]>([]);
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [memberAttendance, setMemberAttendance] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [sortOrder, setSortOrder] = useState<"default" | "reversed">("default");

	useEffect(() => {
		async function fetchTeamsWithAttendance() {
			if (!event?.id) return;
			const rawTeams = await getTeamsForEvent(event.id);
			const teamsWithAttendance = await Promise.all(
				rawTeams.map(async (team: Team) => {
					// Include leader as a member for attendance
					const allMembers = [...team.members];
					console.log("All members for team:", allMembers);
					const membersWithAttendance = await Promise.all(
						allMembers.map(async (member) => {
							const attended = await hasAttended(event.id, member.id);
							return { ...member, hasAttended: attended };
						}),
					);
					membersWithAttendance.sort((a, b) => {
						if (a.hasAttended === b.hasAttended) return 0;
						return a.hasAttended ? -1 : 1;
					});
					return {
						...team,
						members: membersWithAttendance,
					};
				}),
			);
			setTeams(teamsWithAttendance);
		}
		fetchTeamsWithAttendance();
	}, [event?.id]);

	useEffect(() => {
		console.log(teams);
	}, [teams]);

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
		if (confirm(`Confirm attendance for ${team.name}?`)) {
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
	}

	async function handleUnmarkSolo(teamId: string) {
		if (!event?.id) return;
		const team = teams.find((t) => t.id === teamId);
		if (!team) return toast.error("Team not found");
		if (confirm(`Remove attendance for ${team.name}?`)) {
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
		const rawTeams = await getTeamsForEvent(event.id);
		const teamsWithAttendance = await Promise.all(
			rawTeams.map(async (team: Team) => {
				const allMembers = [...team.members];
				const membersWithAttendance = await Promise.all(
					allMembers.map(async (member) => {
						const attended = await hasAttended(event.id, member.id);
						return { ...member, hasAttended: attended };
					}),
				);
				return {
					...team,
					members: membersWithAttendance,
				};
			}),
		);
		setTeams(teamsWithAttendance);
		setRefreshing(false);
	}

	useEffect(() => {
		if (!selectedTeam) setMemberAttendance([]);
	}, [selectedTeam]);

	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	return (
		<div className="space-y-8 p-6 max-w-screen-xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold text-slate-800 dark:text-white">
							Event Attendance - {event?.name}
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={() => setExportDialogOpen(true)} variant="outline">
							Export Emails
						</Button>
						<ExportDialog
							open={exportDialogOpen}
							onOpenChange={setExportDialogOpen}
						>
							<ExportDialogContent className="sm:max-w-xs">
								<div className="flex flex-col gap-4 items-center p-2">
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
						>
							Refresh
						</Button>

						<Dialog>
							<DialogTrigger asChild>
								<Button variant="default">Scan QR Code</Button>
							</DialogTrigger>
							<DialogContent>
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

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
					<Card className="shadow-sm bg-white dark:bg-slate-900 border border-black/80 dark:border-slate-600">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">
								Total Teams
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-800 dark:text-white">
								{teams.length}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm bg-white dark:bg-slate-900 border-green-500 dark:border-green-600">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">
								Fully Present Teams
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">
								{
									teams.filter((team) =>
										team.members.every((m) => m.hasAttended),
									).length
								}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm bg-white dark:bg-slate-900 border-yellow-500 dark:border-yellow-600">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">
								Partially Present Teams
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
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

					<Card className="shadow-sm bg-white dark:bg-slate-900 border-red-500 dark:border-red-600">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">
								Absent Teams
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600 dark:text-red-400">
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

			<div className="flex flex-col md:flex-row gap-4 items-center">
				<Input
					placeholder="Search teams..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full md:w-1/3"
				/>
			</div>

			<Table className="rounded-l</DialogTrigger>g overflow-hidden border">
				<TableHeader>
					<TableRow className="bg-slate-100 dark:bg-slate-800">
						<TableHead>Team</TableHead>
						<TableHead>Leader</TableHead>
						<TableHead>Members</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>
							<button
								type="button"
								className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 font-semibold text-inherit"
								onClick={() =>
									setSortOrder(sortOrder === "default" ? "reversed" : "default")
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
								<span className="text-xs text-slate-500 dark:text-slate-400">
									{sortOrder === "default"}
								</span>
							</button>
						</TableHead>
						<TableHead>Mark</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredTeams.map((team) => (
						<TableRow
							key={team.id}
							className={
								team.members.every((m) => m.hasAttended)
									? "bg-green-50 dark:bg-green-900/30"
									: team.members.some((m) => m.hasAttended)
										? "bg-yellow-50 dark:bg-yellow-900/20"
										: "bg-red-50 dark:bg-red-900/20"
							}
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
								<Badge variant={team.isConfirmed ? "default" : "secondary"}>
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
												else setSelectedTeam({ ...team, isUnmarking: true });
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

			<Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
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
									className={`flex justify-between items-center border p-2 rounded ${
										member.hasAttended
											? selectedTeam.isUnmarking
												? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
												: "bg-green-100 dark:bg-green-800"
											: ""
									}`}
								>
									<span className="font-medium">
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
											>
												{memberAttendance.includes(member.id)
													? "❌ Absent"
													: "Mark Absent"}
											</Button>
										) : (
											<span className="text-slate-500 px-4 py-2">
												Not Marked
											</span>
										)
									) : (
										<Button
											variant={present ? "default" : "secondary"}
											disabled={member.hasAttended}
											onClick={() => {
												setMemberAttendance((prev) =>
													prev.includes(member.id)
														? prev.filter((id) => id !== member.id)
														: [...prev, member.id],
												);
											}}
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
								className="w-full mt-4 bg-red-600 hover:bg-red-700"
								disabled={loading || memberAttendance.length === 0}
							>
								{loading ? "Unmarking..." : "Unmark Selected Attendance"}
							</Button>
						) : (
							<Button
								onClick={() => handleConfirmMembers(memberAttendance)}
								className="w-full mt-4"
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
		</div>
	);
}
