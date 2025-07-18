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
import { TrendingUp } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	getTeamsForEvent,
	deleteTeam,
	updateTeamName,
	removeMemberFromTeam,
	addMemberToTeam,
} from "~/actions/teams";
import { toast } from "sonner";

type Member = {
	id: number;
	name: string;
};

type Team = {
	id: string;
	name: string;
	isConfirmed: boolean;
	leaderName?: string; // Optional, if leader is not always present
	members: Member[];
};

type EventParticipantsProps = {
	editingEvent: any; // TODO: strongly type later
};

export function EventParticipants({ editingEvent }: EventParticipantsProps) {
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [teams, setTeams] = useState<Team[]>([]);
	const [teamNameInput, setTeamNameInput] = useState("");
	const [addingMemberId, setAddingMemberId] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	useEffect(() => {
		if (editingEvent?.id) {
			getTeamsForEvent(editingEvent.id).then(setTeams);
		}
	}, [editingEvent.id]);

	useEffect(() => {
		if (selectedTeam) setTeamNameInput(selectedTeam.name);
	}, [selectedTeam]);

	const filteredTeams = teams.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const totalPages = Math.ceil(filteredTeams.length / pageSize);

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
			const updatedTeam = {
				...selectedTeam!,
				members: selectedTeam!.members.filter((m) => m.id !== userId),
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
							{filteredTeams.map((team: Team) => (
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
									{selectedTeam.members.map((member) => (
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

							{/* Add Member (disabled placeholder) */}
							<div className="flex items-center space-x-2">
								<Input
									placeholder="Add new member"
									value={addingMemberId}
									onChange={(e) => setAddingMemberId(e.target.value)}
								/>
								<Button onClick={handleAddMember}>Add</Button>
							</div>

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
		</div>
	);
}
