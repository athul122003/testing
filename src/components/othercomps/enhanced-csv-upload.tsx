import { useState } from "react";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, Check, X } from "lucide-react";
import { useCertificateContext } from "../../providers/certificateContext";

interface EnhancedCSVUploadProps {
	onNext: () => void;
	onBack: () => void;
}

export default function EnhancedCSVUpload({
	onNext,
	onBack,
}: EnhancedCSVUploadProps) {
	const { csvData, setCsvData, usnColumn, setUsnColumn } =
		useCertificateContext();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith(".csv")) {
			setError("Please select a CSV file");
			return;
		}

		setSelectedFile(file);
		setError(null);

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			const lines = content.split("\n");

			if (lines.length < 2) {
				setError("CSV file must have at least a header row and one data row");
				return;
			}

			const headers = lines[0]
				.split(",")
				.map((h) => h.trim().replace(/"/g, ""));
			setCsvHeaders(headers);

			const rows = lines
				.slice(1)
				.filter((line) => line.trim())
				.map((line) => {
					const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
					const row: Record<string, string> = {};
					headers.forEach((header, index) => {
						row[header] = values[index] || "";
					});
					return row;
				});

			setCsvData({
				headers,
				rows,
			});
		};

		reader.readAsText(file);
	};

	const handleSkip = () => {
		setCsvData(null);
		setUsnColumn(null);
		onNext();
	};

	const handleContinueWithCSV = () => {
		if (!usnColumn) {
			setError("Please select which column contains USN data");
			return;
		}
		onNext();
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					Upload Additional Data (Optional)
				</h2>
				<p className="text-gray-600">
					Upload a CSV file with extra data for certificates, or skip to use
					only database information
				</p>
			</div>

			{/* Option 1: Skip CSV Upload */}
			<Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Check className="w-5 h-5 text-green-500" />
						Use Database Information Only
					</CardTitle>
					<CardDescription>
						Generate certificates using only the participant data from the event
						registration
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-600 mb-4">
						Available data includes: USN, Name, Email, Team Name, Prize Type,
						Event Details
					</p>
					<Button onClick={handleSkip} variant="outline" className="w-full">
						Continue Without Additional Data
					</Button>
				</CardContent>
			</Card>

			{/* Divider */}
			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-white px-2 text-gray-500">
						Or upload additional data
					</span>
				</div>
			</div>

			{/* Option 2: Upload CSV */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileSpreadsheet className="w-5 h-5 text-blue-500" />
						Upload CSV with Extra Data
					</CardTitle>
					<CardDescription>
						Upload a CSV file with additional information to include in
						certificates
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{!csvData ? (
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
							<input
								type="file"
								accept=".csv"
								onChange={handleFileUpload}
								className="hidden"
								id="csv-upload"
							/>
							<label htmlFor="csv-upload" className="cursor-pointer block">
								<Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p className="text-lg font-medium text-gray-900 mb-2">
									Choose CSV file
								</p>
								<p className="text-sm text-gray-500">
									The CSV must contain a column with USN data to match with
									registered participants
								</p>
							</label>
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<FileSpreadsheet className="w-5 h-5 text-green-500" />
									<span className="font-medium">{selectedFile?.name}</span>
									<Badge variant="secondary">{csvData.rows.length} rows</Badge>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setCsvData(null);
										setUsnColumn(null);
										setSelectedFile(null);
										setCsvHeaders([]);
									}}
								>
									<X className="w-4 h-4" />
								</Button>
							</div>

							<div>
								{/** biome-ignore lint/a11y/noLabelWithoutControl: <fine> */}
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Select USN Column *
								</label>
								<select
									value={usnColumn || ""}
									onChange={(e) => setUsnColumn(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">
										Choose which column contains USN data...
									</option>
									{csvHeaders.map((header) => (
										<option key={header} value={header}>
											{header}
										</option>
									))}
								</select>
							</div>

							<div>
								{/** biome-ignore lint/a11y/noLabelWithoutControl: <fine> */}
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Available Columns
								</label>
								<div className="flex flex-wrap gap-2">
									{csvHeaders.map((header) => (
										<Badge
											key={header}
											variant={header === usnColumn ? "default" : "outline"}
										>
											{header}
										</Badge>
									))}
								</div>
							</div>

							<Button
								onClick={handleContinueWithCSV}
								className="w-full"
								disabled={!usnColumn}
							>
								Continue with CSV Data
							</Button>
						</div>
					)}

					{error && (
						<div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
							<AlertCircle className="w-5 h-5" />
							<span className="text-sm">{error}</span>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
			</div>
		</div>
	);
}
