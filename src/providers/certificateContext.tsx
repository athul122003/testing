"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import type { ExtendedEvent } from "../actions/event";
import type { Section, CSVData } from "../components/types";
import { useDashboardData } from "./dashboardDataContext";

interface CertificateContextType {
	selectedEvent: ExtendedEvent | null;
	setSelectedEvent: (event: ExtendedEvent | null) => void;
	templateImage: string | null;
	setTemplateImage: (image: string | null) => void;
	sections: Section[];
	setSections: (sections: Section[]) => void;
	csvData: CSVData | null;
	uploadCSV: boolean;
	setUploadCSV: (value: boolean) => void;
	setCsvData: (data: CSVData | null) => void;
	csvStepCompleted: boolean;
	setCsvStepCompleted: (completed: boolean) => void;
	variableMappingCompleted: boolean;
	setVariableMappingCompleted: (completed: boolean) => void;
	variableMapping: Record<string, string>;
	setVariableMapping: (
		mapping:
			| Record<string, string>
			| ((prev: Record<string, string>) => Record<string, string>),
	) => void;
	extraDataMapping: Record<string, string>;
	setExtraDataMapping: (
		mapping:
			| Record<string, string>
			| ((prev: Record<string, string>) => Record<string, string>),
	) => void;
	usnColumn: string | null;
	setUsnColumn: (column: string | null) => void;
	filenameFormat: string[];
	setFilenameFormat: (
		format: string[] | ((prev: string[]) => string[]),
	) => void;
	missingUsns: string[];
	setMissingUsns: (usns: string[]) => void;
	generatedCertificates: Array<{
		usn: string;
		name: string;
		email: string;
		certificateUrl: string;
		filename?: string;
		prizeType?: string;
	}>;
	setGeneratedCertificates: (
		certificates: Array<{
			usn: string;
			name: string;
			email: string;
			certificateUrl: string;
			filename?: string;
			prizeType?: string;
		}>,
	) => void;
	resetCertificateData: () => void;
}

const CertificateContext = createContext<CertificateContextType | null>(null);

export function CertificateProvider({ children }: { children: ReactNode }) {
	const { hasPerm } = useDashboardData();

	const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(
		null,
	);

	const [templateImage, setTemplateImage] = useState<string | null>(null);
	const [sections, setSections] = useState<Section[]>([]);
	const [csvData, setCsvData] = useState<CSVData | null>(null);
	const [uploadCSV, setUploadCSV] = useState(false);
	const [csvStepCompleted, setCsvStepCompleted] = useState(false);
	const [variableMappingCompleted, setVariableMappingCompleted] =
		useState(false);
	const [variableMapping, setVariableMapping] = useState<
		Record<string, string>
	>({});
	const [extraDataMapping, setExtraDataMapping] = useState<
		Record<string, string>
	>({});
	const [usnColumn, setUsnColumn] = useState<string | null>(null);
	const [filenameFormat, setFilenameFormat] = useState<string[]>([]);
	const [missingUsns, setMissingUsns] = useState<string[]>([]);
	const [generatedCertificates, setGeneratedCertificates] = useState<
		Array<{
			usn: string;
			name: string;
			email: string;
			certificateUrl: string;
			filename?: string;
			prizeType?: string;
		}>
	>([]);

	useEffect(() => {
		console.log(uploadCSV, csvData);
	}, [uploadCSV, csvData]);

	const resetCertificateData = () => {
		setSelectedEvent(null);
		setTemplateImage(null);
		setSections([]);
		setCsvData(null);
		setUploadCSV(false);
		setCsvStepCompleted(false);
		setVariableMappingCompleted(false);
		setVariableMapping({});
		setExtraDataMapping({});
		setUsnColumn(null);
		setFilenameFormat([]);
		setMissingUsns([]);
		setGeneratedCertificates([]);
	};

	return (
		<CertificateContext.Provider
			value={{
				selectedEvent,
				setSelectedEvent,
				templateImage,
				setTemplateImage,
				sections,
				setSections,
				csvData,
				uploadCSV,
				setUploadCSV,
				setCsvData,
				csvStepCompleted,
				setCsvStepCompleted,
				variableMappingCompleted,
				setVariableMappingCompleted,
				variableMapping,
				setVariableMapping,
				extraDataMapping,
				setExtraDataMapping,
				usnColumn,
				setUsnColumn,
				filenameFormat,
				setFilenameFormat,
				missingUsns,
				setMissingUsns,
				generatedCertificates,
				setGeneratedCertificates,
				resetCertificateData,
			}}
		>
			{children}
		</CertificateContext.Provider>
	);
}

export function useCertificateContext() {
	const context = useContext(CertificateContext);
	if (!context) {
		throw new Error(
			"useCertificateContext must be used within a CertificateProvider",
		);
	}
	return context;
}
