"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTeamsForEvent, hasAttended, markAttendance } from "~/actions/teams";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Scanner } from "~/components/ui/scanner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

type Member = {
	id: number;
	name: string;
	hasAttended?: boolean;
};

type Team = {
	id: string;
	name: string;
	isConfirmed: boolean;
	leaderId?: number;
	leaderName?: string;
	members: Member[];
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
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		async function fetchTeamsWithAttendance() {
			if (!event?.id) return;
			const rawTeams = await getTeamsForEvent(event.id);
			const teamsWithAttendance = await Promise.all(
				rawTeams.map(async (team: Team) => {
					// Include leader as a member for attendance
					const allMembers = [
						...(team.leaderId && team.leaderName
							? [{ id: team.leaderId, name: team.leaderName }]
							: []),
						...team.members,
					];
					console.log("All members for team:", allMembers);
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
		}
		fetchTeamsWithAttendance();
	}, [event?.id]);

	const filteredTeams = teams.filter((team) =>
		team.name.toLowerCase().includes(search.toLowerCase()),
	);

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

	function handleScan(teamId: string) {
		const team = teams.find((t) => t.id === teamId);
		if (!team) return toast.error("Team not found");
		if (event.eventType === "SOLO") {
			handleConfirmSolo(teamId);
		} else {
			setSelectedTeam(team);
			setMemberAttendance([]);
		}
	}

	async function refreshTeams() {
		if (!event?.id) return;
		const rawTeams = await getTeamsForEvent(event.id);
		const teamsWithAttendance = await Promise.all(
			rawTeams.map(async (team: Team) => {
				const allMembers = [
					...(team.leaderId && team.leaderName
						? [{ id: team.leaderId, name: team.leaderName }]
						: []),
					...team.members,
				];
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
	}

	useEffect(() => {
		if (!selectedTeam) setMemberAttendance([]);
	}, [selectedTeam]);

	return (
		<div className="space-y-8 p-6 max-w-screen-xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<h1 className="text-3xl font-bold text-slate-800 dark:text-white">
					Event Attendance
				</h1>
			</div>

			<div className="flex flex-col md:flex-row gap-4 items-center">
				<Input
					placeholder="Search teams..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full md:w-1/3"
				/>
			</div>

			<Table className="rounded-lg overflow-hidden border">
				<TableHeader>
					<TableRow className="bg-slate-100 dark:bg-slate-800">
						<TableHead>Team</TableHead>
						<TableHead>Leader</TableHead>
						<TableHead>Members</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Attendance</TableHead>
						<TableHead>Mark</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredTeams.map((team) => (
						<TableRow
							key={team.id}
							className={
								team.isConfirmed ? "bg-green-50 dark:bg-green-900" : ""
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
													: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300"
											}`}
										>
											{m.name}
											{m.hasAttended && (
												<span className="ml-1 text-green-600 dark:text-green-300">
													✔
												</span>
											)}
											<span className="ml-1 text-xs text-slate-500">
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
									<span className="text-green-600 dark:text-green-300 font-semibold flex items-center gap-1">
										All Marked
										<span>✔</span>
									</span>
								) : team.members.some((m) => m.hasAttended) ? (
									<span className="text-yellow-600 dark:text-yellow-300 font-semibold flex items-center gap-1">
										Partially Marked
										<span>⏳</span>
									</span>
								) : (
									<span className="text-slate-500 dark:text-slate-400">
										Not Marked
									</span>
								)}
							</TableCell>
							<TableCell>
								<Button
									size="sm"
									variant={team.isConfirmed ? "default" : "outline"}
									disabled={loading || team.members.every((m) => m.hasAttended)}
									onClick={() => {
										if (event.eventType === "SOLO") handleConfirmSolo(team.id);
										else {
											setSelectedTeam(team);
										}
									}}
								>
									{team.members.every((m) => m.hasAttended)
										? "✅ Marked"
										: "Mark"}
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Mark Attendance: {selectedTeam?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						{selectedTeam?.members.map((member) => {
							const present =
								memberAttendance.includes(member.id) || member.hasAttended;
							return (
								<div
									key={member.id}
									className={`flex justify-between items-center border p-2 rounded ${
										member.hasAttended ? "bg-green-100 dark:bg-green-800" : ""
									}`}
								>
									<span className="font-medium">
										{member.name}
										<span className="ml-2 text-xs text-slate-500">
											({member.id})
										</span>
										{member.hasAttended && (
											<span className="ml-2 text-green-600 dark:text-green-300 text-xs font-semibold">
												(Already Marked)
											</span>
										)}
									</span>
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
								</div>
							);
						})}
						<Button
							onClick={() => handleConfirmMembers(memberAttendance)}
							className="w-full mt-4"
							disabled={
								loading ||
								memberAttendance.length === 0 ||
								selectedTeam?.members.filter((m) => !m.hasAttended).length === 0
							}
						>
							{loading ? "Confirming..." : "Confirm Selected"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
