import { mkdirSync } from "node:fs";
import { appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { EXTENSION_NAME } from "./constants.js";

const EXTENSION_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEBUG_DIR = join(EXTENSION_ROOT, "debug");
const DEBUG_LOG_PATH = join(DEBUG_DIR, "debug.log");

let debugDirectoryReady = false;

const SECRET_KEY_PATTERN = /api[_-]?key|authorization|bearer|credential|password|secret|token/i;
const SECRET_VALUE_PATTERN = /\b(?:sk-[A-Za-z0-9_-]{12,}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{12,})\b/g;

function redactLogValue(value: unknown, key = ""): unknown {
	if (SECRET_KEY_PATTERN.test(key)) {
		return "[REDACTED]";
	}
	if (typeof value === "string") {
		return value.replace(SECRET_VALUE_PATTERN, "[REDACTED]");
	}
	if (Array.isArray(value)) {
		return value.map((entry) => redactLogValue(entry));
	}
	if (value && typeof value === "object") {
		if (value instanceof Error) {
			return {
				name: value.name,
				message: redactLogValue(value.message),
				stack: redactLogValue(value.stack),
			};
		}
		const output: Record<string, unknown> = {};
		for (const [nestedKey, nestedValue] of Object.entries(value)) {
			output[nestedKey] = redactLogValue(nestedValue, nestedKey);
		}
		return output;
	}
	return value;
}

function safeStringify(value: unknown): string {
	try {
		return JSON.stringify(redactLogValue(value));
	} catch {
		return JSON.stringify({ value: String(redactLogValue(String(value))) });
	}
}

function ensureDebugDirectory(): void {
	if (debugDirectoryReady) {
		return;
	}

	mkdirSync(DEBUG_DIR, { recursive: true });
	debugDirectoryReady = true;
}

export function writeDebugLog(
	enabled: boolean,
	event: string,
	payload: Record<string, unknown> = {},
): void {
	if (!enabled) {
		return;
	}

	try {
		ensureDebugDirectory();
		void appendFile(
			DEBUG_LOG_PATH,
			`${safeStringify({
				timestamp: new Date().toISOString(),
				extension: EXTENSION_NAME,
				event,
				...payload,
			})}\n`,
			"utf8",
		).catch(() => undefined);
	} catch {
		// Debug logging must never affect extension behavior.
	}
}
