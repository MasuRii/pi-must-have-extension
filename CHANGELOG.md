# Changelog

## [0.4.5] - 2026-03-12

### Changed
- Updated `@mariozechner/pi-coding-agent` peer dependency to `^0.57.0`
- Updated `@types/node` dev dependency to `^25.3.5`

## [0.4.4] - 2026-03-04

### Fixed
- Use absolute GitHub raw URL for README image to fix npm display

## [0.4.3] - 2026-03-04

### Fixed
- Use GitHub-compatible video embed format (thumbnail image linking to user-attachments video URL)

## [0.4.2] - 2026-03-04

### Fixed
- Restored missing asset references in README (demo.mp4 video and pi-must-have-extension.png image)

## [0.4.1] - 2026-03-04

### Changed
- Rewrote README.md with professional documentation standards
- Added comprehensive feature documentation, configuration reference, and usage examples
- Improved legacy config path detection with centralized lookup
- Added migration source tracking to config loader feedback

## 0.4.0 - 2026-03-02

- Renamed package identity from `pi-must-have-plugin` to `pi-must-have-extension`.
- Renamed extension runtime folder/references and GitHub repository to `pi-must-have-extension`.
- Updated README, npm metadata, asset naming, and install/config paths to extension terminology.
- Added compatibility for legacy configs under `pi-must-have-plugin`, `must-have-plugin`, and OpenCode paths.

## 0.3.2 - 2026-03-02

- Fixed README media rendering for npm by switching to absolute GitHub raw image URLs.
- Added clickable demo thumbnail and explicit direct video links for npm compatibility.
- Added `repository`, `homepage`, and `bugs` metadata to improve npm package page link resolution.

## 0.3.1 - 2026-03-02

- Synced additional behavior from the original OpenCode plugin source.
- Enhanced debug mode logging to include replacement summary details.
- Added `config/replacements.custom-sample.jsonc` adapted from the original plugin sample.
- Updated README with origin attribution, media preview assets, and custom sample guidance.
- Included asset files and custom sample config in npm package publish list.

## 0.3.0 - 2026-03-02

- Renamed extension identity from `must-have-plugin` to `pi-must-have-plugin` for naming consistency.
- Updated package name, README installation paths, and npm install command.
- Added legacy fallback support for the old config path `~/.pi/agent/extensions/must-have-plugin/config.jsonc`.
- Renamed GitHub repository to `pi-must-have-plugin` and updated local git remote.

## 0.2.0 - 2026-03-02

- Restructured project into a production-style layout with `src/`, `config/`, and `test/` directories.
- Added TypeScript project config, build/lint/test scripts, and strict type-checking setup.
- Added npm publishing metadata (`files`, `keywords`, `engines`, `publishConfig`, `pi` manifest).
- Added comprehensive README and package housekeeping files.
- Kept extension behavior compatible with existing runtime logic and legacy config fallback.
