export const AccessDenied = () => {
	return (
		<>
			<div className="bg-gray-100 dark:bg-slate-800 rounded-full p-6 mb-4 shadow-md">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-12 w-12 text-gray-400 dark:text-slate-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<title>Access Denied Icon</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M16 11V7a4 4 0 10-8 0v4M5 11h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z"
					/>
				</svg>
			</div>
			<p className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">
				Access Denied
			</p>
		</>
	);
};
