"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

const searchItems = [
	{ title: "Dashboard", category: "Pages", id: "dashboard" },
	{ title: "Events", category: "Pages", id: "events" },
	{ title: "Blogs", category: "Pages", id: "blogs" },
	{ title: "Gallery", category: "Pages", id: "gallery" },
	{ title: "Payments", category: "Pages", id: "payments" },
	{ title: "Users", category: "Pages", id: "users" },
	{ title: "Settings", category: "Pages", id: "settings" },
];

interface GlobalSearchProps {
	setActivePage: (page: string) => void;
}

export function GlobalSearch({ setActivePage }: GlobalSearchProps) {
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const filteredItems = searchItems.filter((item) =>
		item.title.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleSelect = (id: string) => {
		setActivePage(id);
		setOpen(false);
		setSearchTerm("");
	};

	return (
		<>
			<div className="relative max-w-md">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search everything..."
					className="pl-10"
					onClick={() => setOpen(true)}
				/>
			</div>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<div className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Search pages..."
								className="pl-10"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							{filteredItems.length > 0 ? (
								filteredItems.map((item) => (
									<button
										key={item.title}
										type="button"
										className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer focus:outline-none"
										onClick={() => handleSelect(item.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												handleSelect(item.id);
											}
										}}
									>
										{item.title}
									</button>
								))
							) : (
								<div className="p-2 text-gray-500 text-center">
									No results found
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
