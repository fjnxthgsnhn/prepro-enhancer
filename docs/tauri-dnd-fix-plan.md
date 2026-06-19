# Tauri版WebUI D&D停止 調査結果 & 段階的修正プラン

Date: 2026-06-07

関連レポート:
- [tauri-dnd-breakage-report.md](./tauri-dnd-breakage-report.md) … 根本原因の初期特定。
- [tauri-assets-dnd-report.md](./tauri-assets-dnd-report.md) … asset drop永続化の診断。

本ドキュメントは上記2レポートを統合し、「原因の確定 + 段階的修正プラン」を1つにまとめたものです。

---

## 1. 概要 / 結論

Tauri版WebUIの **全ビュー** でアイテムのドラッグアンドドロップ（並べ替え・移動）が動作しない。

- **単一の原因**: `src-tauri/tauri.conf.json` の `dragDropEnabled: true`。
- **フロント実装は健全**: Table / Storyboard / Timeline の並べ替え、Cutへのmedia drop、Assets dropのD&Dハンドラはすべて残存しており、ロジックは壊れていない。問題は Tauri 設定レイヤーにある。
- **根本にトレードオフ**: `dragDropEnabled` の true/false は「内部HTML5 D&D」と「OSネイティブ ファイルドロップ」のどちらか一方しか満たせない。

### トレードオフ表

| 設定 | 内部HTML5 D&D（並べ替え / media drop） | OSネイティブ ファイルドロップ（絶対パス取得） |
|---|---|---|
| `dragDropEnabled: false` | ✅ 復旧 | ❌ 不可（Browse / DOM dropで代替が必要） |
| `dragDropEnabled: true`（現状） | ❌ 停止 | ✅ 可能 |

---

## 2. 原因の詳細

### 仕組み
`dragDropEnabled: true` の場合、Tauri/wry の native drag-drop handler（`with_drag_drop_handler`）が有効化される。wryの設計では、このhandlerが `true` を返すと **OS / WebView の既定D&D処理をブロック** する。Tauri runtimeのhandlerは native drag-drop event を Tauri イベントへ変換した後に `true` を返すため、WebView内の通常のHTML5 D&Dとは衝突する。

結果として、OSからの外部ファイルD&Dだけでなく、HTML5 D&Dで実装された内部D&Dにもイベントが届かなくなる。

### 影響範囲（停止する操作）
- Table行の並べ替え
- Storyboardの scene / multicut / cut 並べ替え
- Timeline clipの並べ替え
- Cut行 / Cutカードへの画像・音声 media drop
- Assetsビューへのブラウザfallback drop

### 依存バージョン
- `tauri 2.11.2`
- `tauri-runtime-wry 2.11.2`
- `wry 0.55.1`

### 設定箇所
`src-tauri/tauri.conf.json`:

```json
"windows": [
  {
    "title": "Prepro Enhancer",
    "width": 1440,
    "height": 920,
    "minWidth": 1120,
    "minHeight": 720,
    "dragDropEnabled": true
  }
]
```

### git履歴（再発の経緯）
- `cd75c96 Fix table drag and drop in Tauri`（2026-05-23）
  - `dragDropEnabled: false` を追加し、Table D&Dを修正。
- `4278f3e Add native asset drops and chaos resilience tests`（2026-05-28）
  - native asset drop追加のため `false → true` に戻す。**これにより全HTML5 D&Dの停止が再発。**
- `5389f38` / `3af3cec`（2026-05-28 / 05-30）
  - asset drop周りの更新・診断（`scale_factor` 補正など）。設定値自体は `true` のまま。

### 関連実装（健全であることの確認 / 設計の参考）
- Table行D&D: `src/app.js` の `tr.draggable = true` + `handleDragStart` / `handleDragOver` / `handleDrop` / `clearDragState`（並べ替えhandler本体は L3821 付近）
- Storyboard D&D: `attachStoryboardDrag`（`src/app.js:1719`、呼び出し L1676 / L1701 / L1748）
- Timeline clip D&D: `.timeline-clip` の `draggable = true`（L1834 付近）
- Cutへのmedia drop: `handleMediaDrop`（`src/app.js:3890`）
- Assetsビューへのdrop（browser fallback）: `handleAssetDrop`（`src/app.js:2306`、`event.dataTransfer.files` を使用）
- Tauri native drop受信: `setupTauriAssetDrop` / `handleTauriAssetDropEvent`（`src/app.js:2319`〜）
- Browse導線（代替に流用可能）: `pick_asset_file` invoke（`src/app.js:2579`、Rust側 `src-tauri/src/main.rs:104`）
- Rust native drop変換: `emit_asset_file_drop` + run loopの `WindowEvent::DragDrop`（`src-tauri/src/main.rs:303` / L334）

---

## 3. 段階的修正プラン

まず Phase 1 で全UIのD&Dを即時復旧し、その後 asset import体験を再設計しながら Phase 2 へ進める。

### Phase 1（短期 / 即復旧・推奨ファースト）

**変更**
- `src-tauri/tauri.conf.json` の `dragDropEnabled` を `true → false` に戻す。

**効果**
- 全ビューの内部HTML5 D&D（Table / Storyboard / Timeline の並べ替え、Cutへの media drop）が即時復旧する。

**トレードオフ補填（Assets登録導線）**
- 既存の `pick_asset_file`（Browse）導線を主導線として明示・案内する。
- `handleAssetDrop`（DOM drop, `dataTransfer.files`）は WebView内ドロップで引き続き機能する。
  - ただし **WebView2はドロップ時に絶対パスを返さない** 場合があるため、`assetFromDroppedFile` のパス解決方法を要確認（相対パス / コピー戦略の検討が必要）。
- Rust側 native drop経路（`emit_asset_file_drop` / `WindowEvent::DragDrop`）は `false` 下では発火しない。コードは残置してよいが、機能しない点を明記する。

**リスク / 注意**
- Windows ExplorerからAssetsビューへの「絶対パス付きファイルドロップ」は失われる。Browseまたはコピー運用で代替する前提を周知すること。

### Phase 2（中長期 / 恒久対応）

**方針**
- `dragDropEnabled: true` を維持し、native asset drop（絶対パス取得）と内部並べ替えD&Dを両立させる。

**変更**
- 内部並べ替えD&D（Table / Storyboard / Timeline）を **HTML5 D&D → Pointer Eventsベースの独自ドラッグ実装** へ移行する。
  - 対象: `attachStoryboardDrag`、Table行、`.timeline-clip` の `draggable` / `dragstart` / `dragover` / `drop` を `pointerdown` / `pointermove` / `pointerup` ベースへ置換。
  - `handleDragStart` / `handleDragOver` / `handleDrop` / `clearDragState` の **ロジック（移動対象ID・ドロップインジケータ）は再利用** し、入力イベント層のみ差し替える。
- Cutへの media drop は native drop経路（`asset-file-drop` / `tauri://drag-drop`）へ統合することを検討する。

**効果 / コスト**
- native file drop（絶対パス）と内部並べ替えD&Dが完全に両立する。
- 改修範囲は大きい（入力イベント層の全面置換 + 自動スクロール / タッチ対応など独自実装が必要）。

---

## 4. 検証手順（実機Tauri必須）

修正実施時は以下をチェックリストとして用いること。

**静的チェック**
- `npm run check`
- `npm run test:smoke`
  - ⚠️ smokeテストはDOMへの直接 `DragEvent` dispatch と Tauri eventのmockで検証しているため、**実機Tauri/WebView2上でのD&Dブロックは検出できない**。テスト成功は「JSロジックが壊れていない」ことの根拠にすぎず、実機D&Dの保証にはならない。

**実機確認（`npm run tauri dev`）**
- Table行の並べ替えができる。
- Storyboardの scene / multicut / cut 並べ替えができる。
- Timeline clipの並べ替えができる。
- Cut行 / Cutカードへの画像・音声 drop が機能する。
- Windows ExplorerからAssetsビューへの実ファイルドラッグ。
  - Phase 1: ネイティブ絶対パスドロップは不可（Browse / DOM dropで代替）。
  - Phase 2: ネイティブ絶対パスドロップが復活。
- ※ Playwrightのmock D&Dだけでなく、Windows Explorerからの実ドラッグ操作を必ず含めること。
