# Prepro Enhancer Chaos Engineering Report

Date: 2026-05-24

## Summary

Based on `chaos-engineer.md`, controlled local failure-injection tests were run against `.lctproj` loading, TSV repair, Tauri recent-project failure handling, timeline scrub behavior, media drops, and backup archive safety.

Steady state:

- `npm run check`: passed
- `npm run test:smoke`: passed
- `npm run tauri:check`: passed
- `node tests/chaos.mjs`: passed

## Experiments

| Experiment | Result | Observation |
| --- | --- | --- |
| baseline app reaches steady state | passed | Sample Project loads with expected counts. |
| broken lctproj keeps current project state | passed | Broken ZIP reports an error and preserves current state. |
| missing manifest and cutlist fail without state corruption | passed | Missing core entries are rejected safely. |
| wrapped, header-only, orphan, quoted, and sjis cutlists load | passed | Import compatibility and hierarchy repair remain functional. |
| direct TSV import clears search and restores visible table | passed | Search state does not hide newly imported TSV rows. |
| timeline scroll scrub and preview stay synchronized | passed | Horizontal scroll, scrub jump, playhead position, and preview stay aligned. |
| media drops target only cuts and project archive excludes dropped file payloads | passed | Scene drops are ignored, cut drops update references only, dropped file payloads are not embedded. |
| Tauri recent project missing path is removed | passed | Missing recent project path is removed after failed open attempt. |

## Findings

- No release-blocking resilience issue was found in the tested blast radius.
- Timeline scroll/scrub behavior is now covered by both smoke and chaos checks.
- `.lctproj` import remains resilient for common malformed or externally produced ZIP/TSV patterns.
- Media file D&D correctly stores path/name references without embedding dropped file payloads.

## Follow-up Candidates

- Add `npm run test:chaos` as a convenience script if this test becomes part of regular CI.
- Add larger `.lctproj` volume tests once realistic project sizes are known.
- Add Tauri command-level Rust tests if file I/O behavior grows beyond simple open/save/export wrappers.
