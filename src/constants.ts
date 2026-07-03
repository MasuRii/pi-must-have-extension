import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { MustHaveExtensionConfig } from "./types.js";

function normalizeAgentDirPath(path: string): string {
	if (path === "~") {
		return homedir();
	}

	if (path.startsWith("~/") || (process.platform === "win32" && path.startsWith("~\\"))) {
		return join(homedir(), path.slice(2));
	}

	if (/^file:\/\//.test(path)) {
		return fileURLToPath(path);
	}

	return path;
}

function getAgentDir(): string {
	const envDir = process.env.PI_CODING_AGENT_DIR;
	if (envDir) {
		return normalizeAgentDirPath(envDir);
	}

	return join(homedir(), ".pi", "agent");
}

export const EXTENSION_NAME = "pi-must-have-extension";
export const AGENT_DIR = getAgentDir();
export const CONFIG_DIR = join(AGENT_DIR, "extensions", EXTENSION_NAME);
export const CONFIG_PATH = join(CONFIG_DIR, "config.jsonc");

export const LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH = join(
	AGENT_DIR,
	"extensions",
	"pi-must-have-plugin",
	"config.jsonc",
);
export const LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH = join(
	AGENT_DIR,
	"extensions",
	"must-have-plugin",
	"config.jsonc",
);
export const LEGACY_OPENCODE_CONFIG_PATH = join(homedir(), ".config", "opencode", "MUST-have-plugin.jsonc");

export const RFC2119_DEFAULTS: Readonly<Record<string, string>> = {
	must: "MUST",
	"must not": "MUST NOT",
	"mustn't": "MUST NOT",
	required: "REQUIRED",
	mandatory: "MANDATORY",
	shall: "SHALL",
	"shall not": "SHALL NOT",
	"shan't": "SHALL NOT",
	should: "SHOULD",
	"should not": "SHOULD NOT",
	"shouldn't": "SHOULD NOT",
	ought: "SHOULD",
	"ought not": "SHOULD NOT",
	"oughtn't": "SHOULD NOT",
	recommended: "RECOMMENDED",
	"not recommended": "NOT RECOMMENDED",
	may: "MAY",
	permitted: "PERMITTED",
	"not permitted": "NOT PERMITTED",
	allowed: "ALLOWED",
	"not allowed": "NOT ALLOWED",
	optional: "OPTIONAL",
	"not optional": "NOT OPTIONAL",
	prohibited: "PROHIBITED",
	forbidden: "FORBIDDEN",
	disallowed: "DISALLOWED",
};

export const FALLBACK_CONFIG: MustHaveExtensionConfig = {
	enabled: true,
	debug: false,
	replacements: { ...RFC2119_DEFAULTS },
};

export const DEFAULT_CONFIG = `{
  // Enable file-backed debug logging under debug/
  // "debug": true,

  "replacements": {
    "must": "MUST",
    "must not": "MUST NOT",
    "mustn't": "MUST NOT",
    "required": "REQUIRED",
    "mandatory": "MANDATORY",
    "shall": "SHALL",
    "shall not": "SHALL NOT",
    "shan't": "SHALL NOT",
    "should": "SHOULD",
    "should not": "SHOULD NOT",
    "shouldn't": "SHOULD NOT",
    "ought": "SHOULD",
    "ought not": "SHOULD NOT",
    "oughtn't": "SHOULD NOT",
    "recommended": "RECOMMENDED",
    "not recommended": "NOT RECOMMENDED",
    "may": "MAY",
    "permitted": "PERMITTED",
    "not permitted": "NOT PERMITTED",
    "allowed": "ALLOWED",
    "not allowed": "NOT ALLOWED",
    "optional": "OPTIONAL",
    "not optional": "NOT OPTIONAL",
    "prohibited": "PROHIBITED",
    "forbidden": "FORBIDDEN",
    "disallowed": "DISALLOWED"
  }
}\n`;
