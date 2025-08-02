import React, { useCallback } from "react";
import {
	Upload,
	FileText,
	CheckCircle,
	ArrowLeft,
	ArrowRight,
	Table,
} from "lucide-react";
import Papa from "papaparse";
import { CSVData } from "../types";

interface CSVUploadProps {
	onCSVUpload: (csvData: CSVData) => void;
	onNext: () => void;
	onBack: () => void;
	csvData: CSVData | null;
}

export default function CSVUpload({
	onCSVUpload,
	onNext,
	onBack,
	csvData,
}: CSVUploadProps) {
	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file && file.type === "text/csv") {
				Papa.parse(file, {
					header: true,
					skipEmptyLines: true,
					complete: (results) => {
						const data: CSVData = {
							headers: results.meta.fields || [],
							rows: results.data as Record<string, string>[],
						};
						onCSVUpload(data);
					},
					error: (error) => {
						console.error("CSV parsing error:", error);
						alert("Error parsing CSV file. Please check the format.");
					},
				});
			}
		},
		[onCSVUpload],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const file = event.dataTransfer.files[0];
			if (file && file.type === "text/csv") {
				Papa.parse(file, {
					header: true,
					skipEmptyLines: true,
					complete: (results) => {
						const data: CSVData = {
							headers: results.meta.fields || [],
							rows: results.data as Record<string, string>[],
						};
						onCSVUpload(data);
					},
					error: (error) => {
						console.error("CSV parsing error:", error);
						alert("Error parsing CSV file. Please check the format.");
					},
				});
			}
		},
		[onCSVUpload],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
		},
		[],
	);

	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Upload CSV Data
				</h2>
				<p className="text-gray-600 dark:text-slate-400">
					Upload the CSV file containing data for certificate generation
				</p>
			</div>

			{!csvData ? (
				<div className="space-y-6">
					{/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
					{/** biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<div
						className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-300 cursor-pointer bg-gray-50 dark:bg-slate-900"
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onClick={() => document.getElementById("csv-input")?.click()}
					>
						<Upload className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">
							Drop your CSV file here
						</h3>
						<p className="text-gray-500 dark:text-slate-400 mb-4">
							or click to browse files
						</p>
						<div className="flex justify-center">
							<span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-medium border border-green-200 dark:border-green-700">
								CSV files only
							</span>
						</div>
						<input
							id="csv-input"
							type="file"
							accept=".csv"
							onChange={handleFileUpload}
							className="hidden"
						/>
					</div>

					<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
							<FileText className="w-5 h-5 mr-2" />
							CSV Format Guide
						</h3>
						<div className="text-blue-700 dark:text-blue-300">
							<p className="mb-2">Your CSV file should have:</p>
							<ul className="list-disc list-inside space-y-1 text-sm">
								<li>
									Headers in the first row (e.g., Name, Email, Course, Date)
								</li>
								<li>One row per certificate to be generated</li>
								<li>Consistent data format across all rows</li>
								<li>No empty cells for required fields</li>
							</ul>
							<div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-600 text-sm">
								<strong>Example:</strong>
								<br />
								Name,Email,Course,Date
								<br />
								John Doe,john@email.com,Web Development,2024-01-15
								<br />
								Jane Smith,jane@email.com,Data Science,2024-01-15
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-6">
					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<div className="flex items-center justify-center mb-4">
							<CheckCircle className="w-6 h-6 text-green-500 mr-2" />
							<span className="text-green-600 dark:text-green-400 font-medium">
								CSV uploaded successfully!
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center border border-gray-200 dark:border-slate-600">
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{csvData.headers.length}
								</div>
								<div className="text-sm text-gray-600 dark:text-slate-400">
									Columns
								</div>
							</div>
							<div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center border border-gray-200 dark:border-slate-600">
								<div className="text-2xl font-bold text-green-600 dark:text-green-400">
									{csvData.rows.length}
								</div>
								<div className="text-sm text-gray-600 dark:text-slate-400">
									Rows
								</div>
							</div>
							<div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center border border-gray-200 dark:border-slate-600">
								<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
									{csvData.rows.length}
								</div>
								<div className="text-sm text-gray-600 dark:text-slate-400">
									Certificates
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
							<h4 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-3 flex items-center">
								<Table className="w-5 h-5 mr-2" />
								Data Preview
							</h4>
							<div className="overflow-x-auto">
								<table className="min-w-full border-collapse">
									<thead>
										<tr className="bg-gray-50 dark:bg-slate-700">
											{csvData.headers.map((header) => (
												<th
													key={header}
													className="border border-gray-200 dark:border-slate-600 px-4 py-2 text-left font-medium text-gray-700 dark:text-slate-300"
												>
													{header}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{csvData.rows.slice(0, 5).map((row, index) => (
											<tr
												// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
												key={index}
												className="hover:bg-gray-50 dark:hover:bg-slate-700"
											>
												{csvData.headers.map((header) => (
													<td
														key={header}
														className="border border-gray-200 dark:border-slate-600 px-4 py-2 text-sm text-gray-600 dark:text-slate-400"
													>
														{row[header] || "-"}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
								{csvData.rows.length > 5 && (
									<div className="text-center py-2 text-sm text-gray-500 dark:text-slate-400">
										... and {csvData.rows.length - 5} more rows
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => document.getElementById("csv-input")?.click()}
							className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium border border-gray-200 dark:border-slate-600"
						>
							Upload Different File
						</button>
					</div>

					<input
						id="csv-input"
						type="file"
						accept=".csv"
						onChange={handleFileUpload}
						className="hidden"
					/>
				</div>
			)}

			<div className="flex justify-between mt-8">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium border border-gray-200 dark:border-slate-600"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>

				<button
					type="button"
					onClick={onNext}
					disabled={!csvData}
					className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next: Map Columns
					<ArrowRight className="w-4 h-4 ml-2" />
				</button>
			</div>
		</div>
	);
}
