import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
	User,
	Calendar,
	Trophy,
	Users,
	AlertCircle,
	CheckCircle,
	Minus,
	Plus,
	FileText,
} from "lucide-react";
import { useCertificateContext } from "../../providers/certificateContext";
import {
	availableVariables,
	type DatabaseVariable,
	type EventParticipant,
} from "../../lib/certificate-types";
import { getEventParticipants } from "../../actions/certificate";

interface EnhancedVariableMappingProps {
	onNext: () => void;
	onBack: () => void;
}

export default function EnhancedVariableMapping({
	onNext,
	onBack,
}: EnhancedVariableMappingProps) {
	const {
		selectedEvent,
		csvData,
		sections,
		usnColumn,
		variableMapping,
		setVariableMapping,
		extraDataMapping,
		setExtraDataMapping,
		filenameFormat,
		setFilenameFormat,
		missingUsns,
		setMissingUsns,
	} = useCertificateContext();

	const [participants, setParticipants] = useState<EventParticipant[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availableExtraColumns, setAvailableExtraColumns] = useState<string[]>(
		[],
	);

	// Get template variables from sections - extract variables from all segments
	const templateVariables = useMemo(() => {
		const variables = new Set<string>();
		sections.forEach((section) => {
			section.segments.forEach((segment) => {
				if (segment.isVariable && segment.variableName) {
					variables.add(segment.variableName);
				}
			});
		});
		return Array.from(variables);
	}, [sections]);

	const loadParticipants = useCallback(async () => {
		if (!selectedEvent) return;

		setLoading(true);
		try {
			const result = await getEventParticipants(selectedEvent.id);
			if (result.success && result.data) {
				setParticipants(result.data);
			} else {
				setError(result.error || "Failed to load participants");
			}
		} catch (err) {
			setError("Failed to load participants");
		} finally {
			setLoading(false);
		}
	}, [selectedEvent]);

	const validateUSNs = useCallback(() => {
		if (!csvData || !usnColumn || participants.length === 0) return;

		const csvUSNs = csvData.rows.map((row) => row[usnColumn]).filter(Boolean);
		const participantUSNs = participants.map((p) => p.usn);

		const missing = csvUSNs.filter((usn) => !participantUSNs.includes(usn));
		setMissingUsns(missing);
	}, [csvData, usnColumn, participants, setMissingUsns]);

	useEffect(() => {
		if (selectedEvent) {
			loadParticipants();
		}
	}, [selectedEvent, loadParticipants]);

	useEffect(() => {
		if (csvData && usnColumn) {
			// Get columns that are not the USN column
			const extraColumns = csvData.headers.filter(
				(header) => header !== usnColumn,
			);
			setAvailableExtraColumns(extraColumns);

			// Check for missing USNs
			validateUSNs();
		}
	}, [csvData, usnColumn, validateUSNs]);

	const getVariablesByType = (type: string) => {
		return availableVariables.filter((v) => v.type === type);
	};

	const handleVariableMapping = (
		sectionVariable: string,
		databaseVariable: string,
	) => {
		setVariableMapping((prev) => ({
			...prev,
			[sectionVariable]: databaseVariable,
		}));
	};

	const handleExtraDataMapping = (
		sectionVariable: string,
		csvColumn: string,
	) => {
		setExtraDataMapping((prev) => ({
			...prev,
			[sectionVariable]: csvColumn,
		}));
	};

	const addFilenameComponent = () => {
		setFilenameFormat((prev) => [...prev, ""]);
	};

	const removeFilenameComponent = (index: number) => {
		setFilenameFormat((prev) => prev.filter((_, i) => i !== index));
	};

	const updateFilenameComponent = (index: number, value: string) => {
		setFilenameFormat((prev) =>
			prev.map((item, i) => (i === index ? value : item)),
		);
	};

	const isValid = () => {
		// Check if all template variables are mapped
		const unmappedVariables = templateVariables.filter(
			(variable) => !variableMapping[variable] && !extraDataMapping[variable],
		);
		return unmappedVariables.length === 0;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
					<p className="text-sm text-gray-500">Loading participants...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center p-8">
				<AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Error Loading Data
				</h3>
				<p className="text-red-500 mb-4">{error}</p>
				<Button onClick={loadParticipants}>Try Again</Button>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Map Variables</h2>
				<p className="text-gray-600">
					Map your certificate template variables to database fields and CSV
					data
				</p>
			</div>

			{/* Missing USNs Warning */}
			{missingUsns.length > 0 && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<strong>Warning:</strong> {missingUsns.length} USNs from your CSV
						were not found in the event participants: {missingUsns.join(", ")}
					</AlertDescription>
				</Alert>
			)}

			{/* Template Variables Info */}
			{templateVariables.length === 0 && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						No variables found in your certificate template. Make sure you've
						added variables like {"{name}"} in the template editor.
					</AlertDescription>
				</Alert>
			)}

			{/* Participants Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="w-5 h-5" />
						Event Participants ({participants.length})
					</CardTitle>
					<CardDescription>
						Confirmed participants for {selectedEvent?.name}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{participants.length}
							</div>
							<div className="text-sm text-gray-500">Total Attendees</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{participants.filter((p) => p.prizeType).length}
							</div>
							<div className="text-sm text-gray-500">Prize Winners</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">
								{csvData ? csvData.rows.length : 0}
							</div>
							<div className="text-sm text-gray-500">CSV Records</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Variable Mapping */}
			{templateVariables.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Variable Mapping</CardTitle>
						<CardDescription>
							Map your certificate template variables to available data sources
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{templateVariables.map((templateVar) => (
							<div key={templateVar} className="space-y-3">
								<Label className="text-sm font-medium">
									Template Variable:{" "}
									<Badge variant="outline">{templateVar}</Badge>
								</Label>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Database Variables */}
									<div>
										<Label className="text-xs text-gray-500 mb-2 block">
											From Database
										</Label>
										<Select
											value={variableMapping[templateVar] || ""}
											onValueChange={(value) => {
												handleVariableMapping(templateVar, value);
												// Clear extra data mapping if database mapping is selected
												if (value && extraDataMapping[templateVar]) {
													setExtraDataMapping((prev) => {
														const updated = { ...prev };
														delete updated[templateVar];
														return updated;
													});
												}
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select database field..." />
											</SelectTrigger>
											<SelectContent>
												{["user", "event", "prize", "team"].map((type) => {
													const variables = getVariablesByType(type);
													if (variables.length === 0) return null;

													return (
														<div key={type}>
															<div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
																{type === "user" && (
																	<>
																		<User className="w-3 h-3 inline mr-1" />
																		User Data
																	</>
																)}
																{type === "event" && (
																	<>
																		<Calendar className="w-3 h-3 inline mr-1" />
																		Event Data
																	</>
																)}
																{type === "prize" && (
																	<>
																		<Trophy className="w-3 h-3 inline mr-1" />
																		Prize Data
																	</>
																)}
																{type === "team" && (
																	<>
																		<Users className="w-3 h-3 inline mr-1" />
																		Team Data
																	</>
																)}
															</div>
															{variables.map((variable) => (
																<SelectItem
																	key={variable.key}
																	value={variable.key}
																>
																	{variable.label}
																	{variable.description && (
																		<span className="text-xs text-gray-500 block">
																			{variable.description}
																		</span>
																	)}
																</SelectItem>
															))}
														</div>
													);
												})}
											</SelectContent>
										</Select>
									</div>

									{/* CSV Data */}
									{csvData && availableExtraColumns.length > 0 && (
										<div>
											<Label className="text-xs text-gray-500 mb-2 block">
												From CSV Data
											</Label>
											<Select
												value={extraDataMapping[templateVar] || ""}
												onValueChange={(value) => {
													handleExtraDataMapping(templateVar, value);
													// Clear database mapping if CSV mapping is selected
													if (value && variableMapping[templateVar]) {
														setVariableMapping((prev) => {
															const updated = { ...prev };
															delete updated[templateVar];
															return updated;
														});
													}
												}}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select CSV column..." />
												</SelectTrigger>
												<SelectContent>
													{availableExtraColumns.map((column) => (
														<SelectItem key={column} value={column}>
															{column}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</div>

								{/* Show current mapping */}
								<div className="text-xs text-gray-500">
									{variableMapping[templateVar] && (
										<span className="flex items-center gap-1">
											<CheckCircle className="w-3 h-3 text-green-500" />
											Mapped to database:{" "}
											{
												availableVariables.find(
													(v) => v.key === variableMapping[templateVar],
												)?.label
											}
										</span>
									)}
									{extraDataMapping[templateVar] && (
										<span className="flex items-center gap-1">
											<CheckCircle className="w-3 h-3 text-blue-500" />
											Mapped to CSV: {extraDataMapping[templateVar]}
										</span>
									)}
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{/* Filename Format */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="w-5 h-5" />
						Certificate Filename Format
					</CardTitle>
					<CardDescription>
						Customize how certificate files will be named
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						{filenameFormat.map((component, index) => (
							<div
								key={`filename-${
									// biome-ignore lint/suspicious/noArrayIndexKey: <index is fine>
									index
								}`}
								className="flex items-center gap-2"
							>
								<Select
									value={component}
									onValueChange={(value) =>
										updateFilenameComponent(index, value)
									}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select filename component..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="usn">USN</SelectItem>
										<SelectItem value="name">Name</SelectItem>
										<SelectItem value="eventName">Event Name</SelectItem>
										<SelectItem value="prizeType">Prize Type</SelectItem>
										<SelectItem value="teamName">Team Name</SelectItem>
										<SelectItem value="custom">Custom Text...</SelectItem>
									</SelectContent>
								</Select>

								{component === "custom" && (
									<Input
										placeholder="Enter custom text"
										className="flex-1"
										onChange={(e) =>
											updateFilenameComponent(index, `custom:${e.target.value}`)
										}
									/>
								)}

								<Button
									variant="outline"
									size="sm"
									onClick={() => removeFilenameComponent(index)}
									disabled={filenameFormat.length === 1}
								>
									<Minus className="w-4 h-4" />
								</Button>
							</div>
						))}

						<Button
							variant="outline"
							onClick={addFilenameComponent}
							className="w-full"
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Component
						</Button>
					</div>

					<div className="text-sm text-gray-500">
						<strong>Preview:</strong>{" "}
						{filenameFormat.length > 0
							? filenameFormat.filter(Boolean).join("-") + ".pdf"
							: "certificate.pdf"}
					</div>
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button onClick={onNext} disabled={!isValid()}>
					Continue to Preview
				</Button>
			</div>
		</div>
	);
}
