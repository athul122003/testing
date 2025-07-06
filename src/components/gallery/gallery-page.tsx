"use client";

import { Edit, Filter, ImageIcon, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

const initialImages = [
	{
		id: 1,
		title: "Tech Conference Opening Ceremony",
		year: "2024",
		date: "2024-01-15",
		url: "/placeholder.svg?height=300&width=400",
		category: "Events",
	},
	{
		id: 2,
		title: "Workshop Session - React Fundamentals",
		year: "2024",
		date: "2024-01-10",
		url: "/placeholder.svg?height=300&width=400",
		category: "Workshops",
	},
	{
		id: 3,
		title: "Team Building Activity",
		year: "2023",
		date: "2023-12-20",
		url: "/placeholder.svg?height=300&width=400",
		category: "Activities",
	},
	{
		id: 4,
		title: "Annual Awards Ceremony",
		year: "2023",
		date: "2023-11-15",
		url: "/placeholder.svg?height=300&width=400",
		category: "Events",
	},
];

export function GalleryPage() {
	const [images, setImages] = useState(initialImages);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [selectedYear, setSelectedYear] = useState("all");
	const [formData, setFormData] = useState({
		title: "",
		year: "2024",
		date: "",
		category: "Events",
	});

	const years = ["2024", "2023", "2022", "2021"];
	const categories = ["Events", "Workshops", "Activities", "Competitions"];

	const filteredImages =
		selectedYear === "all"
			? images
			: images.filter((img) => img.year === selectedYear);

	const handleAddImage = () => {
		const newImage = {
			id: images.length + 1,
			title: formData.title,
			year: formData.year,
			date: formData.date,
			url: "/placeholder.svg?height=300&width=400",
			category: formData.category,
		};
		setImages([...images, newImage]);
		setIsAddOpen(false);
		setFormData({ title: "", year: "2024", date: "", category: "Events" });
	};

	const handleDeleteImage = (id: number) => {
		setImages(images.filter((img) => img.id !== id));
	};

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-slate-200 mb-2">
						Gallery
					</h1>
					<p className="text-gray-600 dark:text-slate-400">
						Manage your image collection
					</p>
				</div>
				<div className="flex gap-3">
					<Select value={selectedYear} onValueChange={setSelectedYear}>
						<SelectTrigger className="w-40 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Filter by year" />
						</SelectTrigger>
						<SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
							<SelectItem value="all">All Years</SelectItem>
							{years.map((year) => (
								<SelectItem key={year} value={year}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
						<DialogTrigger asChild>
							<Button className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800 shadow-lg">
								<Plus className="h-4 w-4 mr-2" />
								Add Image
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
							<DialogHeader>
								<DialogTitle className="text-2xl text-gray-900 dark:text-slate-200">
									Add New Image
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-6">
								<div className="space-y-2">
									<Label
										htmlFor="image-title"
										className="text-gray-900 dark:text-slate-200"
									>
										Title
									</Label>
									<Input
										id="image-title"
										placeholder="Enter image title"
										value={formData.title}
										onChange={(e) =>
											setFormData({ ...formData, title: e.target.value })
										}
										className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-400"
									/>
								</div>

								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label className="text-gray-900 dark:text-slate-200">
											Year
										</Label>
										<Select
											value={formData.year}
											onValueChange={(value) =>
												setFormData({ ...formData, year: value })
											}
										>
											<SelectTrigger className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
												{years.map((year) => (
													<SelectItem key={year} value={year}>
														{year}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor="date"
											className="text-gray-900 dark:text-slate-200"
										>
											Date
										</Label>
										<Input
											id="date"
											type="date"
											value={formData.date}
											onChange={(e) =>
												setFormData({ ...formData, date: e.target.value })
											}
											className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]
                                             [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 
                                             dark:[&::-webkit-calendar-picker-indicator]:invert-[0.7]"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-gray-900 dark:text-slate-200">
											Category
										</Label>
										<Select
											value={formData.category}
											onValueChange={(value) =>
												setFormData({ ...formData, category: value })
											}
										>
											<SelectTrigger className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-200">
												{categories.map((category) => (
													<SelectItem key={category} value={category}>
														{category}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-gray-900 dark:text-slate-200">
										Upload Image
									</Label>
									<div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-slate-600 transition-colors cursor-pointer bg-gray-50 dark:bg-slate-900/50">
										<ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-slate-400" />
										<p className="text-gray-600 dark:text-slate-400">
											Click to upload image
										</p>
										<p className="text-sm text-gray-500 dark:text-slate-500">
											PNG, JPG up to 10MB
										</p>
									</div>
								</div>

								<div className="flex justify-end space-x-3">
									<Button
										variant="outline"
										onClick={() => setIsAddOpen(false)}
										className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
									>
										Cancel
									</Button>
									<Button
										onClick={handleAddImage}
										className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-800"
									>
										Add Image
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{filteredImages.map((image) => (
					<Card
						key={image.id}
						className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 group"
					>
						<div className="relative overflow-hidden">
							<Image
								width={400}
								height={300}
								src={image.url || "/placeholder.svg"}
								alt={image.title}
								className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
							<div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<Button
									variant="secondary"
									size="sm"
									className="bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100/90 dark:hover:bg-slate-800/90 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-800 shadow-lg"
								>
									<Edit className="h-4 w-4" />
								</Button>
								<Button
									variant="secondary"
									size="sm"
									className="bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100/90 dark:hover:bg-slate-800/90 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-800 shadow-lg"
									onClick={() => handleDeleteImage(image.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
							<div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-medium text-gray-900 dark:text-slate-200">
								{image.category}
							</div>
						</div>
						<CardContent className="p-4">
							<h3 className="font-bold text-gray-900 dark:text-slate-200 mb-2 line-clamp-2">
								{image.title}
							</h3>
							<p className="text-sm text-gray-600 dark:text-slate-400">
								{new Date(image.date).toLocaleDateString()} • {image.year}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{filteredImages.length === 0 && (
				<Card className="shadow-lg bg-white dark:bg-black border border-gray-200 dark:border-slate-800">
					<CardContent className="text-center py-12">
						<ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-slate-400" />
						<p className="text-gray-600 dark:text-slate-400 text-lg">
							{selectedYear === "all"
								? "No images in gallery yet"
								: `No images found for ${selectedYear}`}
						</p>
						<p className="text-gray-500 dark:text-slate-500">
							{selectedYear === "all"
								? "Add your first image to get started!"
								: "Try selecting a different year."}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
