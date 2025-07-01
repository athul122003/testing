export function formatDateTime(date: Date) {
	const formattedDate = date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

	const formattedTime = date.toLocaleTimeString("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return { date: formattedDate, time: formattedTime };
}
