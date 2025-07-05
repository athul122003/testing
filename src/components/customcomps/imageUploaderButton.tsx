import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type Props = {
	onSuccess: (url: string, info: any) => void;
	buttonText?: string;
	file: File | null;
};

// NOT SURE IF WILL KEEP THIS, BUT ITS A BUTTON TO UPLOAD IMAGES TO CLOUDINARY, IT WORKS WELL ENOUGH

export default function ImageUploader({
	onSuccess,
	buttonText = "Upload Image",
	file,
}: Props) {
	const [image, setImage] = useState<File | null>(null);

	useEffect(() => {
		if (file) {
			setImage(file);
		}
	}, [file]);

	const handleUpload = async () => {
		if (!image) {
			toast.error("Please select an image to upload");
			return;
		}
		const res = await fetch("/api/cloudinary", {
			method: "POST",
			body: image,
			headers: {
				"Content-Type": "application/octet-stream",
			},
		});
		if (!res.ok) {
			const errorData = await res.json();
			toast.error(`Upload failed: ${errorData.error || "Unknown error"}`);
			return;
		}
		const data = await res.json();
		setImage(null);
		onSuccess(data.url, data);
		toast.success("Image uploaded successfully");
	};
	return (
		<div className="space-y-2 w-full cursor-not-allowed">
			<div className="rounded-xl p-8 w-full text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer">
				<Button
					disabled={!image}
					onClick={handleUpload}
					className={`px-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${!image ? "cursor-not-allowed" : "cursor-pointer"}`}
				>
					{buttonText}
				</Button>
				{image && <p className="text-sm mt-2 text-red-500">Upload Pending</p>}
			</div>
		</div>
	);
}
