import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
	CONFIG_DIR,
	CONFIG_PATH,
	DEFAULT_CONFIG,
	FALLBACK_CONFIG,
	LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH,
	LEGACY_OPENCODE_CONFIG_PATH,
	LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH,
} from "../constants.js";
import { parseJsonc } from "./jsonc.js";
import type { ConfigLoadResult, EnsureConfigResult, MustHaveExtensionConfig } from "../types.js";

function cloneFallbackConfig(): MustHaveExtensionConfig {
	return {
		debug: FALLBACK_CONFIG.debug,
		replacements: { ...FALLBACK_CONFIG.replacements },
	};
}

function toObject(value: unknown): Record<string, unknown> {
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}

	return {};
}

function toReplacementMap(value: unknown): Record<string, string> {
	const source = toObject(value);
	const replacements: Record<string, string> = {};

	for (const [key, replacement] of Object.entries(source)) {
		const normalizedKey = key.trim();
		if (typeof replacement === "string" && normalizedKey.length > 0) {
			replacements[normalizedKey] = replacement;
		}
	}

	return replacements;
}

function parseConfigFromPath(path: string): Omit<ConfigLoadResult, "source"> {
	const parsed = parseJsonc(readFileSync(path, "utf-8"));
	const root = toObject(parsed);

	return {
		config: {
			debug: root.debug === true,
			replacements: toReplacementMap(root.replacements),
		},
	};
}

export function ensureConfigExists(): EnsureConfigResult {
	if (
		existsSync(CONFIG_PATH) ||
		existsSync(LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH) ||
		existsSync(LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH) ||
		existsSync(LEGACY_OPENCODE_CONFIG_PATH)
	) {
		return { created: false };
	}

	try {
		mkdirSync(CONFIG_DIR, { recursive: true });
		writeFileSync(CONFIG_PATH, DEFAULT_CONFIG, "utf-8");
		return { created: true };
	} catch (error) {
		return {
			created: false,
			error: `Failed to create default config at ${CONFIG_PATH}: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

export function loadConfig(): ConfigLoadResult {
	try {
		if (existsSync(CONFIG_PATH)) {
			const loaded = parseConfigFromPath(CONFIG_PATH);
			return { ...loaded, source: "primary" };
		}

		if (existsSync(LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH)) {
			const loaded = parseConfigFromPath(LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH);
			return { ...loaded, source: "legacy_pi_plugin" };
		}

		if (existsSync(LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH)) {
			const loaded = parseConfigFromPath(LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH);
			return { ...loaded, source: "legacy_plugin" };
		}

		if (existsSync(LEGACY_OPENCODE_CONFIG_PATH)) {
			const loaded = parseConfigFromPath(LEGACY_OPENCODE_CONFIG_PATH);
			return { ...loaded, source: "legacy_opencode" };
		}

		return { config: cloneFallbackConfig(), source: "fallback" };
	} catch (error) {
		return {
			config: cloneFallbackConfig(),
			source: "fallback",
			warning: `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}
