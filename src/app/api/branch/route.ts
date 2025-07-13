import { NextResponse } from "next/server";
import { getBranchData } from "~/actions/branch";

// NOT DONE, DONT USE THIS AS IT MIGHT BE REMOVED IN THE FUTURE

export async function GET() {
	try {
		const branches = await getBranchData();
		return NextResponse.json(branches, { status: 200 });
	} catch (error) {
		console.error("Error fetching branches:", error);
		return NextResponse.json(
			{ error: "Failed to fetch branches" },
			{ status: 500 },
		);
	}
}
