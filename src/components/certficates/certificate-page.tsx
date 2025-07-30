"use client";

import { useState } from "react";
import {
	FileImage,
	Edit3,
	Upload,
	Link,
	Eye,
	Download,
	ChevronRight,
	CheckCircle,
	Calendar,
	Trophy,
	Users,
} from "lucide-react";

// Import certificate components
import TemplateUpload from "../othercomps/templateUpload";
import SectionEditor from "../othercomps/section-editor";
import EnhancedCSVUpload from "../othercomps/enhanced-csv-upload";
import EnhancedVariableMapping from "../othercomps/enhanced-variable-mapping";
import CertificatePreview from "../othercomps/certificate-preview";
import EnhancedCertificateDownload from "../othercomps/enhanced-certificate-download";

// Import UI components
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// Import context and utils
import { useDashboardData } from "../../providers/dashboardDataContext";
import { useCertificateContext } from "../../providers/certificateContext";
import { formatDateTime } from "../../lib/formatDateTime";

type CertificateStep =
	| "event-selection"
	| "template-upload"
	| "template-editor"
	| "csv-upload"
	| "variable-mapping"
	| "certificate-preview"
	| "certificate-generator";

function CertificatePage() {
	// Dashboard data
	const { eventsQuery } = useDashboardData();

	// Certificate context
	const {
		selectedEvent,
		setSelectedEvent,
		templateImage,
		setTemplateImage,
		sections,
		setSections,
		csvData,
		variableMapping,
		resetCertificateData,
	} = useCertificateContext();

	// Main state management
	const [currentStep, setCurrentStep] =
		useState<CertificateStep>("event-selection");

	// Step configuration
	const steps = [
		{
			key: "event-selection" as CertificateStep,
			title: "Select Event",
			description: "Choose the completed event for certificate generation",
			icon: Calendar,
			completed: !!selectedEvent,
		},
		{
			key: "template-upload" as CertificateStep,
			title: "Upload Template",
			description: "Upload your certificate template image",
			icon: FileImage,
			completed: !!templateImage,
		},
		{
			key: "template-editor" as CertificateStep,
			title: "Design Template",
			description: "Add placeholders and style your certificate",
			icon: Edit3,
			completed: sections.length > 0,
		},
		{
			key: "csv-upload" as CertificateStep,
			title: "Upload Data",
			description: "Upload CSV file with certificate data",
			icon: Upload,
			completed: !!csvData,
		},
		{
			key: "variable-mapping" as CertificateStep,
			title: "Map Variables",
			description: "Connect template variables to CSV columns",
			icon: Link,
			completed: Object.keys(variableMapping).length > 0,
		},
		{
			key: "certificate-preview" as CertificateStep,
			title: "Preview",
			description: "Preview certificate design",
			icon: Eye,
			completed: false,
		},
		{
			key: "certificate-generator" as CertificateStep,
			title: "Generate & Download",
			description: "Generate and download certificates",
			icon: Download,
			completed: false,
		},
	];

	// Step navigation functions
	const goToStep = (step: CertificateStep) => {
		setCurrentStep(step);
	};

	const nextStep = () => {
		const currentIndex = steps.findIndex((s) => s.key === currentStep);
		if (currentIndex < steps.length - 1) {
			setCurrentStep(steps[currentIndex + 1].key);
		}
	};

	const prevStep = () => {
		const currentIndex = steps.findIndex((s) => s.key === currentStep);
		if (currentIndex > 0) {
			setCurrentStep(steps[currentIndex - 1].key);
		}
	};

	// Render step indicator
	const renderStepIndicator = () => (
		<div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 mb-8">
			<div className="flex items-center justify-between">
				{steps.map((step, index) => {
					const Icon = step.icon;
					const isActive = currentStep === step.key;
					const isCompleted = step.completed;
					const isClickable = index === 0 || steps[index - 1].completed;

					return (
						<div key={step.key} className="flex items-center">
							<button
								type="button"
								className={`flex flex-col items-center transition-all duration-200 ${
									isClickable
										? "hover:scale-105 cursor-pointer"
										: "cursor-not-allowed opacity-50"
								}`}
								onClick={() => isClickable && goToStep(step.key)}
								disabled={!isClickable}
							>
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
										isActive
											? "bg-blue-600 text-white shadow-lg"
											: isCompleted
												? "bg-green-500 text-white"
												: "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
									}`}
								>
									{isCompleted ? (
										<CheckCircle className="w-6 h-6" />
									) : (
										<Icon className="w-6 h-6" />
									)}
								</div>
								<div className="text-center">
									<div
										className={`text-sm font-medium ${
											isActive
												? "text-blue-600 dark:text-blue-400"
												: "text-gray-700 dark:text-slate-300"
										}`}
									>
										{step.title}
									</div>
									<div className="text-xs text-gray-500 dark:text-slate-500 max-w-24">
										{step.description}
									</div>
								</div>
							</button>
							{index < steps.length - 1 && (
								<ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-600 mx-2" />
							)}
						</div>
					);
				})}
			</div>
		</div>
	);

	// Render event selection step
	const renderEventSelection = () => {
		if (eventsQuery.isLoading) {
			return (
				<div className="flex items-center justify-center p-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
						<p className="text-sm text-gray-500">Loading events...</p>
					</div>
				</div>
			);
		}

		if (eventsQuery.isError || !eventsQuery.data?.success) {
			return (
				<div className="text-center p-8">
					<p className="text-red-500">Failed to load events</p>
				</div>
			);
		}

		const completedEvents = eventsQuery.data.data.filter(
			(event) => event.state === "COMPLETED",
		);

		if (completedEvents.length === 0) {
			return (
				<div className="text-center p-8">
					<Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No Completed Events
					</h3>
					<p className="text-gray-500">
						There are no completed events available for certificate generation.
					</p>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Select a Completed Event
					</h2>
					<p className="text-gray-600">
						Choose the event for which you want to generate certificates
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{completedEvents.map((event) => (
						<Card
							key={event.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								selectedEvent?.id === event.id ? "ring-2 ring-blue-500" : ""
							}`}
							onClick={() => setSelectedEvent(event)}
						>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Trophy className="w-5 h-5 text-yellow-500" />
									{event.name}
								</CardTitle>
								<CardDescription>
									<Badge variant="secondary" className="mb-2">
										{event.eventType}
									</Badge>
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-3">
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<Calendar className="w-4 h-4" />
									<span>
										{formatDateTime(event.fromDate).date} -{" "}
										{formatDateTime(event.toDate).date}
									</span>
								</div>

								<div className="flex items-center gap-2 text-sm text-gray-600">
									<Users className="w-4 h-4" />
									<span>{event.confirmedTeams} confirmed teams</span>
								</div>

								{event.prizes && event.prizes.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{event.prizes.map((prize) => (
											<Badge
												key={prize.id}
												variant="outline"
												className="text-xs"
											>
												{prize.prizeType}
											</Badge>
										))}
									</div>
								)}
							</CardContent>

							<CardFooter>
								<Button
									className="w-full"
									variant={
										selectedEvent?.id === event.id ? "default" : "outline"
									}
									onClick={(e) => {
										e.stopPropagation();
										setSelectedEvent(event);
										nextStep();
									}}
								>
									Issue Certificate
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
		);
	};

	// Render current step content
	const renderStepContent = () => {
		switch (currentStep) {
			case "event-selection":
				return renderEventSelection();

			case "template-upload":
				return (
					<TemplateUpload
						templateImage={templateImage}
						onImageUpload={setTemplateImage}
						onNext={nextStep}
					/>
				);

			case "template-editor":
				return templateImage ? (
					<SectionEditor
						templateImage={templateImage}
						sections={sections}
						onSectionsChange={setSections}
						onNext={nextStep}
						onBack={prevStep}
					/>
				) : null;

			case "csv-upload":
				return <EnhancedCSVUpload onNext={nextStep} onBack={prevStep} />;

			case "variable-mapping":
				return <EnhancedVariableMapping onNext={nextStep} onBack={prevStep} />;

			case "certificate-preview":
				return templateImage ? (
					<CertificatePreview
						templateImage={templateImage}
						sections={sections}
						csvData={csvData}
						variableMapping={variableMapping}
						onNext={nextStep}
						onBack={prevStep}
					/>
				) : (
					<div className="text-center p-8">
						<p className="text-red-500">
							No template image found. Please go back and upload a template.
						</p>
					</div>
				);

			case "certificate-generator":
				return <EnhancedCertificateDownload onBack={prevStep} />;

			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-200">
						Certificate Management
					</h1>
					<p className="text-sm md:text-base text-gray-600 dark:text-slate-400">
						Create, design, and generate certificates in bulk
					</p>
				</div>

				{/* Quick actions */}
				<div className="flex items-center gap-3">
					{currentStep !== "event-selection" && (
						<button
							type="button"
							onClick={() => {
								resetCertificateData();
								setCurrentStep("event-selection");
							}}
							className="px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
						>
							Start Over
						</button>
					)}
					{steps.find((s) => s.key === currentStep)?.completed &&
						currentStep !== "certificate-generator" && (
							<button
								type="button"
								onClick={() => goToStep("certificate-generator")}
								className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
							>
								<Download className="w-4 h-4" />
								Generate Certificates
							</button>
						)}
				</div>
			</div>

			{/* Step Indicator */}
			{renderStepIndicator()}

			{/* Step Content */}
			<div className="min-h-[600px]">{renderStepContent()}</div>

			{/* Help Section */}
			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
				<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
					How Certificate Management Works
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-blue-700 dark:text-blue-300">
					<div>
						<strong>1. Upload Template:</strong> Start with your certificate
						design as an image
					</div>
					<div>
						<strong>2. Add Placeholders:</strong> Place text sections with
						variables like {"{name}"} on your template
					</div>
					<div>
						<strong>3. Upload Data:</strong> Import a CSV file with the data for
						each certificate
					</div>
					<div>
						<strong>4. Map Variables:</strong> Connect your template variables
						to CSV columns
					</div>
					<div>
						<strong>5. Generate:</strong> Preview and download all certificates
					</div>
				</div>
			</div>
		</div>
	);
}

export default CertificatePage;
