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
} from "lucide-react";

// Import certificate components
import TemplateUpload from "../othercomps/templateUpload";
import SectionEditor from "../othercomps/section-editor";
import CSVUpload from "../othercomps/CSVUpload";
import VariableMapping from "../othercomps/variableMapping";
import CertificatePreview from "../othercomps/certificate-preview";
import CertificateGenerator from "../othercomps/certificate-download";

// Import types
import type { Section, CSVData, Variable } from "../types";

type CertificateStep =
	| "template-upload"
	| "template-editor"
	| "csv-upload"
	| "variable-mapping"
	| "certificate-preview"
	| "certificate-generator";

function CertificatePage() {
	// Main state management
	const [currentStep, setCurrentStep] =
		useState<CertificateStep>("template-upload");

	// Template state
	const [templateImage, setTemplateImage] = useState<string | null>(null);

	// Sections state (for template editor)
	const [sections, setSections] = useState<Section[]>([]);

	// CSV data state
	const [csvData, setCsvData] = useState<CSVData | null>(null);

	// Variable mapping state
	const [variableMapping, setVariableMapping] = useState<
		Record<string, string>
	>({});

	// Step configuration
	const steps = [
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

	// Get variables from sections
	const getVariablesFromSections = (): Variable[] => {
		const variables: Variable[] = [];
		sections.forEach((section) => {
			section.segments.forEach((segment) => {
				if (segment.isVariable && segment.variableName) {
					const existing = variables.find(
						(v) => v.name === segment.variableName,
					);
					if (!existing) {
						variables.push({
							name: segment.variableName,
							sections: [section.name],
						});
					} else {
						if (!existing.sections.includes(section.name)) {
							existing.sections.push(section.name);
						}
					}
				}
			});
		});
		return variables;
	};

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

	// Render current step content
	const renderStepContent = () => {
		switch (currentStep) {
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
				return (
					<CSVUpload
						csvData={csvData}
						onCSVUpload={setCsvData}
						onNext={nextStep}
						onBack={prevStep}
					/>
				);

			case "variable-mapping":
				return csvData ? (
					<VariableMapping
						variables={getVariablesFromSections()}
						csvHeaders={csvData.headers}
						mapping={variableMapping}
						onMappingChange={setVariableMapping}
						onNext={nextStep}
						onBack={prevStep}
					/>
				) : null;

			case "certificate-preview":
				return templateImage && csvData ? (
					<CertificatePreview
						templateImage={templateImage}
						sections={sections}
						csvData={csvData}
						variableMapping={variableMapping}
						onNext={nextStep}
						onBack={prevStep}
					/>
				) : null;

			case "certificate-generator":
				return templateImage && csvData ? (
					<CertificateGenerator
						templateImage={templateImage}
						sections={sections}
						csvData={csvData}
						variableMapping={variableMapping}
						onBack={prevStep}
					/>
				) : null;

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
					{currentStep !== "template-upload" && (
						<button
							type="button"
							onClick={() => {
								setTemplateImage(null);
								setSections([]);
								setCsvData(null);
								setVariableMapping({});
								setCurrentStep("template-upload");
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
