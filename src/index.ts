import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	CONFIG_PATH,
	EXTENSION_NAME,
	LEGACY_EXTENSION_CONFIG_PATH,
	LEGACY_OPENCODE_CONFIG_PATH,
} from "./constants.js";
import { ensureConfigExists, loadConfig } from "./config/config-loader.js";
import { applyReplacements, shouldSkipInput } from "./replacements/replacement-engine.js";

export default function mustHavePlugin(pi: ExtensionAPI): void {
	const warnedMessages = new Set<string>();

	const warnOnce = (message: string, ctx: Pick<ExtensionContext, "hasUI" | "ui">): void => {
		if (warnedMessages.has(message)) {
			return;
		}
		warnedMessages.add(message);
		console.warn(`[${EXTENSION_NAME}] ${message}`);
		if (ctx.hasUI) {
			ctx.ui.notify(message, "warning");
		}
	};

	pi.on("session_start", async (_event, ctx) => {
		const ensureResult = ensureConfigExists();
		if (ensureResult.error) {
			warnOnce(ensureResult.error, ctx);
		}

		const loaded = loadConfig();
		if (loaded.warning) {
			warnOnce(loaded.warning, ctx);
		}

		if (loaded.source === "legacy_extension") {
			warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_EXTENSION_CONFIG_PATH}. Move it to ${CONFIG_PATH} to override defaults.`,
				ctx,
			);
		}

		if (loaded.source === "legacy_opencode") {
			warnOnce(
				`${EXTENSION_NAME}: using legacy config ${LEGACY_OPENCODE_CONFIG_PATH}. Move it to ${CONFIG_PATH} to override defaults.`,
				ctx,
			);
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
			warnOnce(loaded.warning, ctx);
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
			const summary = `${EXTENSION_NAME}: applied ${totalReplacements} replacement(s).`;
			console.info(`[${EXTENSION_NAME}] ${summary}`);
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
