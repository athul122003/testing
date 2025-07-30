import type { PrizeType } from "@prisma/client";

export interface EventParticipant {
	usn: string;
	name: string;
	email: string;
	teamName: string;
	prizeType?: PrizeType;
	isTeamLeader: boolean;
}

export interface DatabaseVariable {
	key: string;
	label: string;
	type: "user" | "event" | "prize" | "team";
	description?: string;
}

export const availableVariables: DatabaseVariable[] = [
	// User variables
	{
		key: "usn",
		label: "USN",
		type: "user",
		description: "University Seat Number",
	},
	{
		key: "name",
		label: "Full Name",
		type: "user",
		description: "User's full name",
	},
	{
		key: "email",
		label: "Email",
		type: "user",
		description: "User's email address",
	},

	// Event variables
	{
		key: "eventName",
		label: "Event Name",
		type: "event",
		description: "Name of the event",
	},
	{
		key: "eventVenue",
		label: "Event Venue",
		type: "event",
		description: "Venue where event was held",
	},
	{
		key: "eventType",
		label: "Event Type",
		type: "event",
		description: "Type of the event",
	},
	{
		key: "eventCategory",
		label: "Event Category",
		type: "event",
		description: "Category of the event",
	},
	{
		key: "eventFromDate",
		label: "Event Start Date",
		type: "event",
		description: "Event start date",
	},
	{
		key: "eventToDate",
		label: "Event End Date",
		type: "event",
		description: "Event end date",
	},

	// Prize variables
	{
		key: "prizeType",
		label: "Prize Type",
		type: "prize",
		description: "Type of prize won",
	},
	{
		key: "prizePosition",
		label: "Prize Position",
		type: "prize",
		description: "Position/rank achieved",
	},

	// Team variables
	{
		key: "teamName",
		label: "Team Name",
		type: "team",
		description: "Name of the team",
	},
	{
		key: "isTeamLeader",
		label: "Team Leader Status",
		type: "team",
		description: "Whether user is team leader",
	},
];
