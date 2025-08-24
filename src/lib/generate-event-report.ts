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

type CustomPrizeType = {
	id: string;
	name: string;
	teams: {
		id: string;
		name: string;
		leaderName?: string;
		members: { id: number; name: string }[];
	}[];
};

type ReportData = {
	customPrizeTypes?: CustomPrizeType[];
	participatingTeams?: any[];
} & Team[];

export function generateEventReport(
	eventName: string,
	teams: Team[] | any,
): string {
	const doc = new jsPDF();

	let teamsArray: Team[] = [];
	if (
		typeof teams === "object" &&
		!Array.isArray(teams) &&
		"customPrizeTypes" in teams
	) {
		const { customPrizeTypes, participatingTeams } = teams;

		customPrizeTypes.forEach((prizeType: CustomPrizeType) => {
			prizeType.teams.forEach((team: any) => {
				teamsArray.push({
					id: team.id,
					name: team.name,
					leader: team.leaderName
						? {
								id: 0,
								name: team.leaderName,
								email: "",
								usn: "",
							}
						: null,
					members: team.members.map((member: any, index: number) => ({
						id: member.id,
						name: member.name,
						email: member.email || "",
						usn: member.usn || "",
						hasAttended: true,
						isLeader: index === 0,
					})),
					prizeType: prizeType.name.toUpperCase().replace(/\s+/g, "_"),
					flcPoints: 0,
				});
			});
		});

		participatingTeams.forEach((team: any) => {
			teamsArray.push({
				id: team.id,
				name: team.name,
				leader: team.leaderName
					? {
							id: 0,
							name: team.leaderName,
							email: "",
							usn: "",
						}
					: null,
				members: team.members.map((member: any, index: number) => ({
					id: member.id,
					name: member.name,
					email: member.email || "",
					usn: member.usn || "",
					hasAttended: true,
					isLeader: index === 0,
				})),
				prizeType: "PARTICIPATION",
				flcPoints: 0,
			});
		});
	} else {
		teamsArray = Array.isArray(teams) ? teams : [];
	}

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

	doc.text(`Total Teams: ${teamsArray.length}`, 15, 57);
	doc.text(
		`Total Members: ${teamsArray.reduce((sum: number, team: Team) => sum + team.members.length, 0)}`,
		15,
		64,
	);

	doc.setFontSize(12);
	doc.setTextColor(20, 23, 45);
	doc.setFont("helvetica", "bold");
	doc.text("Prize Distribution:", 120, 50);

	const prizeTypeCounts: Record<string, number> = {};

	teamsArray.forEach((team: Team) => {
		const prizeType = team.prizeType;
		prizeTypeCounts[prizeType] = (prizeTypeCounts[prizeType] || 0) + 1;
	});

	const getPrizeDisplayName = (prizeType: string): string => {
		switch (prizeType) {
			case "WINNER":
				return "Winner";
			case "RUNNER_UP":
				return "Runner Up";
			case "SECOND_RUNNER_UP":
				return "Second Runner Up";
			case "PARTICIPATION":
				return "Participation";
			default:
				return prizeType
					.split("_")
					.map(
						(word) =>
							word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
					)
					.join(" ");
		}
	};

	const getPrizeOrder = (prizeType: string): number => {
		switch (prizeType) {
			case "WINNER":
				return 1;
			case "RUNNER_UP":
				return 2;
			case "SECOND_RUNNER_UP":
				return 3;
			case "PARTICIPATION":
				return 1000;
			default:
				return 500;
		}
	};

	const sortedPrizeTypes = Object.keys(prizeTypeCounts).sort((a, b) => {
		const aOrder = getPrizeOrder(a);
		const bOrder = getPrizeOrder(b);

		if (aOrder === bOrder) {
			return a.localeCompare(b);
		}

		return aOrder - bOrder;
	});

	doc.setFontSize(10);
	doc.setTextColor(80, 80, 80);
	doc.setFont("helvetica", "normal");

	let yPos = 57;
	sortedPrizeTypes.forEach((prizeType) => {
		const count = prizeTypeCounts[prizeType];
		if (count > 0) {
			const displayName = getPrizeDisplayName(prizeType);
			doc.text(`${displayName}: ${count}`, 120, yPos);
			yPos += 7;
		}
	});

	const titleYPos = Math.max(80, yPos + 8);
	doc.setFontSize(14);
	doc.setTextColor(20, 23, 45);
	doc.setFont("helvetica", "bold");
	doc.text("Teams and Attendance Details", 105, titleYPos, { align: "center" });

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

	const sortedTeams = [...teamsArray].sort((a, b) => {
		const getPrizeOrder = (prizeType: string): number => {
			switch (prizeType) {
				case "WINNER":
					return 1;
				case "RUNNER_UP":
					return 2;
				case "SECOND_RUNNER_UP":
					return 3;
				case "PARTICIPATION":
					return 1000;
				default:
					return 500;
			}
		};

		const aOrder = getPrizeOrder(a.prizeType);
		const bOrder = getPrizeOrder(b.prizeType);

		if (aOrder === bOrder) {
			if (aOrder === 500) {
				const prizeCompare = a.prizeType.localeCompare(b.prizeType);
				if (prizeCompare !== 0) return prizeCompare;
			}
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
		const getPrizeOrder = (prizeType: string): number => {
			switch (prizeType) {
				case "WINNER":
					return 1;
				case "RUNNER_UP":
					return 2;
				case "SECOND_RUNNER_UP":
					return 3;
				case "PARTICIPATION":
					return 1000;
				default:
					return 500;
			}
		};

		const aOrder = getPrizeOrder(a);
		const bOrder = getPrizeOrder(b);

		if (aOrder === bOrder) {
			return a.localeCompare(b);
		}

		return aOrder - bOrder;
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
		startY: titleYPos + 2,
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
