export type LetterResult = "correct" | "present" | "absent";

export function evaluateGuess(answer: string, guess: string): LetterResult[] {
	const result: LetterResult[] = Array(answer.length).fill("absent");

	const answerChars = answer.split("");
	const guessChars = guess.split("");

	for (let i = 0; i < guessChars.length; i++) {
		if (guessChars[i] === answerChars[i]) {
			result[i] = "correct";
			answerChars[i] = "_";
			guessChars[i] = "*";
		}
	}

	for (let i = 0; i < guessChars.length; i++) {
		if (guessChars[i] !== "*") {
			const idx = answerChars.indexOf(guessChars[i]);
			if (idx !== -1) {
				result[i] = "present";
				answerChars[idx] = "_";
			}
		}
	}

	return result;
}
