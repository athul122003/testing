"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	getTeamsForEvent,
	deleteTeam,
	updateTeamName,
	removeMemberFromTeam,
} from "~/actions/teams";
import { toast } from "sonner";

type Member = {
	id: number;
	name: string;
};

type Team = {
	id: string;
	name: string;
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
	const [addingMemberName, setAddingMemberName] = useState("");

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

	return (
		<div className="min-h-screen p-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-4xl font-semibold">
					{editingEvent?.name ?? "Registered Teams"}
				</h1>
				<Input
					placeholder="Search teams"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="max-w-xs"
				/>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredTeams.map((team) => (
					<Card
						key={team.id}
						className="hover:shadow-xl cursor-pointer"
						onClick={() => setSelectedTeam(team)}
					>
						<CardContent className="p-4">
							<h2 className="text-lg font-medium mb-2">{team.name}</h2>
							<p className="text-sm text-muted-foreground">
								{team.members.length} members
							</p>
						</CardContent>
					</Card>
				))}
			</div>

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
									placeholder="Add new member (disabled for now)"
									value={addingMemberName}
									onChange={(e) => setAddingMemberName(e.target.value)}
									disabled
								/>
								<Button disabled>Add</Button>
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
