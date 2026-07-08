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
- [User Manual](docs/user-manual.md)
- [Release Guide](docs/release.md)
- [Backlog](docs/backlog.md)

## Disclaimer / 免責事項

Prepro Enhancer is a production support tool for reviewing and editing LLM-generated cut lists, prompts, media references, and related export data. It does not guarantee the accuracy, completeness, legality, copyright clearance, third-party rights clearance, or suitability of any generated, imported, edited, or exported content.

Users are responsible for reviewing all project data, prompts, media files, TSV files, Premiere XML exports, and any data shared with external AI services or editing tools. Take particular care with copyright, portrait rights, trademarks, license terms, confidential information, personal information, and the terms of any generative AI service or external software used with this app.

Prepro Enhancer runs as a local desktop app, but the developer is not responsible for how users handle data outside the app, including uploads to external AI services, cloud storage, editing software, or other tools. Back up important `.lctproj`, TSV, media, and export files before use.

To the maximum extent permitted by applicable law, the developer is not liable for data loss, file corruption, incorrect exports, production delays, disputes with third parties, or any other damages arising from use of this app. The app is provided as-is, and its features, supported formats, update behavior, and distribution method may change without notice.

Prepro Enhancer は、LLM が生成したカット表、プロンプト、素材参照情報、書き出しデータを確認・編集するための制作支援ツールです。本アプリは、生成・読み込み・編集・書き出しされる内容の正確性、完全性、適法性、著作権その他の第三者権利を侵害しないこと、また特定の制作環境や編集ソフトで期待どおり動作することを保証しません。

本アプリで扱うプロジェクトデータ、プロンプト、メディアファイル、TSV、Premiere XML、および外部 AI サービスや編集ツールへ渡すデータの内容については、ユーザー自身の責任で確認してください。特に、著作権、肖像権、商標権、利用許諾、機密情報、個人情報、生成 AI サービスや外部ソフトウェアの利用規約に注意してください。

本アプリはローカルデスクトップアプリとして動作しますが、外部 AI サービス、クラウドストレージ、編集ソフト、その他のツールでのデータ利用について、開発者は責任を負いません。重要な `.lctproj`、TSV、メディア、書き出しファイルは、利用前にバックアップしてください。

適用法令で認められる最大限の範囲において、開発者は、本アプリの利用により生じたデータ消失、ファイル破損、誤った書き出し、制作遅延、第三者との紛争、その他一切の損害について責任を負いません。本アプリは現状有姿で提供され、機能、対応形式、アップデート方法、配布方法は予告なく変更される場合があります。
