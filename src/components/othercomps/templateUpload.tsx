import React, { useCallback } from "react";
import { Upload, FileImage, CheckCircle } from "lucide-react";

interface TemplateUploadProps {
	onImageUpload: (imageDataUrl: string) => void;
	onNext: () => void;
	templateImage: string | null;
}

export default function TemplateUpload({
	onImageUpload,
	onNext,
	templateImage,
}: TemplateUploadProps) {
	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file && file.type.startsWith("image/")) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result as string;
					onImageUpload(result);
				};
				reader.readAsDataURL(file);
			}
		},
		[onImageUpload],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const file = event.dataTransfer.files[0];
			if (file && file.type.startsWith("image/")) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result as string;
					onImageUpload(result);
				};
				reader.readAsDataURL(file);
			}
		},
		[onImageUpload],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
		},
		[],
	);

	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Upload Certificate Template
				</h2>
				<p className="text-gray-600 dark:text-slate-400">
					Start by uploading your certificate template image
				</p>
			</div>

			{!templateImage ? (
				// biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-300 cursor-pointer bg-gray-50 dark:bg-slate-900"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onClick={() => document.getElementById("file-input")?.click()}
				>
					<Upload className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">
						Drop your template here
					</h3>
					<p className="text-gray-500 dark:text-slate-400 mb-4">
						or click to browse files
					</p>
					<div className="flex justify-center">
						<span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-700">
							PNG, JPG, JPEG up to 10MB
						</span>
					</div>
					<input
						id="file-input"
						type="file"
						accept="image/*"
						onChange={handleFileUpload}
						className="hidden"
					/>
				</div>
			) : (
				<div className="space-y-6">
					<div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
						<div className="flex items-center justify-center mb-4">
							<CheckCircle className="w-6 h-6 text-green-500 mr-2" />
							<span className="text-green-600 dark:text-green-400 font-medium">
								Template uploaded successfully!
							</span>
						</div>
						<div className="flex justify-center">
							<img
								src={templateImage}
								alt="Certificate template"
								className="max-w-full max-h-96 rounded-lg shadow-md border border-gray-200 dark:border-slate-600"
							/>
						</div>
					</div>

					<div className="flex justify-center space-x-4">
						<button
							type="button"
							onClick={() => document.getElementById("file-input")?.click()}
							className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium border border-gray-200 dark:border-slate-600"
						>
							Change Template
						</button>
						<button
							type="button"
							onClick={onNext}
							className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
						>
							Next: Add Placeholders
						</button>
					</div>

					<input
						id="file-input"
						type="file"
						accept="image/*"
						onChange={handleFileUpload}
						className="hidden"
					/>
				</div>
			)}
		</div>
	);
}
