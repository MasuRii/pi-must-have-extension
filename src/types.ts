export interface MustHaveExtensionConfig {
	debug: boolean;
	replacements: Record<string, string>;
}

export interface ConfigLoadResult {
	config: MustHaveExtensionConfig;
	source: "primary" | "legacy_pi_plugin" | "legacy_plugin" | "legacy_opencode" | "fallback";
	warning?: string;
}

export interface EnsureConfigResult {
	created: boolean;
	error?: string;
}

export interface ReplacementOutcome {
	result: string;
	counts: Map<string, number>;
}
