import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
	CONFIG_PATH,
	EXTENSION_NAME,
	LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH,
	LEGACY_OPENCODE_CONFIG_PATH,
	LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH,
} from "./constants.js";
import { ensureConfigExists, loadConfig } from "./config/config-loader.js";
import { writeDebugLog } from "./debug-logger.js";
import { applyReplacements, shouldSkipInput } from "./replacements/replacement-engine.js";

interface ReplacementDebugDetail {
	value: string;
	count: number;
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
	const warnedMessages = new Set<string>();

	const warnOnce = (
		message: string,
		ctx: Pick<ExtensionContext, "hasUI" | "ui">,
		debugEnabled: boolean,
	): void => {
		if (warnedMessages.has(message)) {
			return;
		}
		warnedMessages.add(message);
		writeDebugLog(debugEnabled, "warning", { message });
		if (ctx.hasUI) {
			ctx.ui.notify(message, "warning");
		}
	};

	pi.on("session_start", async (_event, ctx) => {
		const ensureResult = ensureConfigExists();
		const loaded = loadConfig();
		const debugEnabled = loaded.config.debug;
		if (ensureResult.error) {
			warnOnce(ensureResult.error, ctx, debugEnabled);
		}
		if (ensureResult.migratedFrom) {
			warnOnce(
				`${EXTENSION_NAME}: migrated legacy config from ${ensureResult.migratedFrom} to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (loaded.warning) {
			warnOnce(loaded.warning, ctx, debugEnabled);
		}

		if (loaded.source === "legacy_pi_plugin") {
			warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH}. Move it to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (loaded.source === "legacy_plugin") {
			warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH}. Move it to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (loaded.source === "legacy_opencode") {
			warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_OPENCODE_CONFIG_PATH}. Move it to ${CONFIG_PATH}.`,
				ctx,
				debugEnabled,
			);
		}

		if (debugEnabled) {
			const replacementCount = Object.keys(loaded.config.replacements).length;
			writeDebugLog(true, "debug.enabled", {
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

		const loaded = loadConfig();
		if (loaded.warning) {
			warnOnce(loaded.warning, ctx, loaded.config.debug);
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
			writeDebugLog(true, "replacements.applied", {
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
