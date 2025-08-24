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
	getTeamsForEvent,
	deleteTeam,
	updateTeamName,
	removeMemberFromTeam,
	addMemberToTeam,
	confirmTeam,
	createTeam,
	unConfirmTeam,
} from "~/actions/teams";
import { toast } from "sonner";

type Member = {
	id: number;
	name: string;
};

type Team = {
	id: string;
	name: string;
	leaderId?: number;
	isConfirmed: boolean;
	leaderName?: string;
	members: Member[];
};

type EventParticipantsProps = {
	editingEvent: any;
};

// Export printable table for teams and members
function exportTeamsForPrint(event: any, teams: Team[]) {
	console.log(event.name);
	const confirmedCount = teams.length;
	const html = `
	      <html>
	      <head>
		      <title>${event?.name ?? "Event Export"} - Attendance Sheet</title>
					<style>
									body { font-family: sans-serif; }
									table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
									th, td { border: 1px solid #333; padding: 8px; text-align: center; }
									th { background: #f3f3f3; }
									.nowrap { white-space: nowrap; }
									@media print {
										.page-break { page-break-before: always; break-before: page; }
									}
					</style>
	      </head>
	      <body>
		      <h2>${event?.name ?? "Event Export"} - Attendance Sheet</h2>
		      <table>
			      <thead>
				      <tr>
					      <th>Team Name</th>
					      <th>Leader Name</th>
						<th>FLC Id</th>
					      <th>Member Name</th>
					      <th>Signature</th>
				      </tr>
			      </thead>
			      <tbody>
				      ${teams
								.map((team) => {
									const members =
										team.members.length > 0
											? team.members
											: [{ name: "-", id: 0 }];
									return members
										.map(
											(member, idx) => `
					       <tr>
						       ${idx === 0 ? `<td rowspan="${members.length}" class="nowrap">${team.name}</td>` : ""}
						       ${idx === 0 ? `<td rowspan="${members.length}" class="nowrap">${team.leaderName || "-"}</td>` : ""}
							   <td class="nowrap">${member.id || "-"}</td>
						       <td class="nowrap">${member.name}</td>
						       <td style="min-width:120px;"></td>
					       </tr>
				       `,
										)
										.join("");
								})
								.join("")}
			      </tbody>
		      </table>
			  <div class="page-break">
				<h3 style="text-align:center">Summary</h3>
				<table>
				  <thead>
					  <tr>
						  <th>Teams Confirmed</th>
						  <th>Teams Attended</th>
					  </tr>
				  </thead>
				  <tbody>
					  <tr>
						  <td>${confirmedCount}</td>
						  <td></td>
					  </tr>
				  </tbody>
				</table>
				<br>
				<h3 style="text-align:center">Signatures</h3>
				<table>
				  <thead>
					  <tr>
						  <th>President</th>
						  <th>Vice President</th>
						  <th>Operations Manager</th>
						  <th>Faculty Coordinator</th>
					  </tr>
				  </thead>
				  <tbody>
					  <tr style="height: 60px;">
						  <td></td>
						  <td></td>
						  <td></td>
						  <td></td>
					  </tr>
				  </tbody>
				</table>
			  </div>
		      <script>window.print()</script>
	      </body>
	      </html>
       `;
	const win = window.open("", "_blank");
	if (win) {
		win.document.write(html);
		win.document.close();
	}
}

export function EventParticipants({ editingEvent }: EventParticipantsProps) {
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
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

	const filteredTeams = teams.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

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

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
						{editingEvent?.name ?? "Registered Teams"}
					</h1>
					<p className="text-gray-600 dark:text-slate-400">
						Track and manage participants
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() =>
							exportTeamsForPrint(
								editingEvent,
								filteredTeams.filter((t) => t.isConfirmed),
							)
						}
						className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg"
					>
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
					<Button
						onClick={() => setCreateDialogOpen(true)}
						className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create Team
					</Button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
								Confirmed Teams
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent>
						{/* Total Confirmed Teams */}
						<div className="text-2xl font-bold text-green-600 dark:text-green-400">
							{teams.filter((team) => team.isConfirmed).length}
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardHeader className="pb-3">
						<div className="flex justify-between items-center">
							<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
								Unconfirmed Teams
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent>
						{/* Total Unconfirmed Teams */}
						<div className="text-2xl font-bold text-red-600 dark:text-red-400">
							{teams.filter((team) => !team.isConfirmed).length}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
							Registered Teams
						</CardTitle>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
							<Input
								placeholder="Search teams..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 w-64 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table className="bg-white dark:bg-black text-gray-900 dark:text-slate-200">
						<TableHeader>
							<TableRow className="bg-gray-50 dark:bg-slate-900">
								<TableHead className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
									Team Name
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
									{/* Team Name */}
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

									{/* Members */}
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

									{/* Status */}
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

									{/* Actions */}
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

					{/* Pagination */}
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

			<Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							Manage Team: {selectedTeam?.name || "Unknown"}
						</DialogTitle>
					</DialogHeader>

					{selectedTeam && (
						<div className="space-y-4">
							{/* Team Name */}
							<div>
								<Label htmlFor="team-name">Team Name</Label>
								<Input
									id="team-name"
									value={teamNameInput}
									onChange={(e) => setTeamNameInput(e.target.value)}
								/>
								<Button
									className="mt-2"
									variant="outline"
									onClick={handleUpdateTeamName}
								>
									Update Name
								</Button>
							</div>

							{/* Leader */}
							<div>
								<Label>Leader</Label>
								<div className="text-gray-900 dark:text-slate-200 pt-1">
									{selectedTeam.leaderName || "Unknown Leader"}
								</div>
							</div>

							{/* Members */}
							<div>
								<Label>Members</Label>
								<ul className="space-y-2 mt-2">
									{selectedTeam.members
										.filter((member) => member.id !== selectedTeam.leaderId)
										.map((member) => (
											<li
												key={member.id}
												className="flex justify-between items-center"
											>
												<span>{member.name}</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleRemoveMember(selectedTeam.id, member.id)
													}
												>
													Remove
												</Button>
											</li>
										))}
								</ul>
							</div>

							{/* Add Member */}
							<div className="flex items-center space-x-2">
								<Input
									placeholder="Enter member ID to add"
									value={addingMemberId}
									onChange={(e) => setAddingMemberId(e.target.value)}
								/>
								<Button onClick={handleAddMember}>Add</Button>
							</div>

							{/* Confirm Team Button */}
							{!selectedTeam.isConfirmed ? (
								<Button
									className="w-full"
									variant="default"
									onClick={() => handleConfirmTeam(selectedTeam.id)}
								>
									Confirm Team
								</Button>
							) : (
								<Button
									className="w-full"
									variant="secondary"
									onClick={() => handleUnConfirmTeam(selectedTeam.id)}
								>
									Unconfirm Team
								</Button>
							)}

							{/* Delete Team */}
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => handleDeleteTeam(selectedTeam.id)}
							>
								Remove Team
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Create New Team</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* Team Name */}
						{!isSoloEvent ? (
							<div>
								<Label htmlFor="new-team-name">Team Name</Label>
								<Input
									id="new-team-name"
									placeholder="Enter team name"
									value={newTeamName}
									onChange={(e) => setNewTeamName(e.target.value)}
								/>
							</div>
						) : null}

						{/* Leader ID */}
						<div>
							<Label htmlFor="new-leader-id">
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
							/>
						</div>

						{/* Member IDs */}
						{!isSoloEvent ? (
							<div>
								<Label htmlFor="new-member-ids">Member IDs</Label>
								<Input
									id="new-member-ids"
									placeholder="Comma-separated member IDs"
									value={newMemberIds}
									onChange={(e) => setNewMemberIds(e.target.value)}
								/>
							</div>
						) : null}

						{/* Is Confirmed */}

						{!isSoloEvent ? (
							<div>
								<Label htmlFor="new-is-confirmed">Is Confirmed</Label>
								<select
									id="new-is-confirmed"
									value={newIsConfirmed ? "true" : "false"}
									onChange={(e) => setNewIsConfirmed(e.target.value === "true")}
									className="w-full rounded-md border border-input bg-background p-2 text-sm"
								>
									<option value="false">False</option>
									<option value="true">True</option>
								</select>
							</div>
						) : null}

						{/* Create Team Button */}

						<Button
							className="w-full"
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
