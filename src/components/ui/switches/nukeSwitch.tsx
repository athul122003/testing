"use client";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

export default function NukeSwitch() {
	const shutterRef = useRef<HTMLButtonElement>(null);
	const launchBtnRef = useRef<HTMLButtonElement>(null);
	const [shutterOpen, setShutterOpen] = useState(false);
	const [launched, setLaunched] = useState(false);
	const [showLaunchBtn, setShowLaunchBtn] = useState(false);

	// Reset positions on mount
	useEffect(() => {
		if (shutterRef.current) {
			gsap.set(shutterRef.current, { y: 0 });
		}
		if (launchBtnRef.current) {
			gsap.set(launchBtnRef.current, { opacity: 0, scale: 0.8 });
		}
		setShowLaunchBtn(false);
	}, []);

	// Animate launch button only when showLaunchBtn is true
	useEffect(() => {
		if (showLaunchBtn && launchBtnRef.current) {
			gsap.to(launchBtnRef.current, {
				opacity: 1,
				scale: 1,
				duration: 2, // SLOW APPEARANCE
				ease: "power2.out",
			});
		} else if (launchBtnRef.current) {
			gsap.to(launchBtnRef.current, {
				opacity: 0,
				scale: 0.8,
				duration: 0.3,
				ease: "power2.in",
			});
		}
	}, [showLaunchBtn]);

	const handleShutterToggle = () => {
		if (launched) return;
		if (shutterOpen) {
			// Closing shutter
			gsap.to(shutterRef.current, {
				y: 0,
				duration: 0.7,
				ease: "power2.inOut",
				onComplete: () => setShowLaunchBtn(false),
			});
			setShutterOpen(false);
		} else {
			// Opening shutter
			gsap.to(shutterRef.current, {
				y: -160,
				duration: 1.2,
				ease: "power2.inOut",
				onComplete: () => setShowLaunchBtn(true),
			});
			setShutterOpen(true);
		}
	};

	const handleLaunch = () => {
		if (showLaunchBtn && !launched) {
			setLaunched(true);
			gsap.to(launchBtnRef.current, {
				scale: 1.1,
				yoyo: true,
				repeat: 1,
				duration: 0.15,
				ease: "elastic.inOut(1, 0.5)",
				onComplete: () => {
					alert("💥 Launch sequence initiated! DOESNT WORK (YET)");
				},
			});
		}
	};

	return (
		<div className="flex flex-col items-center w-80">
			<div className="relative w-48 h-56 flex items-center justify-center">
				{/* Caution Container */}
				<div className="absolute inset-0 z-0 rounded-2xl overflow-hidden border-4 border-yellow-400 bg-[url('/nuke.png')] shadow-2xl">
					<div className="absolute inset-0 bg-[repeating-linear-gradient(-30deg,#222 0 24px,#ffd600 24px 48px)] opacity-90" />
				</div>

				{/* Shutter Container */}
				<div className="absolute top-12 left-1/2 -translate-x-1/2 w-36 h-36 rounded-xl bg-gray-800 border-8 border-gray-900 shadow-lg z-10 overflow-hidden flex items-start justify-center">
					{/* Shutter */}
					<button
						ref={shutterRef}
						type="button"
						className="relative w-32 h-32 z-20 flex flex-col items-center justify-start cursor-pointer focus:outline-none"
						style={{
							transition: "box-shadow 0.2s",
							boxShadow: shutterOpen
								? "0 2px 8px 0 rgba(0,0,0,0.1)"
								: "0 8px 24px 0 rgba(0,0,0,0.2), 0 2px 8px 0 rgba(0,0,0,0.1)",
							pointerEvents: launched ? "none" : "auto",
							userSelect: "none",
							background: "linear-gradient(to bottom, #d1d5db, #6b7280)",
							opacity: 1,
						}}
						onClick={handleShutterToggle}
						aria-label={shutterOpen ? "Close shutter" : "Open shutter"}
						disabled={launched}
					>
						<p className="text-black">CLICK HERE</p>
						{/* Shutter slats */}
						{["A", "B", "C", "D", "E", "F", "G", "H"].map((slatId) => (
							<div
								key={`shutter-slat-${slatId}`}
								className="w-full h-4 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 border-b-2 border-gray-600"
								style={{
									borderRadius: "4px",
									marginBottom: "6px",
									opacity: 1,
								}}
							/>
						))}
						{/* Handle */}
						<div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-gray-700 rounded-full border-2 border-gray-900 shadow" />
					</button>

					{/* Launch Button OUTSIDE Shutter Button, visually inside */}
					{showLaunchBtn && (
						<button
							ref={launchBtnRef}
							type="button"
							className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 launch-button z-30 rounded-full text-white font-extrabold text-2xl shadow-2xl border-8 border-gray-900 transition-all
                                ${
																	launched
																		? "bg-gradient-to-b from-gray-400 to-gray-600 cursor-not-allowed"
																		: "bg-gradient-to-b from-red-500 via-red-400 to-red-700 hover:from-red-600 hover:to-red-900"
																}`}
							disabled={!showLaunchBtn || launched}
							onClick={handleLaunch}
							style={{
								boxShadow:
									"0 6px 32px 0 rgba(255,0,0,0.3), 0 2px 8px 0 rgba(0,0,0,0.5)",
								textShadow: "0 2px 8px rgba(0,0,0,0.7)",
								border: "8px solid #222",
								outline: "4px solid #fff",
								outlineOffset: "-6px",
								pointerEvents: showLaunchBtn && !launched ? "auto" : "none",
							}}
							tabIndex={showLaunchBtn ? 0 : -1}
							aria-hidden={!showLaunchBtn}
						>
							{launched ? "Redeployed" : "GO"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
