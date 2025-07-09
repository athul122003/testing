// utils/markdownFormatters.ts

export type FormatType = "bold" | "italic" | "list" | "link";

export function formatMarkdownText({
	content,
	type,
	start,
	end,
}: {
	content: string;
	type: FormatType;
	start: number;
	end: number;
}): string {
	const selectedText = content.substring(start, end);
	let formatted = selectedText;

	switch (type) {
		case "bold":
			formatted = `**${selectedText}**`;
			break;
		case "italic":
			formatted = `*${selectedText}*`;
			break;
		case "list":
			formatted = `\n- ${selectedText}`;
			break;
		case "link":
			formatted = `[${selectedText}](url)`;
			break;
	}

	return content.substring(0, start) + formatted + content.substring(end);
}
