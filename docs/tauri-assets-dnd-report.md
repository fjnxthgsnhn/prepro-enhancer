# Tauri Assets D&D Investigation Report

Date: 2026-05-28

## Target Project Verification

対象ファイル:

`H:\AICreation\project\narushisuto-DK\episode_001_03.lctproj`

確認結果:

- `.lctproj` は ZIP として正常に読める。
- ZIP root には `manifest.json`, `cutlist.tsv`, `AGENTS.md`, `timeline.json`, `settings.json`, `assets.json`, `media_index.json` が存在する。
- `settings.json` は `{"view":"assets"}` で、保存時点の表示 view は Assets。
- `assets.json` は存在するが、登録されている asset は3件のみ。
- D&D で追加されたと思われる `BG_*.png`, `episode_001_*.png`, `人物レイアウト案_*.png` などのファイルは `assets.json` には登録されていない。

`assets.json` の登録内容:

| alias | path | note |
| --- | --- | --- |
| `char_ユラ` | `assets/characters/ユラ.png` | subject column derived |
| `char_ルイ` | `assets/characters/ルイ.png` | subject column derived |
| `char_恒一` | `assets/characters/恒一.png` | subject column derived |

プロジェクト横の実ファイル確認:

- `H:\AICreation\project\narushisuto-DK\assets` は存在し、多数の画像・音声ファイルがある。
- ただし `assets.json` の `assets/characters/*.png` に対応する `assets\characters` フォルダは確認できなかった。
- 実在するキャラクター参照画像は `assets\ユラ.png`, `assets\ルイ.png`, `assets\恒一.png`。
- そのため、現在の `assets.json` は「登録はあるが、path が実ファイル配置と一致していない」状態。

結論:

- `episode_001_03.lctproj` 内に D&D 追加結果は保存されていない。
- 現在保存されている3件の asset はカットリスト由来の事前登録に見える。
- 既存登録 asset の path も実ファイルとずれているため、Assets view で preview が missing になる可能性が高い。

## Current Assets D&D Spec

Browser fallback:

- `#assetsView` に `dragover`, `dragleave`, `drop` listener を登録する。
- `DataTransfer.files` がある場合のみ D&D として扱う。
- Assets view の空き領域へ drop した場合:
  - drop された全ファイルを新規 asset として `state.assets` に追加する。
  - path は project-relative にできる場合は相対化し、それ以外は absolute または `assets/<file-name>` にする。
- 既存 `.asset-card` 上へ drop した場合:
  - 新規 card は作らない。
  - 先頭ファイルのみを使い、対象 asset の `path` と `type` を更新する。
  - `alias` と `note` は維持する。

Tauri native:

- Rust 側で `WindowEvent::DragDrop(DragDropEvent::Drop { paths, position })` を受ける。
- Rust 側で `asset-file-drop` custom event として JS に再送信する。
- payload は `paths`, `position`, `scale_factor`。
- JS 側は `window.__TAURI__?.event?.listen("asset-file-drop", ...)` で受信する。
- 受信後、Assets view 内の drop かどうかを position から判定する。
- `.asset-card` 上なら既存 asset 更新、空き領域なら新規追加する。

Persistence:

- D&D はまず `state.assets` を更新し、dirty state にする。
- `.lctproj` の `assets.json` に保存されるのは、ユーザーが Save / Save as した時点。
- D&D 直後に保存しない場合、元の `.lctproj` には反映されない。

## Problems Found

1. 対象 `.lctproj` に D&D 追加結果が保存されていない

- `assets.json` には3件しかない。
- プロジェクト横の `assets\episode_001` には多数の画像があるが、`assets.json` には登録されていない。
- D&D がイベントとして発火していない、または発火後に Save されていない可能性がある。

2. `assets.json` の既存 path が実ファイルと一致しない

- 登録: `assets/characters/ルイ.png`
- 実在: `assets\ルイ.png`
- `assets\characters` は見つからない。
- これは D&D の問題とは別に、既存 asset preview / reference 解決失敗の原因になる。

3. Tauri native D&D 実装が custom event 経由で、実機での観測ログがない

- smoke test は mock event で `asset-file-drop` を直接 emit している。
- 実際の OS drag/drop が Rust の `WindowEvent::DragDrop` に届いているかはテストで確認できていない。
- Rust 側の `emit_to` が成功しているか、JS 側の listener が登録されているかも現状 UI から観測できない。

4. Tauri built-in drag/drop event API を使っていない

- Tauri v2 の global bundle には `window.__TAURI__.window.WebviewWindow` / `window.__TAURI__.webview.Webview` の `onDragDropEvent()` がある。
- 現実装は Rust run loop で native drop を拾い、独自の `asset-file-drop` に変換している。
- custom bridge は動けば問題ないが、実機で発火しない場合の切り分け点が多い。

## Likely Causes

可能性が高い順:

1. D&D 後に `.lctproj` を保存していない

- アプリ仕様上、D&D は即座に ZIP を書き換えない。
- `state.assets` 更新後に Save しないと `assets.json` は変わらない。
- 対象ファイルの `assets.json` に D&D 結果がないことは、この可能性と一致する。

2. 実行中の Tauri アプリが最新ビルドではない

- 直近修正はコミット済みだが、インストール済み/起動中アプリが古い binary のままだと反映されない。
- `npm run tauri:dev` ではなく既存インストール版を起動している場合、修正前コードの可能性がある。

3. Rust `WindowEvent::DragDrop` が実機で発火していない

- Windows / WebView2 / Tauri 設定の組み合わせで、OS D&D が webview 側の built-in event として処理され、run loop 側の custom bridge が期待通り動いていない可能性がある。
- `dragDropEnabled: true` は設定されているが、現在の custom event 経路が実機で発火している証跡はない。

4. JS listener 登録前に drop している、または `window.__TAURI__.event.listen` 経路が実機で失敗している

- `setupTauriAssetDrop()` は app script 初期化時に一度だけ呼ばれる。
- 失敗時は console warning のみで、UI 上は分からない。
- DevTools を見ないと listener 登録失敗を検出できない。

5. position 判定が外れて drop が無視されている

- `scale_factor` 対応後も、position が webview 全体基準か window 基準か、タイトルバー/境界込みかでずれる可能性がある。
- 判定が `#assetsView` 外になると drop は無視される。

6. modal 表示中または Assets view 以外で drop している

- 現仕様では asset modal 表示中、または `state.view !== "assets"` の場合は Tauri drop を無視する。

## Recommended Next Fix

短期修正:

- Tauri D&D を custom Rust bridge だけに頼らず、JS 側で Tauri built-in drag/drop event も listen する。
- `window.__TAURI__.webviewWindow.getCurrentWebviewWindow().onDragDropEvent(...)` または `window.__TAURI__.webview.getCurrentWebview().onDragDropEvent(...)` を使い、`type === "drop"` を同じ handler に流す。
- custom `asset-file-drop` は fallback として残す。
- D&D 受信時に一時的な toast または console log を出し、`paths`, `position`, `target` を観測できるようにする。

保存仕様の改善:

- D&D 後は dirty 表示だけでなく、Assets view に「Unsaved asset changes」相当が分かる表示を出す。
- 必要なら Tauri 版のみ D&D 後に自動 backup を作る。ただし本保存は明示 Save のままにする。

データ修復:

- `episode_001_03.lctproj` の `assets.json` は、既存実ファイルに合わせて以下へ修正する必要がある。
  - `assets/characters/ユラ.png` -> `assets/ユラ.png`
  - `assets/characters/ルイ.png` -> `assets/ルイ.png`
  - `assets/characters/恒一.png` -> `assets/恒一.png`
- `assets\episode_001` 配下の参照画像を assets 登録したい場合は、既存カードへ drop して Save するか、`assets.json` を生成・更新する専用 import を追加する。

## Verification Loop Added

- `setupTauriAssetDrop()` は登録できた listener を `[assets-dnd] registered listeners: ...` として console に出す。
- `localStorage.preproDebugDnd = "1"` を設定すると、drop source、paths、raw position、scaleFactor、CSS pixel、`elementFromPoint()` 結果、target asset id、ignore 理由を console に出す。
- Playwright smoke は実ファイル `H:\AICreation\project\narushisuto-DK\assets\episode_001\BG_教室.png` の bytes を Tauri mock media fixture として読み込み、以下を検証する。
  - 既存 asset card への標準 Tauri drop でカード数が増えず、`assets/episode_001/BG_教室.png` に path 更新される。
  - `asset-file-drop` fallback で空き領域 drop し、新規 card が追加される。
  - image preview が `read_media_file` 経由で表示される。
  - alias/note が保持される。
  - Save 後の `.lctproj` 内 `assets.json` に path が保存される。
- 実機確認は `npm run tauri:dev` で起動し、DevTools console で `localStorage.preproDebugDnd = "1"` を設定して reload してから、Assets view に `BG_教室.png` を OS D&D する。
- 実機で失敗する場合は、console の `[assets-dnd]` ログで「listener 未登録」「native event 未受信」「座標が #assetsView 外」「modal/view により ignore」のどれかを判定する。

## Evidence

- `episode_001_03.lctproj` size: 23,629 bytes
- `episode_001_03.lctproj` LastWriteTime: 2026-05-28 14:32:02
- `assets.json` size: 1,077 bytes
- `assets.json` asset count: 3
- `media_index.json` cut count: 47
- `settings.json`: `view = assets`
- Project directory has `assets` folder with many files, including `assets\episode_001\人物レイアウト案_episode_001_mannequin_16x9.png`, but these are not registered in `assets.json`.
