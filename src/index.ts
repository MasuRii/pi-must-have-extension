import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
	CONFIG_PATH,
	EXTENSION_NAME,
	LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH,
	LEGACY_OPENCODE_CONFIG_PATH,
	LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH,
} from "./constants.js";
import { loadConfig as loadMustHaveConfig } from "./config/config-loader.js";
import { applyReplacements, shouldSkipInput } from "./replacements/replacement-engine.js";

type ConfigLoaderModule = typeof import("./config/config-loader.js");
type DebugLoggerModule = typeof import("./debug-logger.js");

interface ReplacementDebugDetail {
	value: string;
	count: number;
}

const moduleCache = new Map<string, Promise<unknown>>();

function loadModule<T>(specifier: string): Promise<T> {
	const cached = moduleCache.get(specifier);
	if (cached) {
		return cached as Promise<T>;
	}

	const promise = import(specifier) as Promise<T>;
	moduleCache.set(specifier, promise);
	return promise;
}

function loadConfigLoaderModule(): Promise<ConfigLoaderModule> {
	return loadModule<ConfigLoaderModule>("./config/config-loader.js");
}

function loadDebugLoggerModule(): Promise<DebugLoggerModule> {
	return loadModule<DebugLoggerModule>("./debug-logger.js");
}

async function writeDebugLogWhenEnabled(
	enabled: boolean,
	event: string,
	payload: Record<string, unknown> = {},
): Promise<void> {
	if (!enabled) {
		return;
	}

	try {
		const { writeDebugLog } = await loadDebugLoggerModule();
		writeDebugLog(true, event, payload);
	} catch (error) {
		// Debug logging is best-effort and must never affect extension behavior.
		void error;
	}
}

function buildReplacementDebugDetails(
	counts: Map<string, number>,
	replacements: Record<string, string>,
): Record<string, ReplacementDebugDetail> {
	const details: Record<string, ReplacementDebugDetail> = {};

	for (const [key, count] of counts) {
		const value = replacements[key];
		if (typeof value === "string") {
			details[key] = { value, count };
		}
	}

	return details;
}

export default function mustHaveExtension(pi: ExtensionAPI): void {
	if (!loadMustHaveConfig().config.enabled) {
		return;
	}

	const warnedMessages = new Set<string>();

	const warnOnce = async (
		message: string,
		ctx: Pick<ExtensionContext, "hasUI" | "ui">,
		debugEnabled: boolean,
	): Promise<void> => {
		if (warnedMessages.has(message)) {
			return;
		}
		warnedMessages.add(message);
		await writeDebugLogWhenEnabled(debugEnabled, "warning", { message });
		if (ctx.hasUI) {
			ctx.ui.notify(message, "warning");
		}
	};

	pi.on("session_start", async (_event, ctx) => {
		const { ensureConfigExists, loadConfig } = await loadConfigLoaderModule();
		const ensureResult = ensureConfigExists();
		const loaded = loadConfig();
		const debugEnabled = loaded.config.debug;
		if (ensureResult.error) {
			await warnOnce(ensureResult.error, ctx, debugEnabled);
		}
		if (ensureResult.migratedFrom) {
			await warnOnce(
				`${EXTENSION_NAME}: migrated legacy config from ${ensureResult.migratedFrom} to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (loaded.warning) {
			await warnOnce(loaded.warning, ctx, debugEnabled);
		}

		if (loaded.source === "legacy_pi_plugin") {
			await warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH}. Move it to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (loaded.source === "legacy_plugin") {
			await warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH}. Move it to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (loaded.source === "legacy_opencode") {
			await warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_OPENCODE_CONFIG_PATH}. Move it to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (debugEnabled) {
			const replacementCount = Object.keys(loaded.config.replacements).length;
			await writeDebugLogWhenEnabled(true, "debug.enabled", {
				source: loaded.source,
				replacementCount,
				configPath: CONFIG_PATH,
			});
		}
	});

	pi.on("input", async (event, ctx) => {
		if (event.source === "extension") {
			return { action: "continue" as const };
		}

		if (shouldSkipInput(event.text)) {
			return { action: "continue" as const };
		}

		const { loadConfig } = await loadConfigLoaderModule();
		const loaded = loadConfig();
		if (loaded.warning) {
			await warnOnce(loaded.warning, ctx, loaded.config.debug);
		}

		const replacements = loaded.config.replacements;
		if (Object.keys(replacements).length === 0) {
			return { action: "continue" as const };
		}

		const { result, counts } = applyReplacements(event.text, replacements);
		if (result === event.text) {
			return { action: "continue" as const };
		}

		if (loaded.config.debug) {
			const totalReplacements = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
			const details = buildReplacementDebugDetails(counts, replacements);
			const summary = `${EXTENSION_NAME}: applied ${totalReplacements} replacement(s).`;
			await writeDebugLogWhenEnabled(true, "replacements.applied", {
				summary,
				replacements: details,
			});
			if (ctx.hasUI) {
				ctx.ui.notify(summary, "info");
			}
		}

		if (event.images) {
			return {
				action: "transform" as const,
				text: result,
				images: event.images,
			};
		}

		return {
			action: "transform" as const,
			text: result,
		};
	});
}
