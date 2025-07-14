import { NextResponse, type NextRequest } from "next/server";
import { getLeaderboardData, getRankOfUser } from "~/actions/leaderboard";

// NOT DONE, DONT USE THIS AS IT MIGHT BE REMOVED IN THE FUTURE

export async function GET(req: NextRequest) {
	try {
		const url = req.nextUrl;
		const action = url.pathname.split("/").pop();

		let body: unknown = {};
		if (action !== "getAll") {
			body = await req.json();
		}

		switch (action) {
			case "getAll": {
				const leaderboard = await getLeaderboardData();
				return NextResponse.json(leaderboard, { status: 200 });
			}
			case "getRank": {
				const { userId } = body as { userId: number };
				const res = await getRankOfUser(userId);
				return NextResponse.json(res, { status: res.success ? 200 : 400 });
			}
			default: {
				return NextResponse.json(
					{ success: false, error: "Unknown action" },
					{ status: 400 },
				);
			}
		}
	} catch (error) {
		console.error("Route error:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 },
		);
	}
}
