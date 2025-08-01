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
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileToGoogleDrive } from "~/lib/googleDrive";

type Document = {
	id: string;
	name: string;
	uploadedAt: Date;
	downloadUrl: string;
	fileSize?: number;
	fileType?: string;
};

type EventDocumentsProps = {
	// biome-ignore lint/suspicious/noExplicitAny: <TODO>
	editingEvent: any;
};

// Mock data for now - replace with actual API calls
const mockDocuments: Document[] = [
	{
		id: "1",
		name: "Event Guidelines.pdf",
		uploadedAt: new Date("2024-01-15T10:30:00"),
		downloadUrl: "/documents/event-guidelines.pdf",
		fileSize: 245760, // 240 KB
		fileType: "application/pdf",
	},
	{
		id: "2",
		name: "Participant List.xlsx",
		uploadedAt: new Date("2024-01-20T14:15:00"),
		downloadUrl: "/documents/participant-list.xlsx",
		fileSize: 51200, // 50 KB
		fileType:
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	},
	{
		id: "3",
		name: "Event Photos.zip",
		uploadedAt: new Date("2024-01-25T16:45:00"),
		downloadUrl: "/documents/event-photos.zip",
		fileSize: 15728640, // 15 MB
		fileType: "application/zip",
	},
];

export function EventDocuments({ editingEvent: event }: EventDocumentsProps) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(false);
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleUploadClick = () => {
		if (inputRef.current) {
			// Reset the input so the same file can be selected again
			inputRef.current.value = "";
			inputRef.current.click();
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const folderName = `EventDocuments/${event.id}`;
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const base64 = buffer.toString("base64");

			const response = await uploadFileToGoogleDrive(
				{ buffer: base64, originalname: file.name },
				folderName,
			);

			console.log("File uploaded successfully:", response);
		} catch (error) {
			console.error("Error uploading file:", error);
			toast.error("Failed to upload document");
		}
	};

	// Mock data for now - replace with actual API calls
	const mockDocuments: Document[] = [
		{
			id: "1",
			name: "Event Guidelines.pdf",
			uploadedAt: new Date("2024-01-15T10:30:00"),
			downloadUrl: "/documents/event-guidelines.pdf",
			fileSize: 245760, // 240 KB
			fileType: "application/pdf",
		},
		{
			id: "2",
			name: "Participant List.xlsx",
			uploadedAt: new Date("2024-01-20T14:15:00"),
			downloadUrl: "/documents/participant-list.xlsx",
			fileSize: 51200, // 50 KB
			fileType:
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		},
		{
			id: "3",
			name: "Event Photos.zip",
			uploadedAt: new Date("2024-01-25T16:45:00"),
			downloadUrl: "/documents/event-photos.zip",
			fileSize: 15728640, // 15 MB
			fileType: "application/zip",
		},
	];

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
	useEffect(() => {
		// Load documents for the event
		setLoading(true);
		// Simulate API call
		setTimeout(() => {
			setDocuments(mockDocuments);
			setLoading(false);
		}, 500);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Check file size (max 10MB for example)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("File size must be less than 10MB");
				return;
			}
			setSelectedFile(file);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select a file to upload");
			return;
		}

		setUploading(true);
		try {
			// Simulate upload API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const newDocument: Document = {
				id: Date.now().toString(),
				name: selectedFile.name,
				uploadedAt: new Date(),
				downloadUrl: `/documents/${selectedFile.name}`,
				fileSize: selectedFile.size,
				fileType: selectedFile.type,
			};

			setDocuments((prev) => [newDocument, ...prev]);
			setSelectedFile(null);
			setUploadDialogOpen(false);
			toast.success("Document uploaded successfully!");
		} catch {
			toast.error("Failed to upload document");
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (documentId: string) => {
		try {
			// Simulate delete API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
			toast.success("Document deleted successfully!");
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

	const getFileIcon = (fileType: string) => {
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
								Document Management
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
					<input
						type="file"
						ref={inputRef}
						onChange={handleFileChange}
						style={{ display: "none" }}
					/>
					<Button
						onClick={() => handleUploadClick()}
						className="w-full sm:w-auto"
					>
						<Plus className="w-4 h-4 mr-2" />
						Add Document
					</Button>
				</CardContent>
			</Card>

			{/* Documents Table */}
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
													{formatDate(doc.uploadedAt)}
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
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															window.open(doc.downloadUrl, "_blank")
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

			{/* Upload Dialog */}
			{/* <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upload Document</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="file-upload">Select File</Label>
							<Input
								id="file-upload"
								type="file"
								onChange={handleFileSelect}
								accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif"
								className="mt-1"
							/>
							<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
								Supported formats: PDF, DOC, XLS, PPT, ZIP, Images (Max 10MB)
							</p>
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
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
			</Dialog> */}
		</div>
	);
}
