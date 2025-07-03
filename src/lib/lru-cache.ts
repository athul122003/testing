// [TODO] RAHUL: NEEDS TESTING

type CacheEntry<V> = {
	value: V;
	timestamp: number;
};

export function createPersistentLRUCache<K extends string, V>(
	keyPrefix: string,
	ttl = 30_000,
	maxSize = 5,
) {
	const memoryCache = new Map<K, CacheEntry<V>>();

	const getStorageKey = (key: K) => `${keyPrefix}:${key}`;

	function loadFromStorage(key: K): V | null {
		const raw = localStorage.getItem(getStorageKey(key));
		if (!raw) return null;
		try {
			const parsed: CacheEntry<V> = JSON.parse(raw);
			if (Date.now() - parsed.timestamp > ttl) {
				localStorage.removeItem(getStorageKey(key));
				return null;
			}
			return parsed.value;
		} catch {
			localStorage.removeItem(getStorageKey(key));
			return null;
		}
	}

	function saveToStorage(key: K, value: V) {
		const entry: CacheEntry<V> = { value, timestamp: Date.now() };
		localStorage.setItem(getStorageKey(key), JSON.stringify(entry));
	}

	function get(key: K): V | null {
		const fromMem = memoryCache.get(key);
		if (fromMem && Date.now() - fromMem.timestamp <= ttl) {
			return fromMem.value;
		}
		const fromStorage = loadFromStorage(key);
		if (fromStorage) {
			set(key, fromStorage); // rehydrate memory cache
		}
		return fromStorage;
	}

	function set(key: K, value: V) {
		if (!memoryCache.has(key) && memoryCache.size >= maxSize) {
			const oldestKey = memoryCache.keys().next().value;
			if (oldestKey !== undefined) {
				memoryCache.delete(oldestKey);
			}
		}
		memoryCache.set(key, { value, timestamp: Date.now() });
		saveToStorage(key, value);
	}

	function clear() {
		memoryCache.clear();
		Object.keys(localStorage)
			.filter((k) => k.startsWith(keyPrefix + ":"))
			.forEach((k) => localStorage.removeItem(k));
	}

	return { get, set, clear };
}
