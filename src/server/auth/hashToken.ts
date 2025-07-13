const webCrypto = globalThis.crypto;

const hashToken = async (token: string): Promise<string> => {
	const textEncoder = new TextEncoder();
	const data = textEncoder.encode(token);

	const hashBuffer = await webCrypto.subtle.digest("SHA-512", data);

	const hashArray = Array.from(new Uint8Array(hashBuffer));

	const hexHash = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return hexHash;
};

export { hashToken };
