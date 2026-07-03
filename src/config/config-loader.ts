import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

function cloneConfig(config: MustHaveExtensionConfig): MustHaveExtensionConfig {
	return {
		enabled: config.enabled,
		debug: config.debug,
		replacements: { ...config.replacements },
	};
}

function cloneFallbackConfig(): MustHaveExtensionConfig {
	return cloneConfig(FALLBACK_CONFIG);
}

function cloneLoadResult(result: ConfigLoadResult): ConfigLoadResult {
	return {
		...result,
		config: cloneConfig(result.config),
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
			enabled: root.enabled !== false,
			debug: root.debug === true,
			replacements: toReplacementMap(root.replacements),
		},
	};
}

const LEGACY_CONFIG_PATHS: readonly string[] = [
	LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH,
	LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH,
	LEGACY_OPENCODE_CONFIG_PATH,
];

let cachedConfigResult: ConfigLoadResult | undefined;
let cachedConfigFingerprint: string | undefined;

function findLegacyConfigPath(): string | undefined {
	for (const path of LEGACY_CONFIG_PATHS) {
		if (existsSync(path)) {
			return path;
		}
	}

	return undefined;
}

function getConfigFingerprint(path: string | undefined): string {
	if (!path) {
		return "missing";
	}

	try {
		const stats = statSync(path);
		return `${path}:${stats.mtimeMs}:${stats.size}`;
	} catch {
		return "missing";
	}
}

function getActiveConfigPath(): string | undefined {
	if (existsSync(CONFIG_PATH)) {
		return CONFIG_PATH;
	}

	return findLegacyConfigPath();
}

export function ensureConfigExists(): EnsureConfigResult {
	if (existsSync(CONFIG_PATH)) {
		return { created: false };
	}

	const legacyPath = findLegacyConfigPath();

	try {
		mkdirSync(CONFIG_DIR, { recursive: true });

		if (legacyPath) {
			const legacyContent = readFileSync(legacyPath, "utf-8");
			writeFileSync(CONFIG_PATH, legacyContent, "utf-8");
			return { created: true, migratedFrom: legacyPath };
		}

		writeFileSync(CONFIG_PATH, DEFAULT_CONFIG, "utf-8");
		return { created: true };
	} catch (error) {
		return {
			created: false,
			error: `Failed to initialize config at ${CONFIG_PATH}: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

export function loadConfig(): ConfigLoadResult {
	const activePath = getActiveConfigPath();
	const fingerprint = getConfigFingerprint(activePath);
	if (cachedConfigResult && cachedConfigFingerprint === fingerprint) {
		return cloneLoadResult(cachedConfigResult);
	}

	try {
		let result: ConfigLoadResult;
		if (activePath === CONFIG_PATH) {
			const loaded = parseConfigFromPath(CONFIG_PATH);
			result = { ...loaded, source: "primary" };
		} else if (activePath === LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH) {
			const loaded = parseConfigFromPath(LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH);
			result = { ...loaded, source: "legacy_pi_plugin" };
		} else if (activePath === LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH) {
			const loaded = parseConfigFromPath(LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH);
			result = { ...loaded, source: "legacy_plugin" };
		} else if (activePath === LEGACY_OPENCODE_CONFIG_PATH) {
			const loaded = parseConfigFromPath(LEGACY_OPENCODE_CONFIG_PATH);
			result = { ...loaded, source: "legacy_opencode" };
		} else {
			result = { config: cloneFallbackConfig(), source: "fallback" };
		}

		cachedConfigFingerprint = fingerprint;
		cachedConfigResult = cloneLoadResult(result);
		return result;
	} catch (error) {
		const result: ConfigLoadResult = {
			config: cloneFallbackConfig(),
			source: "fallback",
			warning: `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
		};
		cachedConfigFingerprint = fingerprint;
		cachedConfigResult = cloneLoadResult(result);
		return result;
	}
}
