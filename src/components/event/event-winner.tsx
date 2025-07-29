"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { PrizeType } from "@prisma/client";
import { api } from "~/lib/api";
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
import { Search, Plus, X, Component } from "lucide-react";
import { Input } from "~/components/ui/input";
import { getTeamsForEvent } from "~/actions/teams";
import { toast } from "sonner";
import type { ExtendedEvent } from "~/actions/event";
import { ComponentLoading } from "~/components/ui/component-loading";
import { set } from "lodash";
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
	Prize: {
		prizeType: PrizeType;
		flcPoints: number;
	};
};

export function EventParticipants({
	editingEvent,
}: {
	editingEvent: ExtendedEvent;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [teams, setTeams] = useState<Team[]>([]);
	const [page, setPage] = useState(1);
	const pageSize = 10;
	// at the top
	const [newPrizesTeam, setNewPrizesTeam] = useState<Team[]>([]);

	// helper to replace or remove a team’s assignment
	function upsertPrizeAssignment(teamId: string, prizeType?: PrizeType) {
		setNewPrizesTeam((prev) => {
			// 1️⃣ remove any existing entry for this team
			const filtered = prev.filter((t) => t.id !== teamId);

			// 2️⃣ determine the actual prizeType: either what you passed,
			//    or fallback to PARTICIPATION
			const actualType = prizeType ?? PrizeType.PARTICIPATION;

			// 3️⃣ find the full Team object in your master list
			const original = teams.find((t) => t.id === teamId);
			if (!original) {
				console.warn(`Team with id ${teamId} not found`);
				return filtered;
			}

			// 4️⃣ clone & override only the prizeType
			const updated: Team = {
				...original,
				Prize: {
					...original.Prize,
					prizeType: actualType,
				},
			};

			// 5️⃣ return [ …filteredWithoutThisTeam, updatedTeam ]
			return [...filtered, updated];
		});
	}
	// to assign:
	function setSelectedTeamPrizeType(prizeType: PrizeType, team: Team) {
		if (!team?.id) return;
		upsertPrizeAssignment(team.id, prizeType);
	}

	// to remove:
	function removeSelectedTeamPrizeType(teamId: string) {
		if (!teamId) return;
		// you don’t actually need the prizeType here,
		// since upsert will remove by teamId
		upsertPrizeAssignment(teamId, PrizeType.PARTICIPATION);
	}

	// now, whenever you need to show your three lists, derive them from newPrizesTeam:
	const winnerTeams = newPrizesTeam.filter(
		(team) => team.Prize.prizeType === PrizeType.WINNER,
	);

	const runnerUpTeams = newPrizesTeam.filter(
		(team) => team.Prize.prizeType === PrizeType.RUNNER_UP,
	);

	const secondRunnerUpTeams = newPrizesTeam.filter(
		(team) => team.Prize.prizeType === PrizeType.SECOND_RUNNER_UP,
	);

	const [loading, setLoading] = useState(true);

	const loadTeams = useCallback(async () => {
		if (!editingEvent?.id) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const data = await getTeamsForEvent(editingEvent.id);
			const teamsWithPrize: Team[] = data.map((t: any) => ({
				...t,
				Prize: t.Prize ?? { prizeType: undefined, flcPoints: 0 },
			}));
			setTeams(teamsWithPrize);
			setNewPrizesTeam(teamsWithPrize);
		} catch (err) {
			console.error("Failed to load teams:", err);
			toast.error("Could not load teams.");
		} finally {
			setLoading(false);
		}
	}, [editingEvent?.id]);

	// 2️⃣ call on mount / event‑change
	useEffect(() => {
		loadTeams();
	}, [loadTeams]);

	// 2️⃣ Derive your three prize‑lists only once you actually have teams

	// biome-ignore lint/correctness/useExhaustiveDependencies: Needed to reset pagination
	useEffect(() => {
		setPage(1);
	}, [searchQuery]);

	const filteredTeams = newPrizesTeam.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const totalPages = Math.ceil(filteredTeams.length / pageSize);

	const paginatedTeams = filteredTeams.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);
	const assignedTeamIds = new Set(
		[...winnerTeams, ...runnerUpTeams, ...secondRunnerUpTeams].map(
			(team) => team.id,
		),
	);

	const participantTeams = teams.filter(
		(team) => team.isConfirmed && !assignedTeamIds.has(team.id),
	);

	const prizeTeamMap: Record<PrizeType, Team[]> = {
		[PrizeType.WINNER]: winnerTeams,
		[PrizeType.RUNNER_UP]: runnerUpTeams,
		[PrizeType.SECOND_RUNNER_UP]: secondRunnerUpTeams,
		[PrizeType.PARTICIPATION]: participantTeams,
	};

	const prizeRemoveMap: Record<PrizeType, (team: Team) => void> = {
		[PrizeType.WINNER]: (team) => removeSelectedTeamPrizeType(team.id),
		[PrizeType.RUNNER_UP]: (team) => removeSelectedTeamPrizeType(team.id),
		[PrizeType.SECOND_RUNNER_UP]: (team) =>
			removeSelectedTeamPrizeType(team.id),
		[PrizeType.PARTICIPATION]: () => {}, // no-op or optional logic
	};

	const prizeTypeMeta = {
		[PrizeType.WINNER]: {
			title: "Winner Teams",
			color: "green",
		},
		[PrizeType.RUNNER_UP]: {
			title: "Runner-Up Teams",
			color: "blue",
		},
		[PrizeType.SECOND_RUNNER_UP]: {
			title: "Second Runner-Up Teams",
			color: "purple",
		},
		[PrizeType.PARTICIPATION]: {
			title: "Participation Teams",
			color: "gray",
		},
	};
	function colorMapByMeta(color: string) {
		return (
			{
				green:
					"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
				blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
				purple:
					"bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
				gray: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
			}[color] ?? ""
		);
	}

	function colorMapByMeta2(color: string) {
		return (
			{
				green: "text-green-700 dark:text-green-300",
				blue: "text-blue-700 dark:text-blue-300",
				purple: "text-purple-700 dark:text-purple-300",
				gray: "text-gray-700 dark:text-gray-300",
			}[color] ?? ""
		);
	}
	function buttonColorByMeta(color: string) {
		return (
			{
				green:
					"text-green-500 border border-green-300 dark:text-green-900 dark:border-green-900 hover:bg-green-900 dark:hover:bg-green-100",
				blue: "text-blue-500 border border-blue-300 dark:text-blue-900 dark:border-blue-900 hover:bg-blue-900 dark:hover:bg-blue-100",
				purple:
					"text-purple-500 border border-purple-300 dark:text-purple-900 dark:border-purple-900 hover:bg-purple-900 dark:hover:bg-purple-100",
				gray: "text-gray-500 border border-gray-300 dark:text-gray-900 dark:border-gray-900 hover:bg-gray-900 dark:hover:bg-gray-100",
			}[color] ?? ""
		);
	}

	const savePrizeMutation = api.event.savePrize.useMutation({
		onSuccess: () => {
			toast.success("Prizes saved and FLC points updated!");
			// optionally refetch event/team data here if needed
			setLoading(true);
			loadTeams();
		},
		onError: (error) => {
			const message =
				typeof error === "object" && error && "message" in error
					? (error as { message?: string }).message
					: undefined;
			toast.error(message || "Failed to save prizes.");
		},
	});
	const handleSavePrizes = () => {
		// Build the “initial” array of Team objects that had a Prize on load:
		const initialPrizesTeam = teams.filter((t) => !!t.Prize?.prizeType);
		// A small helper to diff two Team‑arrays by comparing only id + prizeType:
		const assignmentsEqual = (a: Team[], b: Team[]) => {
			if (a.length !== b.length) return false;
			const sortFn = (x: Team, y: Team) =>
				x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
			const sa = [...a].sort(sortFn);
			const sb = [...b].sort(sortFn);
			return sa.every(
				(tA, idx) =>
					tA.id === sb[idx].id &&
					tA.Prize.prizeType === sb[idx].Prize.prizeType,
			);
		};

		// 3️⃣ Bail early if nothing changed
		if (assignmentsEqual(initialPrizesTeam, newPrizesTeam)) {
			toast.error("No Updates Are done");
			return;
		}

		// 4️⃣ (Optional) Ensure at least one in each category
		const countByType = (type: PrizeType) =>
			newPrizesTeam.filter((t) => t.Prize.prizeType === type).length;

		if (
			countByType(PrizeType.WINNER) === 0 ||
			countByType(PrizeType.RUNNER_UP) === 0 ||
			countByType(PrizeType.SECOND_RUNNER_UP) === 0
		) {
			toast.error(
				"Please assign at least one team as Winner, Runner-Up and Second Runner-Up.",
			);
			return;
		}

		// 5️⃣ Alright—fire the mutation
		savePrizeMutation.mutate({
			eventId: editingEvent.id,
			// strip down newPrizesTeam to only what the server expects:
			newPrizesTeam: newPrizesTeam.map((t) => ({
				teamId: t.id,
				prizeType: t.Prize.prizeType,
			})),
			teams,
		});
	};

	if (loading) {
		return <ComponentLoading message="Loading..." />;
	}
	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
						{editingEvent?.name ?? "Attended Teams"}
					</h1>
					<p className="text-gray-600 dark:text-slate-400">
						Assign Winners and Complete Event.
					</p>
				</div>
			</div>

			<div className="flex">
				<div className="w-1/2 bg-slate-200 dark:bg-slate-950 rounded-sm p-4">
					{/* Left Column */}
					<div className="grid gap-6 md:grid-cols-2">
						<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
							<CardHeader className="pb-3">
								<div className="flex justify-between items-center">
									<CardTitle className="text-sm text-gray-700 dark:text-slate-300">
										Attended Teams
									</CardTitle>
								</div>
							</CardHeader>

							<CardContent>
								{/* Total Attended Teams */}
								<div className="text-2xl font-bold text-green-600 dark:text-green-400">
									{teams.filter((team) => team.isConfirmed).length}
								</div>
							</CardContent>
						</Card>
					</div>
					<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
									Attended Teams
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
											Edit
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedTeams.map((team: Team) => (
										<TableRow
											key={team.id}
											className="hover:bg-transparent hover:text-inherit"
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

											{/* Actions */}
											<TableCell className="p-0 m-0 text-center">
												{/* This shows "Participation" below if not assigned */}
												{![
													...winnerTeams,
													...runnerUpTeams,
													...secondRunnerUpTeams,
												].some((t) => t.id === team.id) && (
													<Badge className="bg-gray-200 dark:bg-slate-800 text-xs text-gray-400 m-1">
														{PrizeType.PARTICIPATION}
													</Badge>
												)}
												<div className="flex flex-wrap justify-center items-center gap-1">
													{Object.entries(prizeTypeMeta)
														.filter(
															([type]) => type !== PrizeType.PARTICIPATION,
														)
														.map(([type, meta]) => {
															const assignedType = winnerTeams.find(
																(t) => t.id === team.id,
															)
																? PrizeType.WINNER
																: runnerUpTeams.find((t) => t.id === team.id)
																	? PrizeType.RUNNER_UP
																	: secondRunnerUpTeams.find(
																				(t) => t.id === team.id,
																			)
																		? PrizeType.SECOND_RUNNER_UP
																		: PrizeType.PARTICIPATION;

															const isThisType = assignedType === type;
															const isAssigned =
																assignedType !== PrizeType.PARTICIPATION;

															if (isAssigned && isThisType) {
																return (
																	<span
																		key={type}
																		className={`text-xs font-semibold rounded px-1.5 py-0.5 ${colorMapByMeta(meta.color)}`}
																	>
																		{meta.title}
																	</span>
																);
															}

															if (!isAssigned) {
																return (
																	<Button
																		key={type}
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			setSelectedTeamPrizeType(
																				type as PrizeType,
																				team,
																			)
																		}
																		className={`p-1 m-0 h-auto min-h-0 text-xs font-medium gap-0.5 ${buttonColorByMeta(meta.color)}`}
																	>
																		<Plus className="h-3 w-3" />
																	</Button>
																);
															}

															return null;
														})}
												</div>
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
				</div>

				{/* Selected event winners and prizes */}
				<div className="w-1/2 bg-slate-200 dark:bg-slate-950 rounded-sm p-4">
					{" "}
					{/* Right Column */}
					<div className="grid gap-2 md:grid-cols-3">
						{Object.values(PrizeType)
							.filter((type) => type !== PrizeType.PARTICIPATION)
							.map((type) => {
								const meta = prizeTypeMeta[type];
								return (
									<Card
										key={type}
										className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800 p-0 m-0"
									>
										<CardHeader className="pb-1 p-2">
											<div className="flex justify-between items-center">
												<CardTitle
													className={`text-xs text-gray-700 dark:text-slate-300 ${colorMapByMeta2(meta.color)}`}
												>
													{meta.title}
												</CardTitle>
											</div>
										</CardHeader>

										<CardContent>
											<div
												className={`text-2xl font-bold text-green-600 dark:text-green-400 ${colorMapByMeta2(meta.color)}`}
											>
												{prizeTeamMap[type].length}
											</div>
										</CardContent>
									</Card>
								);
							})}
					</div>
					{Object.values(PrizeType)
						.filter((type) => type !== PrizeType.PARTICIPATION)
						.map((type) => (
							<PrizeCard
								key={type}
								prizeType={type}
								teams={prizeTeamMap[type]}
								remove={prizeRemoveMap[type]}
							/>
						))}
				</div>
			</div>

			<div className="flex justify-end mt-6">
				<Button
					onClick={handleSavePrizes}
					disabled={savePrizeMutation.isPending}
					className="mt-4"
				>
					{savePrizeMutation.isPending ? "Saving..." : "Save Prizes"}
				</Button>
			</div>
		</div>
	);
}

type PrizeCardProps = {
	prizeType: PrizeType;
	teams: Team[];
	remove: (team: Team) => void;
};

const PrizeCard = ({ prizeType, teams, remove }: PrizeCardProps) => {
	const title = prizeType;

	return (
		<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle className="text-xl text-gray-900 dark:text-slate-200">
						{title}
					</CardTitle>
				</div>
			</CardHeader>

			<CardContent>
				<Table className="bg-white dark:bg-black text-gray-900 dark:text-slate-200">
					<TableHeader>
						<TableRow className="bg-gray-50 dark:bg-slate-900">
							<TableHead className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
								Team Name
							</TableHead>
							<TableHead className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
								Leader
							</TableHead>
							<TableHead className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
								Remove
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{teams.map((team: Team) => (
							<TableRow
								key={team.id}
								className="hover:bg-gray-50 dark:hover:bg-slate-900"
							>
								<TableCell className="font-medium text-gray-900 dark:text-slate-200">
									{team.name}
								</TableCell>
								<TableCell>
									<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
										{team.leaderName || "Unknown Leader"}
									</span>
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => remove(team)}
										className="hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
									>
										<X className="h-4 w-4 text-red-700 dark:text-red-300 bg-red-opacity-10" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
};
