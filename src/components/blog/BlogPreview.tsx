"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

type BlogPreviewProps = {
	title?: string;
	excerpt?: string;
	content: string;
};

export function BlogPreview({ title, excerpt, content }: BlogPreviewProps) {
	return (
		<div className="prose prose-gray dark:prose-invert max-w-none">
			<h1 className="text-3xl font-bold mb-4">{title || "Blog Title"}</h1>

			{excerpt && (
				<p className="text-lg text-gray-600 dark:text-gray-400 italic mb-6">
					{excerpt}
				</p>
			)}

			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight]}
				components={{
					img: ({ node, ...props }) => (
						<img
							{...props}
							className="mx-auto my-4 rounded-lg shadow-md max-w-full"
							alt={props.alt || "Blog image"}
						/>
					),
					a: ({ node, ...props }) => (
						<a
							{...props}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						/>
					),
					ul: ({ node, ...props }) => (
						<ul {...props} className="list-disc ml-6" />
					),
					li: ({ node, ...props }) => <li {...props} className="my-1" />,
					code({ node, className, children, ...props }) {
						const isInline =
							node?.position?.start.line === node?.position?.end.line;

						return isInline ? (
							<code
								{...props}
								className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm"
							>
								{children}
							</code>
						) : (
							<pre className={className}>
								<code {...props}>{children}</code>
							</pre>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
