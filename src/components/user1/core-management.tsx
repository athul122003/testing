"use client";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Check,
	Edit,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ComponentLoading } from "~/components/ui/component-loading";
import { Input } from "~/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "~/components/ui/dialog";
import {
	CoreMemberType,
	useAddToCoreMutation,
	useCoreMembersQuery,
} from "~/actions/tanstackHooks/core-queries";
import { Label } from "~/components/ui/label";

type CoreSortByType = "position" | "name" | "id" | "priority" | "year";
type CoreType = "FACULTY_COORDINATOR" | "OFFICE_BEARER";

// type CoreUsersType = {
//   userId: number;
//   name: string;
//   email: string;
//   position: string;
//   year: string;
// };

export default function CoreManagement() {
	//   const [coreLoading, setCoreLoading] = useState(true);

	//   const [selectedCorePosition, setSelectedCorePosition] = useState<
	//     string | null
	//   >(null);
	const [coreSearchTerm, setCoreSearchTerm] = useState("");
	const [coreSortBy, setCoreSortBy] = useState<CoreSortByType>("position");
	const [coreSortOrder, setCoreSortOrder] = useState<"asc" | "desc">("asc");
	const [corePage, setCorePage] = useState(1);
	const [selectedCoreUsers, setSelectedCoreUsers] = useState<CoreMemberType[]>(
		[],
	);
	const [editCoreMember, setEditCoreMember] = useState<CoreMemberType | null>(
		null,
	);
	const [showActionModal, setShowActionModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	//   const [corePositions, setCorePositions] = useState<
	//     { id: string; name: string }[]
	//   >([]);
	//   const [coreMembers, setCoreMembers] = useState<CoreMemberType[]>([]);
	//   useEffect(() => {
	//     const fetchCoreMembers = async () => {
	//       const res = await getCoreMembers();
	//       if (!res) {
	//         toast.error("Failed to fetch core members");
	//         return;
	//       }
	//       const coreData = res;
	//       setCoreMembers(coreData);
	//     };
	//     fetchCoreMembers();
	//     setCoreLoading(false);
	//   }, []);

	//core page data
	const { data: corePageResponse, isLoading: coreLoading } =
		useCoreMembersQuery({
			page: corePage,
			pageSize: 15,
		});
	const totalPages = corePageResponse?.totalPages || 1;
	const coreMembers = corePageResponse?.coreMembers || [];

	const filteredMembers = useMemo(() => {
		let filtered: CoreMemberType[] = coreMembers;

		//Filter by search term
		if (coreSearchTerm.trim() !== "") {
			const term = coreSearchTerm.toLowerCase();
			filtered = filtered.filter((member) =>
				[
					member.User.name.toLowerCase(),
					member.User.email.toLowerCase(),
					member.userId.toString(),
					member.position.toLowerCase(),
					member.type.toLowerCase(),
					member.year.toLowerCase(),
				].some((field) => field.includes(term)),
			);
		}

		//filter by position
		// if (selectedCorePosition) {
		//   filtered = filtered.filter(
		//     (member) => member.position === selectedCorePosition
		//   );
		// }

		// sorting
		filtered.sort((a, b) => {
			let aVal: string | number = "";
			let bVal: string | number = "";

			switch (coreSortBy) {
				case "position":
					aVal = a.position;
					bVal = b.position;
					break;
				case "name":
					aVal = a.User.name;
					bVal = b.User.name;
					break;
				case "id":
					aVal = a.userId;
					bVal = b.userId;
					break;
				case "priority":
					aVal = a.priority;
					bVal = b.priority;
					break;
				case "year":
					aVal = a.year;
					bVal = b.year;
					break;
			}

			if (typeof aVal === "string" && typeof bVal === "string") {
				return coreSortOrder === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			} else {
				return coreSortOrder === "asc"
					? (aVal as number) - (bVal as number)
					: (bVal as number) - (aVal as number);
			}
		});

		return filtered;
	}, [coreMembers, coreSearchTerm, coreSortBy, coreSortOrder]);

	const { mutate: updateCoreMutation, isPending: isUpdatingCore } =
		useAddToCoreMutation({
			onSuccessCallback: () => {
				setShowActionModal(false);
			},
		});

	const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editCoreMember) return;
		const formData = new FormData(event.currentTarget);
		formData.set("userIds", JSON.stringify([editCoreMember.userId]));
		formData.set("coreId", editCoreMember.id || "");
		updateCoreMutation(formData);
	};

	return (
		<>
			<Card className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 shadow-xl">
				{coreLoading ? (
					<ComponentLoading message="Loading Core Team..." />
				) : (
					<>
						<CardHeader>
							<CardTitle className="text-gray-900 dark:text-slate-200">
								Core Management
							</CardTitle>
							<CardDescription className="text-gray-600 dark:text-slate-400">
								Manage core team positions and responsibilities.
							</CardDescription>
						</CardHeader>

						<CardContent className="grid gap-4">
							<div className="grid gap-2">
								<div className="flex justify-between items-center mb-4">
									<div className="flex items-center gap-4 flex-wrap">
										{/*Search */}
										<div className="relative">
											<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
											<Input
												placeholder="Search by name, ID, or email..."
												value={coreSearchTerm}
												onChange={(e) => setCoreSearchTerm(e.target.value)}
												className="pl-10 w-80 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
											/>
										</div>

										{/*Position Filter */}
										{/* <Select
                      value={selectedCorePosition ?? "all"}
                      onValueChange={(val) =>
                        setSelectedCorePosition(val === "all" ? null : val)
                      }
                    >
                      <SelectTrigger className="w-52 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
                        <SelectValue placeholder="All Core Positions" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
                        <SelectItem value="all">All Positions</SelectItem>
                        {corePositions.map((position) => (
                          <SelectItem key={position.id} value={position.name}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}

										{/*Sort Dropdown */}
										<Select
											value={coreSortBy}
											onValueChange={(val) =>
												setCoreSortBy(
													val as
														| "position"
														| "priority"
														| "name"
														| "id"
														| "year",
												)
											}
										>
											<SelectTrigger className="w-40 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
												<SelectValue placeholder="Sort by..." />
											</SelectTrigger>
											<SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
												<SelectItem value="position">Position</SelectItem>
												<SelectItem value="name">Name</SelectItem>
												<SelectItem value="id">ID</SelectItem>
												<SelectItem value="priority">Priority</SelectItem>
												<SelectItem value="year">Year</SelectItem>
											</SelectContent>
										</Select>

										{/* ↕️ Sort Direction */}
										<Button
											variant="outline"
											onClick={() =>
												setCoreSortOrder((prev) =>
													prev === "asc" ? "desc" : "asc",
												)
											}
											className="flex items-center gap-2 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
										>
											{coreSortOrder === "asc" ? (
												<ArrowDownAZ className="h-4 w-4" />
											) : (
												<ArrowUpAZ className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							</div>

							<Separator className="bg-gray-200 dark:bg-slate-800" />

							<div className="grid gap-2">
								{coreMembers?.length ? (
									<Table className="bg-white dark:bg-black text-gray-900 dark:text-slate-200">
										<TableHeader>
											<TableRow className="bg-gray-50 dark:bg-slate-900">
												<TableHead />
												<TableHead>ID</TableHead>
												<TableHead>Name</TableHead>
												<TableHead>Email</TableHead>
												<TableHead>Position</TableHead>
												<TableHead>Year</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredMembers.map((member) => (
												<TableRow
													onClick={() => {
														setEditCoreMember(member);
														setShowActionModal(true);
													}}
													key={member.id}
													className="hover:bg-gray-50 dark:hover:bg-slate-900"
												>
													<TableCell>
														<Checkbox
															checked={selectedCoreUsers.some(
																(u) => u.userId === member.userId,
															)}
															onCheckedChange={(checked) =>
																setSelectedCoreUsers((prev) =>
																	checked
																		? [...prev, member]
																		: prev.filter(
																				(u) => u.userId !== member.userId,
																			),
																)
															}
														/>
													</TableCell>
													<TableCell className="font-mono text-sm text-gray-500 dark:text-slate-400">
														{member.userId}
													</TableCell>
													<TableCell>{member.User.name}</TableCell>
													<TableCell>{member.User.email}</TableCell>
													<TableCell>
														<Badge className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800">
															{member.position}
														</Badge>
													</TableCell>
													<TableCell>{member.year}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									!coreLoading && (
										<div className="text-center py-8 text-gray-500 dark:text-slate-400">
											No core members found.
										</div>
									)
								)}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<Pagination className="mt-6">
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												onClick={() =>
													corePage > 1 && setCorePage(corePage - 1)
												}
												className={
													corePage === 1
														? "pointer-events-none opacity-50"
														: "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
												}
											/>
										</PaginationItem>

										{(() => {
											const pages = [];
											const total = totalPages;
											const maxVisible = 3;

											pages.push(
												<PaginationItem key={1}>
													<PaginationLink
														isActive={corePage === 1}
														onClick={() => setCorePage(1)}
														className="cursor-pointer"
													>
														1
													</PaginationLink>
												</PaginationItem>,
											);

											if (corePage > maxVisible) {
												pages.push(
													<PaginationItem key="left-ellipsis">
														<span className="px-2 text-gray-500 dark:text-slate-400">
															...
														</span>
													</PaginationItem>,
												);
											}

											const start = Math.max(2, corePage - 1);
											const end = Math.min(total - 1, corePage + 1);
											for (let i = start; i <= end; i++) {
												pages.push(
													<PaginationItem key={i}>
														<PaginationLink
															isActive={corePage === i}
															onClick={() => setCorePage(i)}
															className="cursor-pointer"
														>
															{i}
														</PaginationLink>
													</PaginationItem>,
												);
											}

											if (corePage < total - 2) {
												pages.push(
													<PaginationItem key="right-ellipsis">
														<span className="px-2 text-gray-500 dark:text-slate-400">
															...
														</span>
													</PaginationItem>,
												);
											}

											if (total > 1) {
												pages.push(
													<PaginationItem key={total}>
														<PaginationLink
															isActive={corePage === total}
															onClick={() => setCorePage(total)}
															className="cursor-pointer"
														>
															{total}
														</PaginationLink>
													</PaginationItem>,
												);
											}

											return pages;
										})()}

										<PaginationItem>
											<PaginationNext
												onClick={() =>
													corePage < totalPages && setCorePage(corePage + 1)
												}
												className={
													corePage === totalPages
														? "pointer-events-none opacity-50"
														: "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
												}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							)}
						</CardContent>
					</>
				)}

				<Dialog open={showActionModal} onOpenChange={setShowActionModal}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Member</DialogTitle>
						</DialogHeader>
						{editCoreMember && (
							<form className="space-y-4" onSubmit={handleSave}>
								<input
									type="hidden"
									name="userIds"
									value={JSON.stringify([editCoreMember.userId])}
								/>

								<div className="space-y-1">
									<Label>Name</Label>
									<p className="text-sm">{editCoreMember.User.name}</p>
								</div>

								<div className="space-y-1">
									<Label>Email</Label>
									<p className="text-sm">{editCoreMember.User.email}</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="position">Position</Label>
									<Input
										id="position"
										name="position"
										value={editCoreMember.position}
										onChange={(e) =>
											setEditCoreMember({
												...editCoreMember,
												position: e.target.value,
											})
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="type">Type</Label>
									<select
										id="type"
										name="type"
										value={editCoreMember.type}
										onChange={(e) =>
											setEditCoreMember({
												...editCoreMember,
												type: e.target.value as CoreType,
											})
										}
										className="w-full border border-gray-300 rounded px-2 py-1"
									>
										<option value="FACULTY_COORDINATOR">
											FACULTY COORDINATOR
										</option>
										<option value="OFFICE_BEARER">OFFICE BEARER</option>
									</select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="year">Year</Label>
									<Input
										id="year"
										name="year"
										value={editCoreMember.year}
										onChange={(e) =>
											setEditCoreMember({
												...editCoreMember,
												year: e.target.value,
											})
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="priority">Priority</Label>
									<Input
										id="priority"
										name="priority"
										type="number"
										value={editCoreMember.priority || ""}
										onChange={(e) =>
											setEditCoreMember({
												...editCoreMember,
												priority: Number(e.target.value),
											})
										}
									/>
								</div>

								<DialogFooter className="pt-4">
									<Button
										variant="outline"
										type="button"
										onClick={() => setShowActionModal(false)}
									>
										Cancel
									</Button>
									<Button type="submit">Save</Button>
								</DialogFooter>
							</form>
						)}
					</DialogContent>
				</Dialog>
			</Card>
		</>
	);
}
