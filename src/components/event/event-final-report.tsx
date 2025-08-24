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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search, Plus, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getTeamsForEvent } from "~/actions/teams";
import { getEventReportData } from "~/actions/report";
import { generateEventReport } from "~/lib/generate-event-report";
import type { PrizeType as PrismaHazeType } from "@prisma/client";

type Member = {
	id: number;
	name: string;
};

type Team = {
	id: string;
	name: string;
	leaderId?: number;
	isConfirmed: boolean;
	hasAttended: boolean;
	leaderName?: string;
	members: Member[];
	Prize?: {
		prizeType: PrismaHazeType | undefined;
		flcPoints: number | undefined;
	};
};

type PrizeType = {
	id: string;
	name: string;
	teams: Team[];
};

type EventFinalReportProps = {
	editingEvent: any;
	onBack: () => void;
};

export function EventFinalReport({
	editingEvent,
	onBack,
}: EventFinalReportProps) {
	const [participatingTeams, setParticipatingTeams] = useState<Team[]>([]);
	const [prizeTypes, setPrizeTypes] = useState<PrizeType[]>([
		{ id: "winners", name: "Winner", teams: [] },
		{ id: "runner-ups", name: "Runner Up", teams: [] },
		{ id: "second-runner-ups", name: "Second Runner Up", teams: [] },
	]);

	const [addPositionModal, setAddPositionModal] = useState(false);
	const [newPositionName, setNewPositionName] = useState("");
	const [addTeamModal, setAddTeamModal] = useState(false);
	const [selectedPrizeTypeId, setSelectedPrizeTypeId] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (editingEvent?.id) {
			getTeamsForEvent(editingEvent.id).then((teams) => {
				const attendedTeams = teams.filter(
					(team) => team.isConfirmed && team.hasAttended,
				);

				const initialPrizeTypes: PrizeType[] = [
					{ id: "winners", name: "Winner", teams: [] },
					{ id: "runner-ups", name: "Runner Up", teams: [] },
					{ id: "second-runner-ups", name: "Second Runner Up", teams: [] },
				];

				const participatingOnly: Team[] = [];

				attendedTeams.forEach((team) => {
					const teamData = team as Team;

					if (team.Prize?.prizeType === "WINNER") {
						initialPrizeTypes[0].teams.push(teamData);
					} else if (team.Prize?.prizeType === "RUNNER_UP") {
						initialPrizeTypes[1].teams.push(teamData);
					} else if (team.Prize?.prizeType === "SECOND_RUNNER_UP") {
						initialPrizeTypes[2].teams.push(teamData);
					} else {
						participatingOnly.push(teamData);
					}
				});

				setPrizeTypes(initialPrizeTypes);
				setParticipatingTeams(participatingOnly);
			});
		}
	}, [editingEvent.id]);

	const handleAddPosition = () => {
		if (!newPositionName.trim()) {
			toast.error("Position name is required");
			return;
		}

		const newPrizeType: PrizeType = {
			id: `custom-${Date.now()}`,
			name: newPositionName.trim(),
			teams: [],
		};

		setPrizeTypes((prev) => [...prev, newPrizeType]);
		setNewPositionName("");
		setAddPositionModal(false);
		toast.success("Position added successfully");
	};

	const handleAddTeam = (prizeTypeId: string) => {
		setSelectedPrizeTypeId(prizeTypeId);
		setAddTeamModal(true);
	};

	const handleSelectTeam = (team: Team) => {
		setParticipatingTeams((prev) => prev.filter((t) => t.id !== team.id));

		setPrizeTypes((prev) =>
			prev.map((prizeType) =>
				prizeType.id === selectedPrizeTypeId
					? { ...prizeType, teams: [...prizeType.teams, team] }
					: prizeType,
			),
		);

		setAddTeamModal(false);
		setSearchQuery("");
		toast.success(
			`Team added to ${prizeTypes.find((p) => p.id === selectedPrizeTypeId)?.name}`,
		);
	};

	const handleRemoveTeam = (prizeTypeId: string, teamId: string) => {
		const prizeType = prizeTypes.find((p) => p.id === prizeTypeId);
		const teamToRemove = prizeType?.teams.find((t) => t.id === teamId);

		if (!teamToRemove) return;

		if (teamToRemove.Prize?.prizeType) {
			toast.error("Cannot remove teams with existing prizes from database");
			return;
		}

		setPrizeTypes((prev) =>
			prev.map((prizeType) =>
				prizeType.id === prizeTypeId
					? {
							...prizeType,
							teams: prizeType.teams.filter((t) => t.id !== teamId),
						}
					: prizeType,
			),
		);

		setParticipatingTeams((prev) => [...prev, teamToRemove]);
		toast.success("Team moved back to participations");
	};

	const handleGenerateReport = async () => {
		try {
			toast.loading("Generating final report...");

			const reportData = await getEventReportData(editingEvent.id);

			if (!reportData.success || !reportData.data) {
				toast.error("Failed to generate report. No data available.");
				return;
			}

			const teamDataMap = new Map();
			reportData.data.forEach((team: any) => {
				teamDataMap.set(team.id, team);
			});

			const customPrizeTypes = prizeTypes
				.filter((p) => p.teams.length > 0)
				.map((prizeType) => ({
					...prizeType,
					teams: prizeType.teams.map((team) => {
						const teamWithUSN = teamDataMap.get(team.id);
						return {
							...team,
							members: team.members.map((member) => {
								const memberWithUSN = teamWithUSN?.members.find(
									(m: any) => m.id === member.id,
								);
								return {
									...member,
									usn: memberWithUSN?.usn || `USN${member.id}`,
									email: memberWithUSN?.email || "",
								};
							}),
						};
					}),
				}));

			const customParticipatingTeams = participatingTeams.map((team) => {
				const teamWithUSN = teamDataMap.get(team.id);
				return {
					...team,
					members: team.members.map((member) => {
						const memberWithUSN = teamWithUSN?.members.find(
							(m: any) => m.id === member.id,
						);
						return {
							...member,
							usn: memberWithUSN?.usn || `USN${member.id}`,
							email: memberWithUSN?.email || "",
						};
					}),
				};
			});

			const customReportData = {
				...reportData.data,
				customPrizeTypes: customPrizeTypes,
				participatingTeams: customParticipatingTeams,
			};

			const pdfDataUri = generateEventReport(
				editingEvent.name,
				customReportData,
			);

			const link = document.createElement("a");
			link.href = pdfDataUri;
			link.download = `${editingEvent.name.replace(/\s+/g, "-")}-Final-Report.pdf`;
			link.click();

			toast.dismiss();
			toast.success("Final report generated successfully");
		} catch (error) {
			console.error("Error generating final report:", error);
			toast.dismiss();
			toast.error("Failed to generate final report");
		}
	};

	const filteredParticipatingTeams = participatingTeams.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-4">
					<Button
						onClick={onBack}
						variant="ghost"
						className="hover:bg-gray-100 dark:hover:bg-slate-800"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
							Final Report - {editingEvent?.name}
						</h1>
						<p className="text-gray-600 dark:text-slate-400">
							Customize winners and generate final report
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() => setAddPositionModal(true)}
						className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg"
					>
						<Plus className="h-4 w-4 mr-2" />
						Add Position
					</Button>
					<Button
						onClick={handleGenerateReport}
						className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 shadow-lg"
					>
						<Download className="h-4 w-4 mr-2" />
						Generate Report
					</Button>
				</div>
			</div>

			{/* Prize Type Tables */}
			{prizeTypes.map((prizeType) => (
				<Card
					key={prizeType.id}
					className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800"
				>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
								{prizeType.name}
							</CardTitle>
							<Button
								onClick={() => handleAddTeam(prizeType.id)}
								size="sm"
								className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 border border-green-300 dark:border-green-800"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Team
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{prizeType.teams.length > 0 ? (
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
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{prizeType.teams.map((team) => (
										<TableRow
											key={team.id}
											className="hover:bg-gray-50 dark:hover:bg-slate-900"
										>
											<TableCell className="font-medium">
												<div className="text-gray-900 dark:text-slate-200">
													{team.name}
												</div>
											</TableCell>
											<TableCell>
												<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
													{team.leaderName || "Unknown Leader"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-2">
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
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleRemoveTeam(prizeType.id, team.id)
													}
													disabled={!!team.Prize?.prizeType}
													className={`${
														team.Prize?.prizeType
															? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
															: "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
													}`}
												>
													{team.Prize?.prizeType ? "Locked" : "Remove"}
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="text-center py-8 text-gray-500 dark:text-slate-400">
								No teams assigned to {prizeType.name.toLowerCase()}
							</div>
						)}
					</CardContent>
				</Card>
			))}

			<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
				<CardHeader>
					<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
						Participations
					</CardTitle>
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
							</TableRow>
						</TableHeader>
						<TableBody>
							{participatingTeams.map((team) => (
								<TableRow
									key={team.id}
									className="hover:bg-gray-50 dark:hover:bg-slate-900"
								>
									<TableCell className="font-medium">
										<div className="text-gray-900 dark:text-slate-200">
											{team.name}
										</div>
									</TableCell>
									<TableCell>
										<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
											{team.leaderName || "Unknown Leader"}
										</span>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-2">
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
										<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
											Participated
										</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={addPositionModal} onOpenChange={setAddPositionModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Add New Position</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="position-name">Position Name</Label>
							<Input
								id="position-name"
								placeholder="Enter position name (e.g., Best Innovation)"
								value={newPositionName}
								onChange={(e) => setNewPositionName(e.target.value)}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setAddPositionModal(false)}
							>
								Cancel
							</Button>
							<Button onClick={handleAddPosition}>Add Position</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={addTeamModal} onOpenChange={setAddTeamModal}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							Add Team to{" "}
							{prizeTypes.find((p) => p.id === selectedPrizeTypeId)?.name}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
							<Input
								placeholder="Search teams..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="max-h-96 overflow-y-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Team Name</TableHead>
										<TableHead>Leader</TableHead>
										<TableHead>Members</TableHead>
										<TableHead>Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredParticipatingTeams.map((team) => (
										<TableRow key={team.id}>
											<TableCell className="font-medium">{team.name}</TableCell>
											<TableCell>
												<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
													{team.leaderName || "Unknown Leader"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{team.members.length > 0
														? team.members.slice(0, 2).map((m) => (
																<span
																	key={m.id}
																	className="px-1 py-0.5 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
																>
																	{m.name}
																</span>
															))
														: "No members"}
													{team.members.length > 2 && (
														<span className="text-xs text-gray-500">
															+{team.members.length - 2} more
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Button
													size="sm"
													onClick={() => handleSelectTeam(team)}
													className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
												>
													Select
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{filteredParticipatingTeams.length === 0 && (
								<div className="text-center py-8 text-gray-500 dark:text-slate-400">
									No teams found
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
