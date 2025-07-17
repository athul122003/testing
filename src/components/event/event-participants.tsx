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
import { getTeamsForEvent } from "~/actions/teams";

type Team = {
	id: string;
	name: string;
	members: string[];
};

type EventParticipantsProps = {
	// biome-ignore lint/suspicious/noExplicitAny: FIX THIS LATER
	editingEvent: any;
};

export function EventParticipants({ editingEvent }: EventParticipantsProps) {
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [teams, setTeams] = useState<Team[]>([]);

	useEffect(() => {
		const fetchTeams = async () => {
			const fetched = await getTeamsForEvent(editingEvent.id);
			setTeams(fetched);
		};

		fetchTeams();
	}, [editingEvent.id]);

	const filteredTeams = teams.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="min-h-screen p-8 ">
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

			{/* Team Cards */}
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

			{/* Modal */}
			<Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							Manage Team: {selectedTeam?.name || "Unknown"}
						</DialogTitle>
					</DialogHeader>
					{selectedTeam && (
						<div className="space-y-4">
							<div>
								<Label htmlFor="team-name">Team Name</Label>
								<Input id="team-name" defaultValue={selectedTeam.name} />
							</div>

							<div>
								<Label>Members</Label>
								<ul className="space-y-2 mt-2">
									{selectedTeam.members.map((member) => (
										<li
											key={member}
											className="flex justify-between items-center"
										>
											<span>{member}</span>
											<Button variant="outline" size="sm">
												Remove
											</Button>
										</li>
									))}
								</ul>
							</div>

							<div className="flex items-center space-x-2">
								<Input placeholder="Add new member" />
								<Button>Add</Button>
							</div>

							<Button variant="destructive" className="w-full">
								Remove Team
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
