# must-have-plugin

Normalize RFC 2119 language in Pi prompts by automatically rewriting lowercase modal terms (for example `must`, `should not`, `optional`) into uppercase normative forms (`MUST`, `SHOULD NOT`, `OPTIONAL`).

## Features

- Rewrites configurable keywords during normal prompt input.
- Leaves slash commands and shell-prefixed input unchanged.
- Supports JSONC config (`// comments`, `/* blocks */`, trailing commas).
- Auto-creates a default config when none exists.
- Supports legacy config path migration warnings.
- Optional debug notifications in Pi TUI.

## Installation

### Local extension folder

Copy this repository to:

- Global: `~/.pi/agent/extensions/must-have-plugin`
- Project: `.pi/extensions/must-have-plugin`

Pi will auto-discover it.

### NPM package

```bash
pi install npm:must-have-plugin
```

## Configuration

Runtime config path:

```text
~/.pi/agent/extensions/must-have-plugin/config.jsonc
```

Legacy fallback path (read-only fallback):

```text
~/.config/opencode/MUST-have-plugin.jsonc
```

Example config template is included at `config/config.example.jsonc`.

```jsonc
{
  "debug": false,
  "replacements": {
    "must": "MUST",
    "must not": "MUST NOT",
    "should": "SHOULD"
  }
}
```

## Development

```bash
npm install
npm run build
npm run lint
npm run test
npm run check
```

## Project Structure

- `index.ts` - Pi auto-discovery entrypoint.
- `src/index.ts` - extension event wiring.
- `src/config/` - config loading and JSONC parsing.
- `src/replacements/` - replacement and input-skip engine.
- `src/constants.ts` - extension constants and defaults.
- `src/types.ts` - shared types.
- `test/` - Node test suite.
- `config/config.example.jsonc` - starter config template.

## License

MIT
