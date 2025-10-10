"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { Search, Plus, Download } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Dialog as ExportDialog,
	DialogContent as ExportDialogContent,
} from "~/components/ui/dialog";
import { exportParticipantsDocx } from "~/lib/exportEventsDoc";
import { saveAs } from "file-saver";
import {
	getTeamsForEvent,
	deleteTeam,
	updateTeamName,
	removeMemberFromTeam,
	addMemberToTeam,
	confirmTeam,
	createTeam,
	unConfirmTeam,
	makeLeader,
} from "~/actions/teams";
import { toast } from "sonner";
import {
	exportTeamsDetailsPDF,
	exportTeamsForPrint,
} from "./event-team-export";

type Member = {
	id: number;
	name: string;
	email: string;
	phone: string;
};

type Team = {
	id: string;
	name: string;
	leaderId?: number;
	isConfirmed: boolean;
	leaderName?: string;
	leaderPhone?: string;
	members: Member[];
	yearOfStudy?: number | null;
};

type EventParticipantsProps = {
	editingEvent: any;
};

function exportEmails(teams: Team[]) {
	const emails = new Set<string>();
	teams.forEach((team) => {
		team.members.forEach((member) => {
			console.log(member);
			if ((member as any).email) {
				emails.add((member as any).email);
			}
		});
	});
	const emailList = Array.from(emails).join("\n");
	const blob = new Blob([emailList], { type: "text/plain;charset=utf-8" });
	saveAs(blob, "event-emails.txt");
}

export function EventParticipants({ editingEvent }: EventParticipantsProps) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [detailsExportDialogOpen, setDetailsExportDialogOpen] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [yearFilter, setYearFilter] = useState<number | "all">("all");
	const [teams, setTeams] = useState<Team[]>([]);
	const [teamNameInput, setTeamNameInput] = useState("");
	const [addingMemberId, setAddingMemberId] = useState("");
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [newTeamName, setNewTeamName] = useState("");
	const [newLeaderId, setNewLeaderId] = useState("");
	const [newMemberIds, setNewMemberIds] = useState("");
	const [creating, setCreating] = useState(false);
	const [newIsConfirmed, setNewIsConfirmed] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const isSoloEvent =
		editingEvent.minTeamSize === 1 && editingEvent.maxTeamSize === 1;

	useEffect(() => {
		if (editingEvent?.id) {
			getTeamsForEvent(editingEvent.id).then(setTeams);
		}
	}, [editingEvent.id]);

	useEffect(() => {
		if (selectedTeam) setTeamNameInput(selectedTeam.name);
	}, [selectedTeam]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Needed to reset pagination
	useEffect(() => {
		setPage(1);
	}, [searchQuery]);

	const filteredTeams = teams.filter((team) => {
		const matchesSearch = team.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesYear = yearFilter === "all" || team.yearOfStudy === yearFilter;
		return matchesSearch && matchesYear;
	});

	const batchRestrictions = editingEvent?.statusOfBatchRestriction
		? editingEvent?.batchRestriction || []
		: [];

	const getTeamCountsByYear = () => {
		if (!editingEvent?.statusOfBatchRestriction) return {};

		const counts: Record<
			number,
			{ confirmed: number; total: number; maxCapacity: number }
		> = {};

		batchRestrictions.forEach(
			(batch: { year: number; maxCapacity: number }) => {
				const yearTeams = teams.filter((t) => t.yearOfStudy === batch.year);
				counts[batch.year] = {
					confirmed: yearTeams.filter((t) => t.isConfirmed).length,
					total: yearTeams.length,
					maxCapacity: batch.maxCapacity,
				};
			},
		);

		return counts;
	};

	const teamCountsByYear = getTeamCountsByYear();

	const totalPages = Math.ceil(filteredTeams.length / pageSize);

	const paginatedTeams = filteredTeams.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	// Update local teams state directly
	function updateTeamInList(updatedTeam: Team) {
		setTeams((prev) =>
			prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)),
		);
		setSelectedTeam(updatedTeam);
	}

	async function handleUpdateTeamName() {
		if (!selectedTeam) return;
		try {
			await updateTeamName(selectedTeam.id, teamNameInput);
			const updatedTeam = { ...selectedTeam, name: teamNameInput };
			updateTeamInList(updatedTeam);
			toast.success("Team name updated successfully");
		} catch {
			toast.error("Failed to update team name");
		}
	}

	async function handleDeleteTeam(teamId: string) {
		try {
			await deleteTeam(teamId);
			setTeams((prev) => prev.filter((t) => t.id !== teamId));
			setSelectedTeam(null); // close modal
			toast.success("Team deleted successfully");
		} catch {
			toast.error("Failed to delete team");
		}
	}

	async function handleMakeLeader(teamId: string, userId: number) {
		try {
			await makeLeader(teamId, userId);
			if (!selectedTeam) {
				toast.error("No team selected");
				return;
			}

			const updatedMembers = selectedTeam.members.map((member) => ({
				...member,
				id: member.id,
				name: member.name,
				email: (member as any).email,
				isLeader: member.id === userId,
			}));

			const updatedTeam = {
				...selectedTeam,
				leaderId: userId,
				leaderName: updatedMembers.find((m) => m.id === userId)?.name,
				members: updatedMembers,
			};
			updateTeamInList(updatedTeam);
			toast.success("Leader updated successfully");
		} catch {
			toast.error("Failed to update leader");
		}
	}

	async function handleRemoveMember(teamId: string, userId: number) {
		try {
			await removeMemberFromTeam(teamId, userId);
			if (!selectedTeam) {
				toast.error("No team selected");
				return;
			}

			const updatedTeam = {
				...selectedTeam,
				members: selectedTeam.members.filter((m) => m.id !== userId),
			};
			updateTeamInList(updatedTeam);
			toast.success("Member removed successfully");
		} catch {
			toast.error("Failed to remove member");
		}
	}

	async function handleAddMember() {
		if (!selectedTeam || !addingMemberId) return;

		try {
			const updatedMembers = await addMemberToTeam(
				selectedTeam.id,
				Number(addingMemberId),
			);
			setSelectedTeam({ ...selectedTeam, members: updatedMembers });
			setTeams((prev) =>
				prev.map((t) =>
					t.id === selectedTeam.id ? { ...t, members: updatedMembers } : t,
				),
			);
			setAddingMemberId("");
			toast.success("Member added successfully");
		} catch (err: any) {
			toast.error(err.message || "Failed to add member");
		}
	}

	async function handleConfirmTeam(teamId: string) {
		try {
			const result = await confirmTeam(teamId);
			if (!result.success) {
				toast.error(result.message);
				return;
			}

			// Update states
			setSelectedTeam((prev) => prev && { ...prev, isConfirmed: true });
			setTeams((prev) =>
				prev.map((team) =>
					team.id === teamId ? { ...team, isConfirmed: true } : team,
				),
			);

			toast.success("Team confirmed successfully");
		} catch (err: any) {
			toast.error(err.message || "Failed to confirm team");
		}
	}

	async function handleUnConfirmTeam(teamId: string) {
		try {
			const result = await unConfirmTeam(teamId);
			if (!result.success) {
				toast.error(result.message);
				return;
			}

			// Update states
			setSelectedTeam((prev) => prev && { ...prev, isConfirmed: false });
			setTeams((prev) =>
				prev.map((team) =>
					team.id === teamId ? { ...team, isConfirmed: false } : team,
				),
			);

			toast.success("Team unconfirmed successfully");
		} catch (err: any) {
			toast.error(err.message || "Failed to unconfirm team");
		}
	}

	async function handleCreateTeam() {
		const isSoloEvent =
			editingEvent.minTeamSize === 1 && editingEvent.maxTeamSize === 1;

		// --- Client-side validation ---
		if (!newLeaderId || (!newTeamName && !isSoloEvent)) {
			toast.error(
				isSoloEvent
					? "Leader ID is required"
					: "Team name and leader ID are required",
			);
			return;
		}

		// Parse leader ID
		const leaderIdNum = Number(newLeaderId);
		if (isNaN(leaderIdNum) || leaderIdNum <= 0) {
			toast.error("Leader ID must be a valid positive number");
			return;
		}

		// Parse member IDs
		const memberIdsArray = newMemberIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id !== "")
			.map((id) => Number(id))
			.filter((id) => !isNaN(id) && id > 0);

		// Remove duplicates
		const uniqueMemberIds = Array.from(new Set(memberIdsArray));

		// Solo event rule: no extra members allowed
		if (isSoloEvent && uniqueMemberIds.length > 0) {
			toast.error("Cannot add members for a solo event");
			return;
		}

		// Leader cannot also be a member
		if (uniqueMemberIds.includes(leaderIdNum)) {
			toast.error("Leader cannot be added as a member");
			return;
		}

		// Team event rule: min team size
		const totalTeamSize = 1 + uniqueMemberIds.length; // leader + members'
		if (!isSoloEvent) {
			if (totalTeamSize <= editingEvent.minTeamSize - 1) {
				toast.error(
					`Team must have at least ${editingEvent.minTeamSize} members (including leader)`,
				);
				return;
			}
			if (totalTeamSize > editingEvent.maxTeamSize) {
				toast.error(
					`Team cannot have more than ${editingEvent.maxTeamSize} members (including leader)`,
				);
				return;
			}
		}

		try {
			setCreating(true);

			const result = await createTeam({
				eventId: editingEvent.id,
				teamName: newTeamName,
				leaderId: leaderIdNum,
				memberIds: uniqueMemberIds,
				isConfirmed: newIsConfirmed,
			});

			if (!result.success) {
				toast.error(result.error || "Failed to create team");
				return;
			}

			toast.success("Team created successfully");
			setTeams((prev) => [...prev, result.data as Team]);

			// Reset form
			setNewTeamName("");
			setNewLeaderId("");
			setNewMemberIds("");
			setNewIsConfirmed(false);
			setCreateDialogOpen(false);
		} catch (err: any) {
			toast.error(err.message || "Failed to create team");
		} finally {
			setCreating(false);
		}
	}

	async function handleExport(format: "pdf" | "docx") {
		setExportLoading(true);
		try {
			const teamsToExport = filteredTeams.filter((t) => t.isConfirmed);
			if (format === "pdf") {
				exportTeamsForPrint(editingEvent, teamsToExport);
			} else {
				await exportParticipantsDocx(editingEvent, teamsToExport);
			}
		} finally {
			setExportLoading(false);
			setExportDialogOpen(false);
		}
	}

	return (
		<div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 min-h-screen">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
				<div>
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
						{editingEvent?.name ?? "Registered Teams"}
					</h1>
					<p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
						Track and manage participants
					</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
					<Button
						onClick={() => setExportDialogOpen(true)}
						className="w-full sm:w-auto bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg text-sm py-2"
					>
						<Download className="h-4 w-4 mr-2" />
						Export Signature Sheet
					</Button>
					<Button
						onClick={() => setDetailsExportDialogOpen(true)}
						className="w-full sm:w-auto bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 border border-blue-600 dark:border-blue-700 shadow-lg text-sm py-2"
					>
						<Download className="h-4 w-4 mr-2" />
						Export Team Details
					</Button>
					<Button
						onClick={() => exportEmails(teams)}
						className="w-full sm:w-auto bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg text-sm py-2"
					>
						Export Emails
					</Button>
					<ExportDialog
						open={exportDialogOpen}
						onOpenChange={setExportDialogOpen}
					>
						<ExportDialogContent className="w-[95vw] max-w-xs mx-auto">
							<div className="flex flex-col gap-4 items-center p-4">
								<h2 className="text-lg font-semibold mb-2">Export Format</h2>
								<Button
									className="w-full"
									disabled={exportLoading}
									onClick={() => handleExport("pdf")}
								>
									PDF
								</Button>
								<Button
									className="w-full"
									disabled={exportLoading}
									onClick={() => handleExport("docx")}
								>
									DOCX
								</Button>
							</div>
						</ExportDialogContent>
					</ExportDialog>
					<ExportDialog
						open={detailsExportDialogOpen}
						onOpenChange={setDetailsExportDialogOpen}
					>
						<ExportDialogContent className="w-[95vw] max-w-sm mx-auto">
							<div className="flex flex-col gap-4 items-center p-4">
								<h2 className="text-lg font-semibold mb-2">
									Export Team Details
								</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
									Comprehensive team export with member details, phone numbers,
									and year-wise sorting
								</p>
								<Button
									className="w-full"
									disabled={exportLoading}
									onClick={() => {
										exportTeamsDetailsPDF(editingEvent, teams, false);
										setDetailsExportDialogOpen(false);
									}}
								>
									Confirmed Teams Only
								</Button>
								<Button
									className="w-full"
									variant="outline"
									disabled={exportLoading}
									onClick={() => {
										exportTeamsDetailsPDF(editingEvent, teams, true);
										setDetailsExportDialogOpen(false);
									}}
								>
									All Teams (Confirmed + Unconfirmed)
								</Button>
							</div>
						</ExportDialogContent>
					</ExportDialog>
					<Button
						onClick={() => setCreateDialogOpen(true)}
						className="w-full sm:w-auto bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg text-sm py-2"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create Team
					</Button>
				</div>
			</div>

			{editingEvent?.statusOfBatchRestriction &&
				batchRestrictions.length > 0 && (
					<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{batchRestrictions.map(
							(batch: { year: number; maxCapacity: number }) => {
								const counts = teamCountsByYear[batch.year] || {
									confirmed: 0,
									total: 0,
									maxCapacity: batch.maxCapacity,
								};

								return (
									<Card
										key={batch.year}
										className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800"
									>
										<CardHeader className="pb-2 sm:pb-3">
											<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
												<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
													Year {batch.year}
												</CardTitle>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setYearFilter(
															yearFilter === batch.year ? "all" : batch.year,
														)
													}
													className={`text-xs sm:text-sm ${
														yearFilter === batch.year
															? "bg-blue-100 dark:bg-blue-900"
															: ""
													}`}
												>
													{yearFilter === batch.year ? "Show All" : "Filter"}
												</Button>
											</div>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="space-y-1 sm:space-y-2">
												<div className="flex justify-between text-xs sm:text-sm">
													<span>Confirmed:</span>
													<span className="font-semibold text-green-600">
														{counts.confirmed}
													</span>
												</div>
												<div className="flex justify-between text-xs sm:text-sm">
													<span>Total:</span>
													<span className="font-semibold">{counts.total}</span>
												</div>
												<div className="flex justify-between text-xs sm:text-sm">
													<span>Capacity:</span>
													<span className="font-semibold text-blue-600">
														{counts.maxCapacity}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								);
							},
						)}
					</div>
				)}

			<div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2">
				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-2 sm:pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
								Confirmed Teams
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="pt-0">
						{/* Total Confirmed Teams */}
						<div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
							{teams.filter((team) => team.isConfirmed).length}
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-2 sm:pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm sm:text-base text-gray-700 dark:text-slate-300">
								Unconfirmed Teams
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="pt-0">
						{/* Total Unconfirmed Teams */}
						<div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
							{teams.filter((team) => !team.isConfirmed).length}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
				<CardHeader className="pb-3 sm:pb-4">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
						<CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-slate-200">
							Registered Teams
						</CardTitle>
						<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
							{editingEvent?.statusOfBatchRestriction &&
								batchRestrictions.length > 0 && (
									<select
										value={yearFilter}
										onChange={(e) =>
											setYearFilter(
												e.target.value === "all"
													? "all"
													: Number(e.target.value),
											)
										}
										className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-200 w-full sm:w-auto"
									>
										<option value="all">All Years</option>
										{batchRestrictions.map((batch: { year: number }) => (
											<option key={batch.year} value={batch.year}>
												Year {batch.year}
											</option>
										))}
									</select>
								)}
							<div className="relative w-full sm:w-64">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
								<Input
									placeholder="Search teams..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 text-sm bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent className="px-0 sm:px-6">
					<div className="block sm:hidden space-y-3 px-4">
						{paginatedTeams.map((team: Team) => (
							<Card
								key={team.id}
								className="border border-gray-200 dark:border-slate-700"
							>
								<CardContent className="p-4">
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<h3 className="font-medium text-gray-900 dark:text-slate-200 text-sm break-words flex-1 mr-2">
												{team.name}
											</h3>
											<Badge
												className={`${
													team.isConfirmed
														? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
														: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
												} text-xs shrink-0`}
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
													{team.leaderName || "Unknown Leader"}
												</span>
											</div>
										</div>

										{editingEvent?.statusOfBatchRestriction && (
											<div>
												<span className="text-xs text-gray-500 dark:text-slate-400">
													Year:
												</span>
												<div className="mt-1">
													<span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
														{team.yearOfStudy || "N/A"}
													</span>
												</div>
											</div>
										)}

										<div>
											<span className="text-xs text-gray-500 dark:text-slate-400">
												Members:
											</span>
											<div className="flex flex-wrap gap-1 mt-1">
												{team.members.length > 0 ? (
													team.members.map((m) => (
														<span
															key={m.id}
															className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
														>
															{m.name}
														</span>
													))
												) : (
													<span className="text-xs text-gray-500 dark:text-slate-400">
														No members
													</span>
												)}
											</div>
										</div>

										<div className="pt-2 border-t border-gray-200 dark:border-slate-700">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedTeam(team)}
												className="w-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm"
											>
												Manage Team
											</Button>
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
										Team Name
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Leader
									</TableHead>
									{editingEvent?.statusOfBatchRestriction && (
										<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
											Year
										</TableHead>
									)}
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Members
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Status
									</TableHead>
									<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
										Edit
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedTeams.map((team: Team) => (
									<TableRow
										key={team.id}
										className="hover:bg-gray-50 dark:hover:bg-slate-900"
									>
										<TableCell className="font-medium">
											<div className="text-gray-900 dark:text-slate-200">
												{team.name}
											</div>
										</TableCell>

										<TableCell className="font-medium">
											<div className="text-gray-900 dark:text-slate-200">
												<span
													key={team.leaderName}
													className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
												>
													{team.leaderName || "Unknown Leader"}
												</span>
											</div>
										</TableCell>
										{editingEvent?.statusOfBatchRestriction && (
											<TableCell>
												<div className="text-gray-900 dark:text-slate-200">
													<span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
														{team.yearOfStudy || "N/A"}
													</span>
												</div>
											</TableCell>
										)}

										<TableCell>
											<div className="flex flex-wrap gap-2 text-gray-900 dark:text-slate-200">
												{team.members.length > 0
													? team.members.map((m) => (
															<span
																key={m.id}
																className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
															>
																{m.name}
															</span>
														))
													: "No members"}
											</div>
										</TableCell>

										<TableCell>
											<Badge
												className={`${
													team.isConfirmed
														? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
														: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
												} w-fit`}
											>
												{team.isConfirmed ? "Confirmed" : "Pending"}
											</Badge>
										</TableCell>

										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedTeam(team)}
												className="hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
											>
												. . .
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 sm:mt-6 px-4 sm:px-0">
						<Button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm py-2"
						>
							⬅ Prev
						</Button>
						<span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 order-first sm:order-none">
							Page {page} of {totalPages}
						</span>
						<Button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm py-2"
						>
							Next ➡
						</Button>
					</div>
				</CardContent>
			</Card>

			<Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
				<DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="pb-3 sm:pb-4">
						<DialogTitle className="text-base sm:text-lg break-words">
							Manage Team: {selectedTeam?.name || "Unknown"}
						</DialogTitle>
					</DialogHeader>

					{selectedTeam && (
						<div className="space-y-4">
							{/* Team Name */}
							<div>
								<Label htmlFor="team-name" className="text-sm">
									Team Name
								</Label>
								<Input
									id="team-name"
									value={teamNameInput}
									onChange={(e) => setTeamNameInput(e.target.value)}
									className="text-sm mt-1"
								/>
								<Button
									className="mt-2 w-full sm:w-auto text-sm py-2"
									variant="outline"
									onClick={handleUpdateTeamName}
								>
									Update Name
								</Button>
							</div>

							{/* Leader */}
							<div>
								<Label className="text-sm">Leader</Label>
								<div className="text-gray-900 dark:text-slate-200 pt-1 text-sm break-words">
									{selectedTeam.leaderName || "Unknown Leader"}
								</div>
							</div>

							{/* Members */}
							<div>
								<Label className="text-sm">Members</Label>
								<div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
									{selectedTeam.members
										.filter((member) => member.id !== selectedTeam.leaderId)
										.map((member) => (
											<div
												key={member.id}
												className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded"
											>
												<span className="text-sm break-words flex-1">
													{member.name}
												</span>
												<Button
													variant="default"
													size="sm"
													onClick={() =>
														handleMakeLeader(selectedTeam.id, member.id)
													}
													className="w-full sm:w-auto text-xs py-1"
												>
													Make Leader
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleRemoveMember(selectedTeam.id, member.id)
													}
													className="w-full sm:w-auto text-xs py-1"
												>
													Remove
												</Button>
											</div>
										))}
									{selectedTeam.members.filter(
										(member) => member.id !== selectedTeam.leaderId,
									).length === 0 && (
										<p className="text-sm text-gray-500 dark:text-slate-400">
											No additional members
										</p>
									)}
								</div>
							</div>

							{/* Add Member */}
							<div className="space-y-2">
								<Label className="text-sm">Add Member</Label>
								<div className="flex flex-col sm:flex-row gap-2">
									<Input
										placeholder="Enter member ID to add"
										value={addingMemberId}
										onChange={(e) => setAddingMemberId(e.target.value)}
										className="text-sm flex-1"
									/>
									<Button
										onClick={handleAddMember}
										className="w-full sm:w-auto text-sm py-2"
									>
										Add
									</Button>
								</div>
							</div>

							{/* Confirm Team Button */}
							{!selectedTeam.isConfirmed ? (
								<Button
									className="w-full text-sm py-2"
									variant="default"
									onClick={() => handleConfirmTeam(selectedTeam.id)}
								>
									Confirm Team
								</Button>
							) : (
								<Button
									className="w-full text-sm py-2"
									variant="secondary"
									onClick={() => handleUnConfirmTeam(selectedTeam.id)}
								>
									Unconfirm Team
								</Button>
							)}

							{/* Delete Team */}
							<Button
								variant="destructive"
								className="w-full text-sm py-2"
								onClick={() => handleDeleteTeam(selectedTeam.id)}
							>
								Remove Team
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="pb-3 sm:pb-4">
						<DialogTitle className="text-base sm:text-lg">
							Create New Team
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* Team Name */}
						{!isSoloEvent ? (
							<div>
								<Label htmlFor="new-team-name" className="text-sm">
									Team Name
								</Label>
								<Input
									id="new-team-name"
									placeholder="Enter team name"
									value={newTeamName}
									onChange={(e) => setNewTeamName(e.target.value)}
									className="text-sm mt-1"
								/>
							</div>
						) : null}

						{/* Leader ID */}
						<div>
							<Label htmlFor="new-leader-id" className="text-sm">
								{isSoloEvent ? "Member ID" : "Leader ID"}
							</Label>
							<Input
								id="new-leader-id"
								placeholder={
									isSoloEvent ? "Enter member ID" : "Enter leader ID"
								}
								type="number"
								value={newLeaderId}
								onChange={(e) => setNewLeaderId(e.target.value)}
								className="text-sm mt-1"
							/>
						</div>

						{/* Member IDs */}
						{!isSoloEvent ? (
							<div>
								<Label htmlFor="new-member-ids" className="text-sm">
									Member IDs
								</Label>
								<Input
									id="new-member-ids"
									placeholder="Comma-separated member IDs"
									value={newMemberIds}
									onChange={(e) => setNewMemberIds(e.target.value)}
									className="text-sm mt-1"
								/>
								<p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
									Enter member IDs separated by commas (e.g., 123, 456, 789)
								</p>
							</div>
						) : null}

						{/* Is Confirmed */}
						{!isSoloEvent ? (
							<div>
								<Label htmlFor="new-is-confirmed" className="text-sm">
									Is Confirmed
								</Label>
								<select
									id="new-is-confirmed"
									value={newIsConfirmed ? "true" : "false"}
									onChange={(e) => setNewIsConfirmed(e.target.value === "true")}
									className="w-full rounded-md border border-input bg-background p-2 text-sm mt-1"
								>
									<option value="false">False</option>
									<option value="true">True</option>
								</select>
							</div>
						) : null}

						{/* Create Team Button */}
						<Button
							className="w-full text-sm py-2 mt-6"
							onClick={handleCreateTeam}
							disabled={creating}
						>
							{creating ? "Creating..." : "Create Team"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
