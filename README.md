# pi-must-have-extension

Normalize RFC 2119 language in Pi prompts by automatically rewriting lowercase modal terms (`must`, `should not`, `optional`) into uppercase normative forms (`MUST`, `SHOULD NOT`, `OPTIONAL`).

## Features

- **RFC 2119/8174 compliance** — Transforms modal keywords to standard uppercase notation
- **Intelligent matching** — Case-insensitive with longest-first phrase replacement
- **Word-boundary aware** — Does not replace keywords embedded inside larger words
- **Configurable replacements** — Customize or extend the default keyword mappings
- **Input filtering** — Leaves slash commands (`/`) and shell input (`!`) unchanged
- **Auto-configuration** — Creates a default config file when none exists
- **Legacy migration** — Automatically migrates configs from previous plugin versions
- **Debug mode** — Optional TUI notifications showing replacement counts

## Installation

### Local Extension Folder

Copy this repository to one of the following locations:

```text
~/.pi/agent/extensions/pi-must-have-extension     # Global (all projects)
.pi/extensions/pi-must-have-extension             # Project-specific
```

Pi will auto-discover the extension on startup.

### NPM Package

```bash
pi install npm:pi-must-have-extension
```

## Usage

Once installed, the extension works automatically. When you type prompts containing RFC 2119 keywords:

**Input:**
```text
The function must validate input and should log errors.
```

**Transformed to:**
```text
The function MUST validate input and SHOULD log errors.
```

### Skipped Input

The extension does not transform:

- Slash commands (e.g., `/help`, `/reload`)
- Shell commands (e.g., `!ls`, `!git status`)
- Empty input

## Configuration

The extension uses a JSONC configuration file (JSON with comments):

```text
~/.pi/agent/extensions/pi-must-have-extension/config.jsonc
```

### Default Configuration

```jsonc
{
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
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | `boolean` | `false` | Enable TUI notifications showing replacement counts |
| `replacements` | `object` | RFC 2119 defaults | Key-value map of terms to replace |

### Custom Replacements

You can add custom replacement rules or modify existing ones:

```jsonc
{
  "replacements": {
    // Standard RFC 2119
    "must": "MUST",
    "should": "SHOULD",
    
    // Custom shortcuts
    "rfc!": "The key words in this document are to be interpreted as described in RFC 2119.\n\n",
    "always": "**ALWAYS**",
    "never": "**NEVER**"
  }
}
```

An advanced replacement sample is included at `config/replacements.custom-sample.jsonc`.

### Legacy Config Paths

The extension supports migration from previous versions. Legacy configs are read from:

```text
~/.pi/agent/extensions/pi-must-have-plugin/config.jsonc
~/.pi/agent/extensions/must-have-plugin/config.jsonc
~/.config/opencode/MUST-have-plugin.jsonc
```

On first run, legacy configs are automatically migrated to the new location.

## Technical Details

### How It Works

1. **Session start**: Ensures config exists (creates default or migrates legacy)
2. **Input event**: Intercepts user prompts before sending to the agent
3. **Pattern matching**: Uses regex with word boundaries and longest-match-first ordering
4. **Transformation**: Returns modified text while preserving images and other input data

### Project Structure

```text
├── index.ts                 # Pi extension entrypoint
├── src/
│   ├── index.ts             # Extension event wiring
│   ├── constants.ts         # Paths, defaults, and extension name
│   ├── types.ts             # TypeScript interfaces
│   ├── config/
│   │   ├── config-loader.ts # Config loading and migration
│   │   └── jsonc.ts         # JSONC parser (strips comments)
│   └── replacements/
│       └── replacement-engine.ts  # Core replacement logic
├── config/
│   ├── config.example.jsonc           # Starter template
│   └── replacements.custom-sample.jsonc  # Advanced samples
└── test/
    └── replacement-engine.test.ts     # Unit tests
```

### Development

```bash
npm install          # Install dependencies
npm run build        # Type-check with TypeScript
npm run test         # Run test suite
npm run check        # Build + test
```

## Origin

This extension is a Pi-harness adaptation of [ariane-emory/MUST-have-plugin](https://github.com/ariane-emory/MUST-have-plugin), converted into a modular TypeScript Pi extension.

## License

MIT
