"use client";

import Image from "next/image";

interface BlogPreviewProps {
	title?: string;
	excerpt?: string;
	content: string;
}

export function BlogPreview({ title, excerpt, content }: BlogPreviewProps) {
	return (
		<div className="prose prose-gray dark:prose-invert max-w-none">
			<h1 className="text-3xl font-bold mb-4">{title || "Blog Title"}</h1>

			{excerpt && (
				<p className="text-lg text-gray-600 dark:text-gray-400 italic mb-6">
					{excerpt}
				</p>
			)}

			<div className="space-y-4">
				{(() => {
					const lines = content.split("\n");
					const elements: React.ReactNode[] = [];

					let currentList: string[] = [];

					lines.forEach((line, index) => {
						const key = `${line}-${index}`;

						const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
						if (imageMatch) {
							elements.push(
								<Image
									key={`img-${key}`}
									src={imageMatch[2]}
									alt={imageMatch[1]}
									width={800}
									height={400}
									className="mx-auto my-4 rounded-lg shadow-md max-w-full"
								/>,
							);
							return;
						}

						if (line.startsWith("- ")) {
							currentList.push(line.slice(2));
							return;
						} else if (currentList.length > 0) {
							elements.push(
								<ul key={`list-${currentList.join("-")}`}>
									{currentList.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>,
							);
							currentList = [];
						}

						if (line.startsWith("**") && line.endsWith("**")) {
							elements.push(
								<p key={`bold-${key}`} className="font-bold">
									{line.slice(2, -2)}
								</p>,
							);
							return;
						}

						if (
							line.startsWith("*") &&
							line.endsWith("*") &&
							!line.startsWith("**")
						) {
							elements.push(
								<p key={`italic-${key}`} className="italic">
									{line.slice(1, -1)}
								</p>,
							);
							return;
						}

						if (line.startsWith("[") && line.includes("](")) {
							const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
							if (match) {
								elements.push(
									<p key={`link-${key}`}>
										<a
											href={match[2]}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-500 hover:underline"
										>
											{match[1]}
										</a>
									</p>,
								);
								return;
							}
						}

						elements.push(
							line ? (
								<p key={`plain-${key}`}>{line}</p>
							) : (
								<br key={`br-${key}`} />
							),
						);
					});

					if (currentList.length > 0) {
						elements.push(
							<ul key={currentList.join("-")} className="ml-4 list-disc">
								{currentList.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>,
						);
					}

					return elements;
				})()}
			</div>
		</div>
	);
}
