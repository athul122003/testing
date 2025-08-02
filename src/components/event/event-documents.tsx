"use client";

import { useState, useEffect, useRef } from "react";
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
import {
	Download,
	Upload,
	Plus,
	FileText,
	Calendar,
	Trash2,
	ViewIcon,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileToGoogleDrive } from "~/lib/googleDrive";
import { api } from "~/lib/api";
import { createEventDoc, deleteEventDoc, getEventDocs } from "~/actions/event";
import type { ExtendedEvent } from "~/actions/event";

type Document = {
	id: string;
	name: string;
	url: string;
	fileType?: string;
	fileSize?: number;
	createdAt?: Date;
};

export function EventDocuments(editingEvent: any) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(false);
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [fileName, setFileName] = useState<string | null>("");
	const [fileDescription, setFileDescription] = useState<string | null>("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const event = editingEvent.editingEvent || null;

	const getDocuments = async () => {
		try {
			setLoading(true);
			console.log("Fetching documents for event:", event.id);
			const eventDocs = await getEventDocs(event.id);
			if (eventDocs.success) {
				setDocuments(
					(eventDocs.data || []).map((doc) => ({
						...doc,
						fileType: doc.fileType ?? undefined,
						fileSize: doc.fileSize ?? undefined,
						createdAt: doc.createdAt ?? undefined,
					})),
				);
			} else {
				toast.error(eventDocs.error || "Failed to load documents");
			}
		} catch (error) {
			console.error("Error fetching event documents:", error);
			toast.error("Failed to load documents");
		} finally {
			setLoading(false);
		}
	};

	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleUploadClick = () => {
		if (inputRef.current) {
			inputRef.current.value = "";
			inputRef.current.click();
		}
	};

	const handleUpload = async () => {
		const file = selectedFile;
		if (!file) {
			toast.error("Please select a file to upload");
			return;
		}

		try {
			setUploading(true);
			const response = await createEventDoc(
				event.id,
				file,
				fileName || file.name,
				fileDescription || "",
			);
			if (!response.success) {
				throw new Error(response.error || "Failed to upload file");
			}
			toast.success("File uploaded successfully");
			if (response.data) {
				setDocuments((prev) => [
					...prev,
					{
						id: response.data.id,
						name: response.data.name,
						url: response.data.url,
						fileType: response.data.fileType ?? undefined,
						fileSize: response.data.fileSize ?? undefined,
						createdAt: response.data.createdAt ?? undefined,
					},
				]);
			}
			setUploadDialogOpen(false);
		} catch (error) {
			console.error("Error uploading file:", error);
			toast.error("Failed to upload file");
		} finally {
			setFileName("");
			setFileDescription("");
			setSelectedFile(null);
			setUploading(false);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	};

	// biome-ignore lint/correctness/useHookAtTopLevel: <its fine>
	// biome-ignore lint/correctness/useExhaustiveDependencies: <no need>
	useEffect(() => {
		getDocuments();
	}, []);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 10 * 1024 * 1024) {
				toast.error("File size must be less than 10MB");
				setSelectedFile(null);
				return;
			}
			setSelectedFile(file);
		}
	};

	const handleDelete = async (documentId: string) => {
		try {
			const res = await deleteEventDoc(event.id, documentId);
			if (!res.success) {
				throw new Error(res.error || "Failed to delete document");
			}
			setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
			toast.success("Document deleted successfully");
		} catch {
			toast.error("Failed to delete document");
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatDate = (date: Date): string => {
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	const handleDownload = async (url: string, name: string) => {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to download file");
			}
			const blob = await response.blob();
			const link = document.createElement("a");
			link.href = window.URL.createObjectURL(blob);
			const customName = name;
			link.download = customName || url.split("/").pop() || "download";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error("Error downloading file:", error);
			toast.error("Failed to download file");
		}
	};

	const getFileIcon = (fileType: string) => {
		console.log("File type:", fileType);
		if (fileType?.includes("pdf"))
			return <FileText className="w-4 h-4 text-red-500" />;
		if (fileType?.includes("image"))
			return <FileText className="w-4 h-4 text-blue-500" />;
		if (fileType?.includes("spreadsheet") || fileType?.includes("excel"))
			return <FileText className="w-4 h-4 text-green-500" />;
		if (fileType?.includes("zip") || fileType?.includes("archive"))
			return <FileText className="w-4 h-4 text-purple-500" />;
		return <FileText className="w-4 h-4 text-gray-500" />;
	};

	return (
		<div className="space-y-6">
			{/* Header Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<FileText className="w-5 h-5" />
								Document Management - {event?.name || "Event"}
							</CardTitle>
							<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
								Manage documents for {event?.name}
							</p>
						</div>
						<div className="text-right">
							<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
								{documents.length}
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Documents Uploaded
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div>
						<input
							type="file"
							ref={inputRef}
							onChange={(e) => handleFileSelect(e)}
							style={{ display: "none" }}
						/>
						<Button
							onClick={() => setUploadDialogOpen(true)}
							className="w-full sm:w-auto"
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Document
						</Button>
					</div>
					<div>
						<p className="mt-4 text-sm text-gray-500">
							Best Supported Formats: PDF, JPG, PNG, DOCX
						</p>
					</div>
					<div>
						<p className="mt-2 text-sm text-gray-400">
							(For other formats, it's best to try downloading after upload to
							check if it's working)
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Uploaded Documents</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					) : documents.length === 0 ? (
						<div className="text-center py-8">
							<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600 dark:text-gray-400">
								No documents uploaded yet. Click "Add Document" to get started.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Document Name</TableHead>
										<TableHead>Upload Date</TableHead>
										<TableHead>File Size</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{documents.map((doc) => (
										<TableRow key={doc.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													{getFileIcon(doc.fileType || "")}
													<span className="font-medium">{doc.name}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
													<Calendar className="w-4 h-4" />
													{formatDate(doc.createdAt || new Date())}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{doc.fileSize
														? formatFileSize(doc.fileSize)
														: "Unknown"}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													{/* <Button
														variant="outline"
														size="sm"
														onClick={() => window.open(doc.url, "_blank")}
													>
														<ViewIcon className="w-4 h-4 mr-1" />
														View
													</Button> */}
													<Button
														variant="outline"
														size="sm"
														onClick={async () =>
															await handleDownload(
																doc.url,
																doc.name.split(".")[0],
															)
														}
													>
														<Download className="w-4 h-4 mr-1" />
														Download
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDelete(doc.id)}
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent
					style={{
						minWidth: "320px",
						minHeight: "200px",
						maxWidth: "80vw",
						maxHeight: "80vh",
						width: "auto",
						height: "auto",
					}}
				>
					<DialogHeader>
						<DialogTitle>Upload Document</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-6">
							<div>
								<Label htmlFor="title" className="mb-1 block">
									Document Name (optional)
								</Label>
								<Input
									id="title"
									type="text"
									value={fileName || ""}
									onChange={(e) => setFileName(e.target.value)}
									placeholder="Enter document name"
								/>
							</div>
							<div>
								<Label htmlFor="description" className="mb-1 block">
									Description (optional)
								</Label>
								<Input
									id="description"
									type="text"
									value={fileDescription || ""}
									onChange={(e) => setFileDescription(e.target.value)}
									placeholder="Enter a brief description of the document"
								/>
							</div>
							<div>
								<Label htmlFor="file-upload" className="mb-1 block">
									Select File
								</Label>
								<Button
									variant="outline"
									className="w-full"
									onClick={handleUploadClick}
									disabled={uploading}
								>
									<Upload className="w-4 h-4 mr-2" />
									{selectedFile ? selectedFile.name : "Choose File"}
								</Button>
								<p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
									Supported formats: PDF, DOC, XLS, PPT, ZIP, Images (Max 10MB)
								</p>
							</div>
						</div>

						{selectedFile && (
							<div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{getFileIcon(selectedFile.type)}
										<div>
											<p className="font-medium text-sm">{selectedFile.name}</p>
											<p className="text-xs text-gray-600 dark:text-gray-400">
												{formatFileSize(selectedFile.size)}
											</p>
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setUploadDialogOpen(false)}
								disabled={uploading}
							>
								Cancel
							</Button>
							<Button
								onClick={handleUpload}
								disabled={!selectedFile || uploading}
							>
								{uploading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
										Uploading...
									</>
								) : (
									<>
										<Upload className="w-4 h-4 mr-2" />
										Upload
									</>
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
