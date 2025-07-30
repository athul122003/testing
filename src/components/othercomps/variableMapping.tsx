import React from "react";
import {
	ArrowLeft,
	ArrowRight,
	Link,
	CheckCircle,
	AlertCircle,
	Hash,
	FileText,
} from "lucide-react";
import { Variable } from "../types";

interface VariableMappingProps {
	variables: Variable[];
	csvHeaders: string[];
	mapping: Record<string, string>;
	onMappingChange: (mapping: Record<string, string>) => void;
	onNext: () => void;
	onBack: () => void;
}

export default function VariableMapping({
	variables,
	csvHeaders,
	mapping,
	onMappingChange,
	onNext,
	onBack,
}: VariableMappingProps) {
	const handleMappingChange = (variableName: string, csvColumn: string) => {
		const newMapping = { ...mapping };
		if (csvColumn === "") {
			delete newMapping[variableName];
		} else {
			newMapping[variableName] = csvColumn;
		}
		onMappingChange(newMapping);
	};

	const handleFilenameMappingChange = (csvColumn: string) => {
		const newMapping = { ...mapping };
		if (csvColumn === "") {
			delete newMapping["__filename__"];
		} else {
			newMapping["__filename__"] = csvColumn;
		}
		onMappingChange(newMapping);
	};

	const getMappedVariables = () =>
		Object.keys(mapping).filter((key) => key !== "__filename__").length;
	const getUnmappedVariables = () => variables.length - getMappedVariables();
	const isAllMapped = getMappedVariables() === variables.length;
	const hasFilenameMapping = mapping["__filename__"];

	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Map Variables to CSV Columns
				</h2>
				<p className="text-gray-600 dark:text-slate-400">
					Connect your variables to CSV data columns and set filename format
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-700">
					<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
						{variables.length}
					</div>
					<div className="text-sm text-gray-600 dark:text-slate-400">
						Total Variables
					</div>
				</div>
				<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-700">
					<div className="text-2xl font-bold text-green-600 dark:text-green-400">
						{getMappedVariables()}
					</div>
					<div className="text-sm text-gray-600 dark:text-slate-400">
						Mapped
					</div>
				</div>
				<div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-200 dark:border-orange-700">
					<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
						{getUnmappedVariables()}
					</div>
					<div className="text-sm text-gray-600 dark:text-slate-400">
						Unmapped
					</div>
				</div>
				<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700">
					<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{hasFilenameMapping ? "✓" : "✗"}
					</div>
					<div className="text-sm text-gray-600 dark:text-slate-400">
						Filename Set
					</div>
				</div>
			</div>

			<div
				className={`p-4 rounded-lg mb-6 ${
					isAllMapped
						? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
						: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700"
				}`}
			>
				<div className="flex items-center">
					{isAllMapped ? (
						<CheckCircle className="w-5 h-5 text-green-500 mr-2" />
					) : (
						<AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
					)}
					<span
						className={`font-medium ${
							isAllMapped
								? "text-green-800 dark:text-green-200"
								: "text-orange-800 dark:text-orange-200"
						}`}
					>
						{isAllMapped
							? "All variables are mapped! Ready to preview certificates."
							: `${getUnmappedVariables()} variable(s) still need to be mapped.`}
					</span>
				</div>
			</div>

			<div className="space-y-6">
				<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
					<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center">
						<FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
						Certificate Filename
					</h3>

					<div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div className="flex-1">
								<div className="flex items-center mb-2">
									<FileText className="w-4 h-4 text-blue-500 mr-2" />
									<span className="font-medium text-gray-800 dark:text-slate-200">
										Generated Filename Format
									</span>
								</div>
								<div className="text-sm text-gray-500 dark:text-slate-400">
									Choose which CSV column to use for certificate filenames
								</div>
							</div>

							<div className="flex items-center space-x-3">
								<span className="text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap">
									Use column:
								</span>
								<select
									value={mapping["__filename__"] || ""}
									onChange={(e) => handleFilenameMappingChange(e.target.value)}
									className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
								>
									<option value="">Use default naming...</option>
									{csvHeaders.map((header) => (
										<option key={header} value={header}>
											{header}
										</option>
									))}
								</select>
								{mapping["__filename__"] && (
									<CheckCircle className="w-5 h-5 text-green-500" />
								)}
							</div>
						</div>

						{mapping["__filename__"] && (
							<div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-600">
								<div className="text-sm text-blue-700 dark:text-blue-300">
									<strong>Example:</strong> If {mapping["__filename__"]}{" "}
									contains "john_doe", the certificate will be saved as
									"certificate_john_doe.png"
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
					<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center">
						<Link className="w-5 h-5 mr-2" />
						Variable Mapping
					</h3>

					<div className="space-y-4">
						{variables.map((variable) => (
							<div
								key={variable.name}
								className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-600"
							>
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center mb-2">
											<Hash className="w-4 h-4 text-purple-500 mr-2" />
											<span className="font-medium text-gray-800 dark:text-slate-200">
												Variable: {variable.name}
											</span>
										</div>
										<div className="text-sm text-gray-500 dark:text-slate-400">
											Used in sections: {variable.sections.join(", ")}
										</div>
									</div>

									<div className="flex items-center space-x-3">
										<span className="text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap">
											Maps to:
										</span>
										<select
											value={mapping[variable.name] || ""}
											onChange={(e) =>
												handleMappingChange(variable.name, e.target.value)
											}
											className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
										>
											<option value="">Select CSV column...</option>
											{csvHeaders.map((header) => (
												<option key={header} value={header}>
													{header}
												</option>
											))}
										</select>
										{mapping[variable.name] && (
											<CheckCircle className="w-5 h-5 text-green-500" />
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
					<h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4">
						Available CSV Columns
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						{csvHeaders.map((header) => {
							const isUsed = Object.values(mapping).includes(header);
							const isFilename = mapping["__filename__"] === header;
							return (
								<div
									key={header}
									className={`px-3 py-2 rounded-lg border text-sm font-medium ${
										isFilename
											? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
											: isUsed
												? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
												: "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300"
									}`}
								>
									{header}
									{isFilename && <span className="ml-2">📁</span>}
									{isUsed && !isFilename && <span className="ml-2">✓</span>}
								</div>
							);
						})}
					</div>
				</div>
			</div>

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
					disabled={!isAllMapped}
					className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Preview Certificate
					<ArrowRight className="w-4 h-4 ml-2" />
				</button>
			</div>
		</div>
	);
}
