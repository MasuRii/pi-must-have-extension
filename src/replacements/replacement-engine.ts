import type { ReplacementOutcome } from "../types.js";

/** Maximum length for a single replacement key. Bounds regex compilation work and blocks oversized config values from causing slow regex evaluation. */
const MAX_REPLACEMENT_KEY_LENGTH = 500;

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function shouldSkipInput(text: string): boolean {
	const trimmed = text.trimStart();
	if (!trimmed) {
		return true;
	}

	if (trimmed.startsWith("/")) {
		return true;
	}

	if (trimmed.startsWith("!") && !trimmed.startsWith("!{")) {
		return true;
	}

	return false;
}

export function applyReplacements(text: string, replacements: Record<string, string>): ReplacementOutcome {
	if (Object.keys(replacements).length === 0) {
		return { result: text, counts: new Map() };
	}

	const sortedKeys = Object.keys(replacements)
		.filter((key) => key.length > 0 && key.length <= MAX_REPLACEMENT_KEY_LENGTH)
		.sort((left, right) => right.length - left.length);
	if (sortedKeys.length === 0) {
		return { result: text, counts: new Map() };
	}
	const patternStrings = sortedKeys.map((key) => `(?<![a-zA-Z*_])${escapeRegex(key)}(?![a-zA-Z*_])`);
	// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp — each key is length-bounded (<=MAX_REPLACEMENT_KEY_LENGTH) and escaped via escapeRegex before interpolation; the combined pattern contains only literal alternations with literal lookarounds.
	const combinedPattern = new RegExp(`(${patternStrings.join("|")})`, "gi");

	const lookup = new Map<string, string>();
	for (const key of sortedKeys) {
		const replacement = replacements[key];
		if (typeof replacement === "string") {
			lookup.set(key.toLowerCase(), replacement);
		}
	}

	const counts = new Map<string, number>();
	let lastIndex = 0;
	let result = "";
	let match: RegExpExecArray | null;

	while ((match = combinedPattern.exec(text)) !== null) {
		const normalized = match[0].toLowerCase();
		const replacement = lookup.get(normalized);

		if (!replacement) {
			result += text.slice(lastIndex, match.index) + match[0];
			lastIndex = match.index + match[0].length;
			continue;
		}

		counts.set(normalized, (counts.get(normalized) || 0) + 1);
		result += text.slice(lastIndex, match.index) + replacement;
		lastIndex = match.index + match[0].length;

		if (/\s$/.test(replacement) && text[lastIndex] === " ") {
			lastIndex += 1;
		}
	}

	result += text.slice(lastIndex);
	return { result, counts };
}
