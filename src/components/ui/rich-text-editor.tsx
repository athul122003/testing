"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import { cn } from "~/lib/utils";
import {
	Bold,
	Italic,
	Strikethrough,
	List,
	ListOrdered,
	Quote,
	Undo,
	Redo,
	Link as LinkIcon,
} from "lucide-react";
import { Button } from "./button";
import { useCallback, useEffect, useState } from "react";

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	readOnly?: boolean;
}

export function RichTextEditor({
	value,
	onChange,
	placeholder = "Start typing...",
	className,
	readOnly = false,
}: RichTextEditorProps) {
	// biome-ignore lint/correctness/noUnusedVariables: using the set state, might use it later
	const [lastUpdate, setLastUpdate] = useState(0);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				paragraph: {
					HTMLAttributes: {
						style: "margin: 0.25em 0;",
					},
				},
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
					HTMLAttributes: {
						style: "margin: 0.5em 0; padding-left: 1.5em;",
					},
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
					HTMLAttributes: {
						style: "margin: 0.5em 0; padding-left: 1.5em;",
					},
				},
				listItem: {
					HTMLAttributes: {
						style: "margin: 0.125em 0;",
					},
				},
				blockquote: {
					HTMLAttributes: {
						style:
							"margin: 0.5em 0; padding-left: 1em; border-left: 3px solid #e2e8f0;",
					},
				},
			}),
			TextStyle,
			Color,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-blue-500 hover:text-blue-700 underline",
				},
			}),
		],
		content: value,
		editable: !readOnly,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange(html);
			setLastUpdate(Date.now());
		},
		onSelectionUpdate: () => {
			setLastUpdate(Date.now());
		},
		onTransaction: () => {
			setLastUpdate(Date.now());
		},
		editorProps: {
			attributes: {
				class: cn(
					"prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px] p-4 border-0",
					"prose-headings:text-slate-900 dark:prose-headings:text-white",
					"prose-p:text-slate-700 dark:prose-p:text-slate-300",
					"prose-strong:text-slate-900 dark:prose-strong:text-white",
					"prose-ul:text-slate-700 dark:prose-ul:text-slate-300",
					"prose-ol:text-slate-700 dark:prose-ol:text-slate-300",
				),
				placeholder: placeholder,
			},
		},
	});

	useEffect(() => {
		if (editor && editor.getHTML() !== value) {
			editor.commands.setContent(value);
		}
	}, [value, editor]);

	const isMarkActive = useCallback(
		(markName: string) => {
			if (!editor) return false;

			if (editor.isActive(markName)) return true;

			const storedMarks = editor.state.storedMarks || [];
			return storedMarks.some((mark) => mark.type.name === markName);
		},
		[editor],
	);

	const isNodeActive = useCallback(
		(nodeName: string) => {
			if (!editor) return false;
			return editor.isActive(nodeName);
		},
		[editor],
	);

	const setLink = useCallback(() => {
		if (!editor) return;

		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);

		if (url === null) {
			return;
		}

		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	if (!editor) {
		return (
			<div
				className={cn(
					"rich-text-editor border border-slate-300 dark:border-slate-600 rounded-md",
					className,
				)}
			>
				<div className="border-b border-slate-300 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-800 rounded-t-md">
					<div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
				</div>
				<div className="min-h-[120px] bg-white dark:bg-slate-800 p-3 animate-pulse rounded-b-md">
					<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
					<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
				</div>
			</div>
		);
	}

	if (readOnly) {
		return (
			<div
				className={cn(
					"rich-text-editor border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800",
					className,
				)}
			>
				<EditorContent editor={editor} />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"rich-text-editor border border-slate-300 dark:border-slate-600 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
				className,
			)}
		>
			<div className="border-b border-slate-300 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-800 rounded-t-md">
				<div className="flex flex-wrap items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => {
							editor.chain().focus().toggleBold().run();
						}}
						className={cn(
							"h-8 w-8 p-0",
							isMarkActive("bold") ? "bg-slate-200 dark:bg-slate-700" : "",
						)}
						title="Bold"
					>
						<Bold className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => {
							editor.chain().focus().toggleItalic().run();
						}}
						className={cn(
							"h-8 w-8 p-0",
							isMarkActive("italic") ? "bg-slate-200 dark:bg-slate-700" : "",
						)}
						title="Italic"
					>
						<Italic className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => {
							editor.chain().focus().toggleStrike().run();
						}}
						className={cn(
							"h-8 w-8 p-0",
							isMarkActive("strike") ? "bg-slate-200 dark:bg-slate-700" : "",
						)}
						title="Strikethrough"
					>
						<Strikethrough className="h-4 w-4" />
					</Button>

					<div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						className={cn(
							"h-8 w-8 p-0",
							isNodeActive("bulletList")
								? "bg-slate-200 dark:bg-slate-700"
								: "",
						)}
						title="Bullet List"
					>
						<List className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						className={cn(
							"h-8 w-8 p-0",
							isNodeActive("orderedList")
								? "bg-slate-200 dark:bg-slate-700"
								: "",
						)}
						title="Numbered List"
					>
						<ListOrdered className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						className={cn(
							"h-8 w-8 p-0",
							isNodeActive("blockquote")
								? "bg-slate-200 dark:bg-slate-700"
								: "",
						)}
						title="Quote"
					>
						<Quote className="h-4 w-4" />
					</Button>

					<div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={setLink}
						className={cn(
							"h-8 w-8 p-0",
							isMarkActive("link") ? "bg-slate-200 dark:bg-slate-700" : "",
						)}
						title="Add Link"
					>
						<LinkIcon className="h-4 w-4" />
					</Button>

					<div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => editor.chain().focus().undo().run()}
						disabled={!editor.can().undo()}
						className="h-8 w-8 p-0"
						title="Undo"
					>
						<Undo className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() => editor.chain().focus().redo().run()}
						disabled={!editor.can().redo()}
						className="h-8 w-8 p-0"
						title="Redo"
					>
						<Redo className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="bg-white dark:bg-slate-800 rounded-b-md">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
