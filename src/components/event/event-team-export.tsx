type Member = {
	id: number;
	name: string;
	email: string;
	phone: string;
};

type Team = {
	id: string;
	name: string;
	leaderId?: number;
	isConfirmed: boolean;
	leaderName?: string;
	leaderPhone?: string;
	members: Member[];
	yearOfStudy?: number | null;
};

export function exportTeamsDetailsPDF(
	event: any,
	teams: Team[],
	includeUnconfirmed: boolean = false,
) {
	const sortedTeams = sortTeamsForExport(teams, includeUnconfirmed);

	const stats = generateTeamStatistics(teams, event);

	const html = `
		<html>
		<head>
			<title>${event?.name ?? "Event"} - Team Details Export</title>
			<style>
				body { 
					font-family: Arial, sans-serif; 
					margin: 20px;
					font-size: 12px;
				}
				.header {
					text-align: center;
					margin-bottom: 30px;
					border-bottom: 2px solid #333;
					padding-bottom: 15px;
				}
				.summary {
					margin-bottom: 25px;
					background: #f8f9fa;
					padding: 15px;
					border-radius: 5px;
				}
				.summary h3 {
					margin-top: 0;
					color: #333;
				}
				.stats-table {
					width: 100%;
					border-collapse: collapse;
					margin-bottom: 15px;
				}
				.stats-table th, .stats-table td {
					border: 1px solid #ddd;
					padding: 8px;
					text-align: center;
				}
				.stats-table th {
					background: #e9ecef;
					font-weight: bold;
				}
				.main-table {
					width: 100%;
					border-collapse: collapse;
					margin-top: 10px;
				}
				.main-table th, .main-table td {
					border: 1px solid #333;
					padding: 6px;
					text-align: left;
					vertical-align: top;
				}
				.main-table th {
					background: #f3f3f3;
					font-weight: bold;
					text-align: center;
				}
				.team-name {
					font-weight: bold;
					color: #2c3e50;
				}
				.year-badge {
					background: #007bff;
					color: white;
					padding: 2px 6px;
					border-radius: 3px;
					font-size: 10px;
				}
				.leader-badge {
					background: #28a745;
					color: white;
					padding: 1px 4px;
					border-radius: 2px;
					font-size: 9px;
					margin-left: 5px;
				}
				.confirmed {
					color: #28a745;
					font-weight: bold;
				}
				.unconfirmed {
					color: #dc3545;
					font-weight: bold;
				}
				.year-section {
					page-break-before: auto;
					margin-top: 25px;
				}
				.year-header {
					background: #e9ecef;
					padding: 8px;
					font-weight: bold;
					border: 2px solid #333;
					text-align: center;
					margin-top: 6px;
					margin-bottom: 6px;
				}
				@media print {
					.page-break { page-break-before: always; }
					body { margin: 15px; }
				}
			</style>
		</head>
		<body>
			<div class="header">
				<h1>${event?.name ?? "Event"} - Team Details Export</h1>
				<p>Generated on: ${new Date().toLocaleString()}</p>
				<p>Export Type: ${includeUnconfirmed ? "All Teams (Confirmed + Unconfirmed)" : "Confirmed Teams Only"}</p>
			</div>

			<div class="summary">
				<h3>Summary Statistics</h3>
				${stats.summaryHtml}
			</div>

			${generateTeamDetailsTable(sortedTeams, event, includeUnconfirmed)}

			<script>window.print()</script>
		</body>
		</html>
	`;

	const win = window.open("", "_blank");
	if (win) {
		win.document.write(html);
		win.document.close();
	}
}

export function sortTeamsForExport(teams: Team[], includeUnconfirmed: boolean) {
	const confirmedTeams = teams.filter((t) => t.isConfirmed);
	const unconfirmedTeams = teams.filter((t) => !t.isConfirmed);

	const sortTeams = (teamList: Team[]) => {
		return teamList.sort((a, b) => {
			if (a.yearOfStudy && b.yearOfStudy) {
				if (a.yearOfStudy !== b.yearOfStudy) {
					return a.yearOfStudy - b.yearOfStudy;
				}
			} else if (a.yearOfStudy && !b.yearOfStudy) {
				return -1;
			} else if (!a.yearOfStudy && b.yearOfStudy) {
				return 1;
			}

			return a.name.localeCompare(b.name);
		});
	};

	const sortedConfirmed = sortTeams(confirmedTeams);
	const sortedUnconfirmed = sortTeams(unconfirmedTeams);

	return includeUnconfirmed
		? [...sortedConfirmed, ...sortedUnconfirmed]
		: sortedConfirmed;
}

export function generateTeamStatistics(teams: Team[], event: any) {
	const confirmedTeams = teams.filter((t) => t.isConfirmed);
	const unconfirmedTeams = teams.filter((t) => !t.isConfirmed);

	let summaryHtml = `
		<table class="stats-table">
			<tr>
				<th>Total Teams</th>
				<th>Confirmed Teams</th>
				<th>Unconfirmed Teams</th>
			</tr>
			<tr>
				<td>${teams.length}</td>
				<td class="confirmed">${confirmedTeams.length}</td>
				<td class="unconfirmed">${unconfirmedTeams.length}</td>
			</tr>
		</table>
	`;

	if (event?.statusOfBatchRestriction) {
		const yearStats: Record<number, { confirmed: number; total: number }> = {};

		teams.forEach((team) => {
			if (team.yearOfStudy) {
				if (!yearStats[team.yearOfStudy]) {
					yearStats[team.yearOfStudy] = { confirmed: 0, total: 0 };
				}
				yearStats[team.yearOfStudy].total++;
				if (team.isConfirmed) {
					yearStats[team.yearOfStudy].confirmed++;
				}
			}
		});

		if (Object.keys(yearStats).length > 0) {
			summaryHtml += `
				<h4>Year-wise Distribution</h4>
				<table class="stats-table">
					<tr>
						<th>Year of Study</th>
						<th>Total Teams</th>
						<th>Confirmed Teams</th>
						<th>Unconfirmed Teams</th>
					</tr>
					${Object.entries(yearStats)
						.sort(([a], [b]) => Number(a) - Number(b))
						.map(
							([year, stats]) => `
							<tr>
								<td>Year ${year}</td>
								<td>${stats.total}</td>
								<td class="confirmed">${stats.confirmed}</td>
								<td class="unconfirmed">${stats.total - stats.confirmed}</td>
							</tr>
						`,
						)
						.join("")}
				</table>
			`;
		}
	}

	return { summaryHtml };
}

export function generateTeamDetailsTable(
	teams: Team[],
	event: any,
	includeUnconfirmed: boolean,
) {
	const hasYearColumn =
		event?.statusOfBatchRestriction && teams.some((t) => t.yearOfStudy);

	let currentYear: number | null = null;
	let currentStatus: "confirmed" | "unconfirmed" | null = null;
	let tableHtml = "";
	let hasOpenTable = false;

	if (!hasYearColumn) {
		hasOpenTable = true;
	}

	teams.forEach((team, teamIndex) => {
		if (includeUnconfirmed && !hasYearColumn) {
			const teamStatus = team.isConfirmed ? "confirmed" : "unconfirmed";
			if (currentStatus !== teamStatus) {
				if (hasOpenTable) {
					tableHtml += "</tbody></table>";
					hasOpenTable = false;
				}
				currentStatus = teamStatus;

				tableHtml += `
					<div class="year-section">
						<div class="year-header">
							${teamStatus === "confirmed" ? "CONFIRMED TEAMS" : "UNCONFIRMED TEAMS"}
						</div>
						<table class="main-table">
							<thead>
								<tr>
									<th>Team Name</th>
									<th>Member Name</th>
									<th>Phone Number</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
				`;
				hasOpenTable = true;
			}
		}

		if (hasYearColumn) {
			if (includeUnconfirmed) {
				const teamStatus = team.isConfirmed ? "confirmed" : "unconfirmed";
				if (currentStatus !== teamStatus) {
					if (hasOpenTable) {
						tableHtml += "</tbody></table>";
						hasOpenTable = false;
					}
					currentStatus = teamStatus;
					currentYear = null;
					tableHtml += `
						<div class="year-section">
							<div class="year-header">
								${teamStatus === "confirmed" ? "CONFIRMED TEAMS" : "UNCONFIRMED TEAMS"}
							</div>
					`;
				}
			}

			if (team.yearOfStudy && currentYear !== team.yearOfStudy) {
				if (hasOpenTable) {
					tableHtml += "</tbody></table>";
					hasOpenTable = false;
				}
				currentYear = team.yearOfStudy;

				tableHtml += `
					${!includeUnconfirmed || teamIndex === 0 ? '<div class="year-section">' : ""}
					<div class="year-header">Year ${team.yearOfStudy}</div>
					<table class="main-table">
						<thead>
							<tr>
								<th>Team Name</th>
								<th>Year</th>
								<th>Member Name</th>
								<th>Phone Number</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
				`;
				hasOpenTable = true;
			} else if (!hasOpenTable) {
				tableHtml += `
					<table class="main-table">
						<thead>
							<tr>
								<th>Team Name</th>
								<th>Year</th>
								<th>Member Name</th>
								<th>Phone Number</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
				`;
				hasOpenTable = true;
			}
		}

		const allMembers = [...team.members];

		if (team.leaderId && !allMembers.find((m) => m.id === team.leaderId)) {
			allMembers.unshift({
				id: team.leaderId,
				name: team.leaderName || "Unknown Leader",
				email: "",
				phone: team.leaderPhone || "",
			});
		}

		allMembers.forEach((member, memberIndex) => {
			const isLeader = member.id === team.leaderId;
			const memberName =
				member.name +
				(isLeader ? ' <span class="leader-badge">LEADER</span>' : "");

			tableHtml += `
				<tr>
					${memberIndex === 0 ? `<td rowspan="${allMembers.length}" class="team-name">${team.name}</td>` : ""}
					${hasYearColumn && memberIndex === 0 ? `<td rowspan="${allMembers.length}"><span class="year-badge">${team.yearOfStudy || "N/A"}</span></td>` : ""}
					<td>${memberName}</td>
					<td>${member.phone || "N/A"}</td>
					${memberIndex === 0 ? `<td rowspan="${allMembers.length}" class="${team.isConfirmed ? "confirmed" : "unconfirmed"}">${team.isConfirmed ? "CONFIRMED" : "UNCONFIRMED"}</td>` : ""}
				</tr>
			`;
		});
	});

	if (hasOpenTable) {
		tableHtml += "</tbody></table>";
	}

	if (includeUnconfirmed || hasYearColumn) {
		tableHtml += "</div>";
	}

	return tableHtml;
}

export function exportTeamsForPrint(event: any, teams: Team[]) {
	console.log(event.name);
	const confirmedCount = teams.length;
	const html = `
	      <html>
	      <head>
		      <title>${event?.name ?? "Event Export"} - Attendance Sheet</title>
					<style>
									body { font-family: sans-serif; }
									table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
									th, td { border: 1px solid #333; padding: 8px; text-align: center; }
									th { background: #f3f3f3; }
									.nowrap { white-space: nowrap; }
									@media print {
										.page-break { page-break-before: always; break-before: page; }
									}
					</style>
	      </head>
	      <body>
		      <h2>${event?.name ?? "Event Export"} - Attendance Sheet</h2>
		      <table>
			      <thead>
				      <tr>
					      <th>Team Name</th>
					      <th>Leader Name</th>
						<th>FLC Id</th>
					      <th>Member Name</th>
					      <th>Signature</th>
				      </tr>
			      </thead>
			      <tbody>
				      ${teams
								.map((team) => {
									const members =
										team.members.length > 0
											? team.members
											: [{ name: "-", id: 0 }];
									return members
										.map(
											(member, idx) => `
					       <tr>
						       ${idx === 0 ? `<td rowspan="${members.length}" class="nowrap">${team.name}</td>` : ""}
						       ${idx === 0 ? `<td rowspan="${members.length}" class="nowrap">${team.leaderName || "-"}</td>` : ""}
							   <td class="nowrap">${member.id || "-"}</td>
						       <td class="nowrap">${member.name}</td>
						       <td style="min-width:120px;"></td>
					       </tr>
				       `,
										)
										.join("");
								})
								.join("")}
			      </tbody>
		      </table>
			  <div class="page-break">
				<h3 style="text-align:center">Summary</h3>
				<table>
				  <thead>
					  <tr>
						  <th>Teams Confirmed</th>
						  <th>Teams Attended</th>
					  </tr>
				  </thead>
				  <tbody>
					  <tr>
						  <td>${confirmedCount}</td>
						  <td></td>
					  </tr>
				  </tbody>
				</table>
				<br>
				<h3 style="text-align:center">Signatures</h3>
				<table>
				  <thead>
					  <tr>
					  <th>Operations Manager</th>
					  <th>Vice President</th>
					  <th>President</th>
						  <th>Faculty Coordinator</th>
					  </tr>
				  </thead>
				  <tbody>
					  <tr style="height: 60px;">
						  <td></td>
						  <td></td>
						  <td></td>
						  <td></td>
					  </tr>
				  </tbody>
				</table>
			  </div>
		      <script>window.print()</script>
	      </body>
	      </html>
       `;
	const win = window.open("", "_blank");
	if (win) {
		win.document.write(html);
		win.document.close();
	}
}
