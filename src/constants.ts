import { homedir } from "node:os";
import { join } from "node:path";
import type { MustHaveExtensionConfig } from "./types.js";

export const EXTENSION_NAME = "pi-must-have-extension";
export const CONFIG_DIR = join(homedir(), ".pi", "agent", "extensions", EXTENSION_NAME);
export const CONFIG_PATH = join(CONFIG_DIR, "config.jsonc");

export const LEGACY_PI_MUST_HAVE_PLUGIN_CONFIG_PATH = join(
	homedir(),
	".pi",
	"agent",
	"extensions",
	"pi-must-have-plugin",
	"config.jsonc",
);
export const LEGACY_MUST_HAVE_PLUGIN_CONFIG_PATH = join(
	homedir(),
	".pi",
	"agent",
	"extensions",
	"must-have-plugin",
	"config.jsonc",
);
export const LEGACY_OPENCODE_CONFIG_PATH = join(homedir(), ".config", "opencode", "MUST-have-plugin.jsonc");

export const RFC2119_DEFAULTS: Readonly<Record<string, string>> = {
	must: "MUST",
	"must not": "MUST NOT",
	required: "REQUIRED",
	shall: "SHALL",
	"shall not": "SHALL NOT",
	should: "SHOULD",
	"should not": "SHOULD NOT",
	recommended: "RECOMMENDED",
	"not recommended": "NOT RECOMMENDED",
	may: "MAY",
	optional: "OPTIONAL",
};

export const FALLBACK_CONFIG: MustHaveExtensionConfig = {
	debug: false,
	replacements: { ...RFC2119_DEFAULTS },
};

export const DEFAULT_CONFIG = `{
  // Enable debug notifications in the TUI
  // "debug": true,

  "replacements": {
    "must": "MUST",
    "must not": "MUST NOT",
    "required": "REQUIRED",
    "shall": "SHALL",
    "shall not": "SHALL NOT",
    "should": "SHOULD",
    "should not": "SHOULD NOT",
    "recommended": "RECOMMENDED",
    "not recommended": "NOT RECOMMENDED",
    "may": "MAY",
    "optional": "OPTIONAL"
  }
}\n`;
