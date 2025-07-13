//get total words and read time
export function getBlogMeta(content: string): {
	words: number;
	readTime: number;
} {
	const words = content.trim().split(/\s+/).length;
	const readTime = Math.ceil(words / 200); // 200 wpm reading speed
	return { readTime, words };
}
