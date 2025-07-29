"use client";

import { cn } from "~/lib/utils";

interface HTMLContentProps {
	content: string;
	className?: string;
}

export function HTMLContent({ content, className }: HTMLContentProps) {
	return (
		<div
			className={cn(
				"prose dark:prose-invert max-w-none",
				"prose-headings:text-slate-900 dark:prose-headings:text-white",
				"prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:my-1",
				"prose-a:text-blue-600 dark:prose-a:text-blue-400",
				"prose-strong:text-slate-900 dark:prose-strong:text-white",
				"prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ul:my-2",
				"prose-ol:text-slate-700 dark:prose-ol:text-slate-300 prose-ol:my-2",
				"prose-li:my-0",
				"prose-blockquote:my-2 prose-blockquote:border-l-slate-300 dark:prose-blockquote:border-l-slate-600",
				className,
			)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: safe HTML from rich text editor
			dangerouslySetInnerHTML={{ __html: content }}
		/>
	);
}
