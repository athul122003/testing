import { Input } from "./input";

export function Scanner({ onScan }: { onScan: (teamId: string) => void }) {
	return (
		<div className="p-4 border rounded bg-slate-100 dark:bg-slate-800">
			<p className="mb-2">Scanner (Simulated)</p>
			<Input
				placeholder="Scan team ID"
				onKeyDown={(e) => {
					if (e.key === "Enter") onScan(e.currentTarget.value);
				}}
			/>
		</div>
	);
}
