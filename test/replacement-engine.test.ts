import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { applyReplacements, shouldSkipInput } from "../src/replacements/replacement-engine.ts";

const runtimeRoot = mkdtempSync(join(tmpdir(), "pi-must-have-runtime-"));
const originalAgentDir = process.env.PI_CODING_AGENT_DIR;
process.env.PI_CODING_AGENT_DIR = runtimeRoot;

const extensionRoot = fileURLToPath(new URL("..", import.meta.url));
const testDistDir = join(extensionRoot, ".test-dist");
const configPath = join(runtimeRoot, "extensions", "pi-must-have-extension", "config.jsonc");

function compileRuntimeModules(): void {
	rmSync(testDistDir, { recursive: true, force: true });
	mkdirSync(testDistDir, { recursive: true });
	const tsconfigPath = join(testDistDir, "tsconfig.test.json");
	writeFileSync(
		tsconfigPath,
		`${JSON.stringify({
			compilerOptions: {
				target: "ES2022",
				module: "ESNext",
				moduleResolution: "Bundler",
				noEmit: false,
				noCheck: true,
				outDir: testDistDir,
				rootDir: extensionRoot,
				skipLibCheck: true,
				resolveJsonModule: true,
				allowImportingTsExtensions: false,
			},
			include: ["../index.ts", "../src/**/*.ts"],
			exclude: ["../node_modules", "../.test-dist", "../test"],
		}, null, 2)}\n`,
		"utf-8",
	);

	const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npx";
	const args = process.platform === "win32"
		? ["/d", "/s", "/c", `npx --yes -p typescript@5.7.3 tsc -p ${tsconfigPath}`]
		: ["--yes", "-p", "typescript@5.7.3", "tsc", "-p", tsconfigPath];
	execFileSync(command, args, { cwd: extensionRoot, stdio: "pipe" });
}

compileRuntimeModules();
const { default: mustHaveExtension } = await import(pathToFileURL(join(testDistDir, "src", "index.js")).href);
let configVersion = 0;

test.after(() => {
	if (originalAgentDir === undefined) {
		delete process.env.PI_CODING_AGENT_DIR;
	} else {
		process.env.PI_CODING_AGENT_DIR = originalAgentDir;
	}
	rmSync(runtimeRoot, { recursive: true, force: true });
	rmSync(testDistDir, { recursive: true, force: true });
});

function writeConfig(content: string): void {
	mkdirSync(dirname(configPath), { recursive: true });
	writeFileSync(configPath, content, "utf-8");
	configVersion += 1;
	const timestamp = new Date(Date.now() + configVersion * 1000);
	utimesSync(configPath, timestamp, timestamp);
}

function createRuntimeHarness() {
	const handlers = new Map<string, (event: any, ctx: any) => Promise<any> | any>();
	const pi = {
		on(name: string, handler: (event: any, ctx: any) => Promise<any> | any): void {
			handlers.set(name, handler);
		},
	};
	mustHaveExtension(pi as never);
	const notifications: Array<{ message: string; level: string }> = [];
	const ctx = {
		hasUI: true,
		ui: {
			notify(message: string, level: string): void {
				notifications.push({ message, level });
			},
		},
	};

	return {
		notifications,
		async sessionStart(): Promise<void> {
			await handlers.get("session_start")?.({ reason: "new" }, ctx);
		},
		async input(event: any): Promise<any> {
			return handlers.get("input")?.(event, ctx);
		},
	};
}

test("shouldSkipInput skips extension commands and shell input", () => {
	assert.equal(shouldSkipInput("/reload"), true);
	assert.equal(shouldSkipInput("!ls"), true);
	assert.equal(shouldSkipInput("!{ command: \"ls\" }"), false);
	assert.equal(shouldSkipInput("must should"), false);
});

test("applyReplacements replaces RFC2119 words case-insensitively", () => {
	const { result, counts } = applyReplacements("You must and SHOULD comply.", {
		must: "MUST",
		should: "SHOULD",
	});

	assert.equal(result, "You MUST and SHOULD comply.");
	assert.equal(counts.get("must"), 1);
	assert.equal(counts.get("should"), 1);
});

test("applyReplacements prefers longer matches first", () => {
	const { result } = applyReplacements("must not ignore this", {
		must: "MUST",
		"must not": "MUST NOT",
	});

	assert.equal(result, "MUST NOT ignore this");
});

test("applyReplacements avoids partial words and markdown emphasis boundaries", () => {
	const { result, counts } = applyReplacements("must, mustache, **must**, _must_, must-not", {
		must: "MUST",
	});

	assert.equal(result, "MUST, mustache, **must**, _must_, MUST-not");
	assert.equal(counts.get("must"), 2);
});

test("applyReplacements collapses one duplicate space when replacement already ends with whitespace", () => {
	const { result } = applyReplacements("You must comply", {
		must: "MUST ",
	});

	assert.equal(result, "You MUST comply");
});

test("input hook bypasses extension-source events at runtime", async () => {
	writeConfig(`{"debug":false,"replacements":{"must":"MUST"}}\n`);
	const harness = createRuntimeHarness();
	await harness.sessionStart();

	const result = await harness.input({ source: "extension", text: "you must comply" });

	assert.deepEqual(result, { action: "continue" });
});

test("input hook transforms runtime text while preserving image attachments", async () => {
	writeConfig(`{"debug":false,"replacements":{"must":"MUST"}}\n`);
	const harness = createRuntimeHarness();
	await harness.sessionStart();
	const images = [{ type: "image", data: "abc", mimeType: "image/png" }];

	const result = await harness.input({ source: "user", text: "you must comply", images });

	assert.equal(result.action, "transform");
	assert.equal(result.text, "you MUST comply");
	assert.equal(result.images, images);
});

test("input hook reloads config when fixture content changes", async () => {
	writeConfig(`{"debug":false,"replacements":{"should":"SHOULD"}}\n`);
	const harness = createRuntimeHarness();
	await harness.sessionStart();

	assert.deepEqual(await harness.input({ source: "user", text: "we should go" }), {
		action: "transform",
		text: "we SHOULD go",
	});

	writeConfig(`{"debug":false,"replacements":{"should":"MUST"}}\n`);
	assert.deepEqual(await harness.input({ source: "user", text: "we should go" }), {
		action: "transform",
		text: "we MUST go",
	});
});

test("session_start and input handlers surface config warnings and debug notifications", async () => {
	writeConfig(`{"debug": true,, "replacements": {"must":"MUST"}}\n`);
	const harness = createRuntimeHarness();
	await harness.sessionStart();

	assert.equal(harness.notifications.length, 1);
	const warning = harness.notifications[0];
	assert.ok(warning);
	assert.equal(warning.level, "warning");
	assert.match(warning.message, /Failed to load config/);

	writeConfig(`{"debug":true,"replacements":{"must":"MUST"}}\n`);
	const result = await harness.input({ source: "user", text: "you must comply" });

	assert.equal(result.action, "transform");
	assert.equal(result.text, "you MUST comply");
	assert.equal(harness.notifications.some((entry) => entry.level === "info" && /applied 1 replacement/.test(entry.message)), true);
});
