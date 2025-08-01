export interface TextSegment {
	id: string;
	text: string;
	isVariable: boolean;
	variableName?: string;
	fontSize?: number;
	fontFamily?: string;
	color?: string;
	fontWeight?: string;
	textDecoration?: string;
}

export interface Section {
	id: string;
	name: string;
	x: number;
	y: number;
	textAlign: "left" | "center" | "right";
	maxWidth?: number;
	segments: TextSegment[];
	rawText: string;
	defaultFontSize: number;
	defaultFontFamily: string;
	defaultColor: string;
	defaultFontWeight: string;
	defaultTextDecoration: string;
}

export interface CSVData {
	headers: string[];
	rows: Record<string, string>[];
}

export interface GeneratedCertificate {
	id: string;
	filename: string;
	dataUrl: string;
	rowData: Record<string, string>;
}

export interface Variable {
	name: string;
	sections: string[];
}
