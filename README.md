# Prepro Enhancer

Prepro Enhancer is a local desktop app for reviewing and editing LLM-generated cut lists for pre-production workflows.

It is built with Tauri, HTML, CSS, and plain JavaScript. Project files are saved as `.lctproj` ZIP archives containing `cutlist.tsv`, project JSON files, media references, and `AGENTS.md`.

## Features

- Edit scene, multicut, and cut rows in a table view
- Review cut structure in storyboard and timeline views
- Manage still image, audio, and video file references
- Edit `image_prompt` and `video_prompt` data for generation workflows
- Edit project-level `AGENTS.md` instructions inside the app
- Refresh saved `.lctproj` source files from disk
- Export TSV, LLM TSV, and Premiere XML
- Local UI settings for language, theme, and auto backup interval
- Tauri updater support through GitHub Releases and GitHub Pages `latest.json`

## Project Format

`.lctproj` is a ZIP archive. Important root files include:

- `manifest.json`
- `cutlist.tsv`
- `assets.json`
- `generate.json`
- `prompts.json`
- `timeline.json`
- `settings.json`
- `media_index.json`
- `AGENTS.md`

`cutlist.tsv` remains the main editable source for LLM-assisted cut decomposition.

## Requirements

- Node.js
- npm
- Rust toolchain
- Tauri CLI dependencies for your OS

Windows builds also require the normal Tauri Windows bundling prerequisites.

## Development

Install dependencies:

```powershell
npm install
```

Run the web-only development server:

```powershell
npm run dev
```

Run the Tauri desktop app:

```powershell
npm run tauri:dev
```

## Checks

```powershell
npm run check
npm run tauri:check
npm run test:smoke
```

Build the desktop package:

```powershell
npm run tauri:build
```

## Release

The release workflow builds Windows packages on tags matching `v*`, uploads assets to a draft GitHub Release, and publishes updater metadata to GitHub Pages.

See [docs/release.md](docs/release.md) for updater signing keys, GitHub Secrets, Pages setup, and tag release steps.

## Documentation

- [Specification](docs/prepro-enhancer_spec.md)
- [Release Guide](docs/release.md)
- [Backlog](docs/backlog.md)
