# Changelog

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
