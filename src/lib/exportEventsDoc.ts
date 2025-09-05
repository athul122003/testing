import { saveAs } from "file-saver";
import {
	Document,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	WidthType,
	HeadingLevel,
	AlignmentType,
	BorderStyle,
} from "docx";

import { TextRun, VerticalAlign } from "docx";

function makeRow(cells: string[], opts: { bold?: boolean } = {}) {
	return new TableRow({
		children: cells.map(
			(cell) =>
				new TableCell({
					children: [
						new Paragraph({
							children: [new TextRun({ text: cell, bold: opts.bold || false })],
							alignment: AlignmentType.CENTER,
						}),
					],
					verticalAlign: VerticalAlign.CENTER,
					margins: { top: 100, bottom: 100, left: 100, right: 100 },
				}),
		),
	});
}

type ExportEvent = { name?: string };
type ExportMember = { id: number | string; name: string };
type ExportTeam = {
	id: string;
	name: string;
	leaderId?: number;
	isConfirmed: boolean;
	leaderName?: string;
	members: ExportMember[];
};

export async function exportParticipantsDocx(
	event: ExportEvent,
	teams: ExportTeam[],
) {
	const attendanceTable = new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [
			makeRow(
				["Team Name", "Leader Name", "FLC Id", "Member Name", "Signature"],
				{ bold: true },
			),
			...teams.flatMap((team) => {
				const members =
					team.members.length > 0 ? team.members : [{ name: "-", id: 0 }];
				return members.map((member, idx) =>
					makeRow([
						idx === 0 ? team.name : "",
						idx === 0 ? team.leaderName || "-" : "",
						String(member.id || "-"),
						member.name,
						"",
					]),
				);
			}),
		],
		borders: {
			top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
		},
	});

	const summaryTable = new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [
			makeRow(["Teams Confirmed", "Teams Attended"], { bold: true }),
			makeRow([String(teams.length), ""]),
		],
		borders: {
			top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
		},
	});

	const signaturesTable = new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [
			makeRow(
				[
					"Operations Manager",
					"Vice President",
					"President",
					"Faculty Coordinator",
				],
				{ bold: true },
			),
			new TableRow({
				children: ["", "", "", ""].map(
					(cell) =>
						new TableCell({
							children: [
								new Paragraph({
									children: [new TextRun({ text: cell })],
									alignment: AlignmentType.CENTER,
								}),
							],
							verticalAlign: VerticalAlign.CENTER,
							margins: { top: 100, bottom: 100, left: 100, right: 100 },
						}),
				),
				height: { value: 700, rule: "atLeast" },
			}),
		],
		borders: {
			top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
		},
	});

	const doc = new Document({
		sections: [
			{
				children: [
					new Paragraph({
						text: `${event?.name ?? "Event Export"} - Attendance Sheet`,
						heading: HeadingLevel.HEADING_1,
						alignment: AlignmentType.LEFT,
						spacing: { after: 200 },
					}),
					attendanceTable,
					new Paragraph({
						text: "Summary",
						heading: HeadingLevel.HEADING_2,
						alignment: AlignmentType.CENTER,
						pageBreakBefore: true,
						spacing: { after: 100 },
					}),
					summaryTable,
					new Paragraph({ text: " ", spacing: { after: 100 } }),
					new Paragraph({
						text: "Signatures",
						heading: HeadingLevel.HEADING_2,
						alignment: AlignmentType.CENTER,
						spacing: { after: 100 },
					}),
					signaturesTable,
				],
			},
		],
	});

	const blob = await Packer.toBlob(doc);
	saveAs(blob, `${event?.name ?? "Event Export"}-Attendance.docx`);
}
