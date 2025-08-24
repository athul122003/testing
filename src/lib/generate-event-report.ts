import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Member = {
	id: number;
	name: string;
	email: string;
	usn: string;
	hasAttended: boolean;
	isLeader?: boolean;
};

type Team = {
	id: string;
	name: string;
	leader: {
		id: number;
		name: string;
		email: string;
		usn: string;
	} | null;
	members: Member[];
	prizeType: string;
	flcPoints: number;
};

export function generateEventReport(eventName: string, teams: Team[]): string {
	const doc = new jsPDF();

	doc.setProperties({
		title: `${eventName} - Event Report`,
		creator: "FLC Dashboard",
		author: "Finite Loop Club",
	});

	doc.setFillColor(20, 23, 45);
	doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, "F");

	doc.setFontSize(20);
	doc.setTextColor(255, 255, 255);
	doc.setFont("helvetica", "bold");
	doc.text(`${eventName}`, 105, 15, { align: "center" });

	doc.setFontSize(16);
	doc.text("Final Report", 105, 25, { align: "center" });

	doc.setFontSize(10);
	doc.setTextColor(80, 80, 80);
	doc.setFont("helvetica", "normal");

	const date = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	doc.text(`Total Teams: ${teams.length}`, 15, 57);
	doc.text(
		`Total Members: ${teams.reduce((sum, team) => sum + team.members.length, 0)}`,
		15,
		64,
	);

	doc.setFontSize(12);
	doc.setTextColor(20, 23, 45);
	doc.setFont("helvetica", "bold");
	doc.text("Prize Distribution:", 120, 50);

	const prizeOrder = [
		"Winner",
		"Runner Up",
		"Second Runner Up",
		"Participation",
	];
	const prizeCounts: Record<string, number> = {};

	const normalizedCounts: Record<string, number> = {
		Winner: 0,
		"Runner Up": 0,
		"Second Runner Up": 0,
		Participation: 0,
	};

	const normalizePrizeType = (prize: string): string => {
		const lowerPrize = prize.toLowerCase();
		console.log("Normalizing prize type:", prize.toLowerCase());
		if (lowerPrize.includes("winner")) {
			return "Winner";
		} else if (lowerPrize.startsWith("runner_up")) {
			return "Runner Up";
		} else if (lowerPrize.startsWith("second")) {
			return "Second Runner Up";
		} else if (lowerPrize.includes("participation")) {
			return "Participation";
		} else {
			return "";
		}
	};

	teams.forEach((team) => {
		const normalizedType = normalizePrizeType(team.prizeType);
		normalizedCounts[normalizedType]++;
	});

	doc.setFontSize(10);
	doc.setTextColor(80, 80, 80);
	doc.setFont("helvetica", "normal");

	let yPos = 57;
	prizeOrder.forEach((prizeType) => {
		console.log(normalizedCounts);
		if (normalizedCounts[prizeType] > 0) {
			doc.text(`${prizeType}: ${normalizedCounts[prizeType]}`, 120, yPos);
			yPos += 7;
		}
	});

	Object.entries(prizeCounts).forEach(([prizeType, count]) => {
		doc.text(`${prizeType}: ${count}`, 120, yPos);
		yPos += 7;
	});

	doc.setFontSize(14);
	doc.setTextColor(20, 23, 45);
	doc.setFont("helvetica", "bold");
	doc.text("Teams and Attendance Details", 105, 90, { align: "center" });

	const tableData: (
		| string
		| number
		| {
				content: string;
				colSpan?: number;
				rowSpan?: number;
				styles?: { cellPadding?: number };
		  }
	)[][] = [];

	const sortedTeams = [...teams].sort((a, b) => {
		const prizeOrder: { [key: string]: number } = {
			WINNER: 1,
			RUNNER_UP: 2,
			SECOND_RUNNER_UP: 3,
			PARTICIPATION: 4,
		};

		const aOrder = prizeOrder[a.prizeType] || 5;
		const bOrder = prizeOrder[b.prizeType] || 5;

		if (aOrder === bOrder) {
			return a.name.localeCompare(b.name);
		}

		return aOrder - bOrder;
	});

	const teamsByPrize: { [prizeType: string]: Team[] } = {};

	sortedTeams.forEach((team) => {
		const prizeType = team.prizeType;
		if (!teamsByPrize[prizeType]) {
			teamsByPrize[prizeType] = [];
		}
		teamsByPrize[prizeType].push(team);
	});

	const prizeTypes = Object.keys(teamsByPrize).sort((a, b) => {
		const prizeOrder: { [key: string]: number } = {
			WINNER: 1,
			RUNNER_UP: 2,
			SECOND_RUNNER_UP: 3,
			PARTICIPATION: 4,
		};

		return (prizeOrder[a] || 5) - (prizeOrder[b] || 5);
	});

	prizeTypes.forEach((prizeType) => {
		const teamsWithPrize = teamsByPrize[prizeType];

		teamsWithPrize.forEach((team) => {
			tableData.push([
				team.name,
				team.members[0]?.name || "-",
				team.members[0]?.usn || "-",
				team.members[0]?.hasAttended ? "PR" : "AB",
				{
					content: team.prizeType.replaceAll("_", " "),
					rowSpan: team.members.length,
				},
			]);

			for (let i = 1; i < team.members.length; i++) {
				const member = team.members[i];
				tableData.push([
					"",
					member.name,
					member.usn,
					member.hasAttended ? "PR" : "AB",
				]);
			}

			tableData.push([
				{
					content: "",
					colSpan: 5,
					styles: { cellPadding: 2 },
				},
			]);
		});
	});

	autoTable(doc, {
		head: [
			["Team Name", "Team Members", "USN", "Attendance", "Prize Category"],
		],
		body: tableData,
		startY: 95,
		margin: { left: 10, right: 10, bottom: 20 },
		rowPageBreak: "avoid",
		pageBreak: "auto",
		showFoot: "never",
		tableWidth: "auto",
		headStyles: {
			fillColor: [20, 23, 45],
			textColor: 255,
			fontStyle: "bold",
			halign: "center",
			fontSize: 10,
			cellPadding: 5,
			minCellHeight: 14,
			overflow: "linebreak",
			lineWidth: 0.5,
		},
		alternateRowStyles: {
			fillColor: [240, 245, 250],
		},
		didDrawPage: (data) => {
			if (data.pageNumber > 1) {
				doc.setFillColor(20, 23, 45);
				doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, "F");

				doc.setFontSize(12);
				doc.setTextColor(255, 255, 255);
				doc.setFont("helvetica", "bold");
				doc.text(`${eventName} - Final Report (Continued)`, 105, 12, {
					align: "center",
				});
			}

			const pageSize = doc.internal.pageSize;
			const pageHeight = pageSize.height
				? pageSize.height
				: pageSize.getHeight();

			doc.setFillColor(240, 240, 240);
			doc.rect(0, pageHeight - 25, doc.internal.pageSize.getWidth(), 25, "F");

			doc.setFontSize(10);
			doc.setTextColor(20, 23, 45);
			doc.setFont("helvetica", "bold");
			doc.text(`Page ${data.pageNumber}`, 105, pageHeight - 15, {
				align: "center",
			});

			doc.text("Finite Loop Club NMAMIT", 190, pageHeight - 15, {
				align: "right",
			});

			doc.text(`Generated on ${date}`, 15, pageHeight - 15, { align: "left" });

			data.settings.margin.bottom = 20;
		},
		styles: {
			overflow: "linebreak",
			cellPadding: 4,
			fontSize: 10,
			valign: "middle",
			halign: "left",
			lineWidth: 0.5,
			cellWidth: "auto",
		},
		columnStyles: {
			0: { cellWidth: 45, fontStyle: "bold" },
			1: { cellWidth: 45 },
			2: { cellWidth: 35 },
			3: { cellWidth: 20, halign: "center" },
			4: { cellWidth: 40 },
		},
		bodyStyles: {
			lineColor: [220, 220, 220],
			minCellHeight: 14,
		},
		theme: "grid",
	});

	const pdfDataUri = doc.output("datauristring");
	return pdfDataUri;
}
