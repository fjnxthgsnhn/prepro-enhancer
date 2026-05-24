# Prepro Enhancer Backlog

このバックログは `docs/previz-enhancer_spec.md` をもとに、MVP実装を優先して整理する。

## 優先度

- P0: MVP成立に必須
- P1: MVPで必要だが、P0完了後に着手してよい
- P2: MVP後の拡張または品質向上

## Epic 1: プロジェクトとTSV基盤

### PE-001 .lctproj読み込み基盤

- 優先度: P0
- フェーズ: Phase 1
- 内容: `.lctproj` をZIP形式の軽量プロジェクトとして読み込み、内部ファイルを展開できるようにする。
- 受け入れ条件:
  - `.lctproj` を選択して開ける
  - `manifest.json` を読み込める
  - `cutlist.tsv` / `timeline.json` / `settings.json` / `media_index.json` の存在を判定できる
  - 欠落ファイルはエラーまたは警告として表示できる

### PE-002 manifest.jsonモデル実装

- 優先度: P0
- フェーズ: Phase 1
- 内容: プロジェクトメタ情報、メディアルート、シーケンス設定を扱う。
- 受け入れ条件:
  - `format` / `formatVersion` / `projectName` / `mainCutlist` / `timeline` を読み込める
  - `pathMode` と `mediaRoots` を保持できる
  - `sequence.frameRate` / `width` / `height` / `audioSampleRate` を保持できる

### PE-003 cutlist.tsvパーサー実装

- 優先度: P0
- フェーズ: Phase 1
- 内容: MVP標準カラムのTSVを読み書きできるデータモデルを作る。
- 受け入れ条件:
  - UTF-8、タブ区切り、1行目ヘッダーのTSVを読み込める
  - 標準カラムをすべて保持できる
  - `scene` / `multicut` / `cut` の行タイプを判定できる
  - セル内改行は `\n` 表記として扱える

### PE-004 TSV構造検証

- 優先度: P0
- フェーズ: Phase 1
- 内容: LLM編集後のTSVを安全に取り込めるよう、構造と階層を検証する。
- 受け入れ条件:
  - 必須カラム欠落を検出できる
  - `row_type` の不正値を検出できる
  - `id` の重複を検出できる
  - `parent_id` の参照先欠落を検出できる
  - `scene > cut` と任意の `scene > multicut > cut` 以外の階層を検出できる
  - 循環参照を検出できる

### PE-005 Table View

- 優先度: P0
- フェーズ: Phase 1
- 内容: TSVを表形式で表示し、主要カラムを確認できるようにする。
- 受け入れ条件:
  - `cutlist.tsv` の全行を表示できる
  - `row_type` ごとに視認しやすい表示差をつける
  - 選択中の行をDetail Panelと連動できる
  - 100 cut規模で快適に操作できる

### PE-006 セル編集と即時反映

- 優先度: P0
- フェーズ: Phase 1
- 内容: Table Viewでセル編集し、内部データへ即時反映する。
- 受け入れ条件:
  - ダブルクリックでセル編集できる
  - Enterで確定、Escでキャンセルできる
  - 編集後にDetail Panelと各ビューへ反映される
  - `Ctrl+S` まではディスク保存しない

### PE-007 保存とバックアップ

- 優先度: P0
- フェーズ: Phase 1 / Phase 17
- 内容: プロジェクト保存時に対象ファイルを書き戻し、バックアップを作成する。
- 受け入れ条件:
  - `cutlist.tsv` を保存できる
  - `manifest.json` / `timeline.json` / `settings.json` / `media_index.json` を保存対象として扱える
  - 保存時に `.backups/YYYY-MM-DD_HHmm/` を作成できる
  - メディアファイルはバックアップ対象外にできる

## Epic 2: 階層とグループ管理

### PE-008 階層ツリー生成

- 優先度: P0
- フェーズ: Phase 2
- 内容: TSV行から `scene > cut` と任意の `scene > multicut > cut` の階層モデルを生成する。
- 受け入れ条件:
  - `parent_id` と `order` から階層を復元できる
  - 同一階層内を `order` 順に並べられる
  - 不整合行は検証エラーとして扱える

### PE-009 Hierarchy View

- 優先度: P0
- フェーズ: Phase 2
- 内容: scene / multicut / cut の階層を左パネルで表示する。
- 受け入れ条件:
  - scene配下にmulticut、multicut配下にcutを表示できる
  - 折りたたみ表示ができる
  - 選択中ノードをMain AreaとDetail Panelへ連動できる

### PE-010 行追加

- 優先度: P0
- フェーズ: Phase 2 / Phase 13
- 内容: scene / multicut / cut を追加できるようにする。
- 受け入れ条件:
  - 追加時に一意なIDを自動発行できる
  - 階層制約に沿った `parent_id` を設定できる
  - 同一階層内の `order` を設定できる

### PE-011 行削除

- 優先度: P1
- フェーズ: Phase 2 / Phase 13
- 内容: 行を削除し、配下要素がある場合は確認後にまとめて削除する。
- 受け入れ条件:
  - cutを削除できる
  - multicut削除時に配下cutの削除確認を表示できる
  - scene削除時に配下multicut / cutの削除確認を表示できる
  - 削除後に `order` を再計算できる

### PE-012 cut複製

- 優先度: P1
- フェーズ: Phase 13
- 内容: MVP優先対象としてcut複製を実装する。
- 受け入れ条件:
  - 選択cutを同じmulticut配下へ複製できる
  - 新しい `id` を発行できる
  - `cut` 番号は必要に応じて後続のリナンバー対象にできる

### PE-013 グループ作成

- 優先度: P0
- フェーズ: Phase 2
- 内容: 選択cutからmulticut、選択multicutからsceneを作成する。
- 受け入れ条件:
  - 複数cutを新規multicutへ移動できる
  - 複数multicutを新規sceneへ移動できる
  - `parent_id` と `order` を再計算できる
  - TSVへ反映できる

### PE-014 グループ移動

- 優先度: P1
- フェーズ: Phase 2
- 内容: scene順序、multicut所属、cut所属を変更できる。
- 受け入れ条件:
  - sceneの表示順を変更できる
  - multicutを別sceneへ移動できる
  - cutをscene直下または別multicutへ移動できる
  - 移動後に `parent_id` と `order` を更新できる

### PE-015 リナンバー

- 優先度: P1
- フェーズ: Phase 13
- 内容: `cut` 表示番号を再採番する。
- 受け入れ条件:
  - `cut001` 形式で再採番できる
  - `id` は変更しない
  - MVPではファイル名の自動変更を行わない

## Epic 3: プロンプト管理とLLM連携

### PE-016 image_prompt / video_prompt編集

- 優先度: P0
- フェーズ: Phase 3
- 内容: scene / multicut / cutそれぞれのプロンプトを編集できる。
- 受け入れ条件:
  - Detail Panelで `image_prompt` を編集できる
  - Detail Panelで `video_prompt` を編集できる
  - 編集内容をTable ViewとTSV保存へ反映できる

### PE-017 有効プロンプト生成

- 優先度: P0
- フェーズ: Phase 3
- 内容: cutで実際に使う有効プロンプトを階層順に結合する。
- 受け入れ条件:
  - `scene.image_prompt + multicut.image_prompt + cut.image_prompt` を表示できる
  - `scene.video_prompt + multicut.video_prompt + cut.video_prompt` を表示できる
  - 空のプロンプトを自然にスキップできる

### PE-018 プロンプト表示モード

- 優先度: P1
- フェーズ: Phase 3
- 内容: cut単体と有効プロンプトを切り替えて表示する。
- 受け入れ条件:
  - cut単体image_promptを表示できる
  - cut単体video_promptを表示できる
  - 有効image_promptを表示できる
  - 有効video_promptを表示できる

### PE-019 プロンプトコピー

- 優先度: P1
- フェーズ: Phase 3
- 内容: 選択範囲の有効プロンプトをクリップボードへコピーする。
- 受け入れ条件:
  - 選択cutの有効image_promptをコピーできる
  - 選択cutの有効video_promptをコピーできる
  - scene / multicut配下のcut一覧と有効プロンプトをコピーできる

### PE-020 LLM編集用TSV出力

- 優先度: P0
- フェーズ: Phase 3
- 内容: LLMが編集してよいカラムを中心にTSVを書き出す。
- 受け入れ条件:
  - `title` / `duration` / `status` / `image_prompt` / `video_prompt` など編集対象カラムを含める
  - `row_type` / `id` / `parent_id` / `order` など構造カラムを保持する
  - LLM編集後のTSVを再読み込みして検証できる

## Epic 4: メディアとプレビュー

### PE-021 静止画プレビュー

- 優先度: P0
- フェーズ: Phase 1 / Phase 4
- 内容: `image` パスの静止画を読み込み、cutのサムネイルとプレビューに表示する。
- 受け入れ条件:
  - JPG / PNG / WebP を表示できる
  - 相対パスをプロジェクトルート基準で解決できる
  - Missing Media時はプレースホルダーを表示できる

### PE-022 音声プレビュー

- 優先度: P0
- フェーズ: Phase 5
- 内容: `audio_file` の音声を再生できるようにする。
- 受け入れ条件:
  - WAV / MP3 / M4A を再生できる
  - 再生 / 停止ができる
  - Missing Media時は警告を表示できる

### PE-023 メディア存在確認

- 優先度: P0
- フェーズ: Phase 10 / Phase 19
- 内容: image / audio_file の存在と形式を検証する。
- 受け入れ条件:
  - imageの存在を確認できる
  - audio_fileの存在を確認できる
  - 未対応形式を警告できる
  - Missing Media件数をStatus Barへ表示できる

### PE-024 Relink Media

- 優先度: P1
- フェーズ: Phase 10
- 内容: Missing Mediaの再リンクを支援する。
- 受け入れ条件:
  - Missing Media行を一覧できる
  - ファイル選択でパスを更新できる
  - 相対パスとして保存できる

## Epic 5: Storyboard View

### PE-025 Grouped Storyboard View

- 優先度: P0
- フェーズ: Phase 4
- 内容: scene / multicut単位でグループ化されたStoryboardを表示する。
- 受け入れ条件:
  - sceneごとのセクションを表示できる
  - multicutごとの小セクションを表示できる
  - cutカードをサムネイル付きで表示できる
  - Missing Mediaを視覚的に示せる

### PE-026 cutカード表示

- 優先度: P0
- フェーズ: Phase 4
- 内容: cutの主要情報をカードで確認できる。
- 受け入れ条件:
  - `cut` / `title` / `duration` / `status` を表示できる
  - imageサムネイルを表示できる
  - audio_fileの有無を表示できる
  - 選択時にDetail Panelへ連動できる

## Epic 6: Timeline View

### PE-027 Timeline View基盤

- 優先度: P0
- フェーズ: Phase 5
- 内容: cutのみを実クリップとして扱う簡易タイムラインを実装する。
- 受け入れ条件:
  - cutを `duration` 順にタイムラインへ配置できる
  - scene / multicutを帯またはマーカーとして表示できる
  - 現在cutをDetail Panelと連動できる

### PE-028 duration処理

- 優先度: P0
- フェーズ: Phase 5
- 内容: cutの尺をパースし、タイムライン長へ反映する。
- 受け入れ条件:
  - `3s` のような秒指定を解釈できる
  - 空または不正なdurationはデフォルト秒として扱い警告できる
  - durationを編集してタイムラインへ即時反映できる

### PE-029 タイムライン再生

- 優先度: P0
- フェーズ: Phase 5
- 内容: 静止画と音声を簡易再生する。
- 受け入れ条件:
  - 再生ヘッドを移動できる
  - 再生 / 停止ができる
  - cutに対応する静止画を時間表示できる
  - audio_fileを同期再生できる

### PE-030 タイムライン編集

- 優先度: P1
- フェーズ: Phase 5
- 内容: cut順序、duration、有効/無効をTimeline Viewから編集する。
- 受け入れ条件:
  - cut順序を変更できる
  - durationを編集できる
  - cutの有効/無効を切り替えられる
  - 保存時に `cutlist.tsv` へ反映できる

## Epic 7: Premiere XML Export

### PE-031 Premiere XML Export UI

- 優先度: P0
- フェーズ: Phase 6
- 内容: ToolbarのExportメニューからPremiere XMLを書き出せるようにする。
- 受け入れ条件:
  - `Premiere XML (.xml)` を選択できる
  - DaVinci / FCPXML / EDLはMVPでは無効状態にできる
  - 保存先を選択できる

### PE-032 Export前検証

- 優先度: P0
- フェーズ: Phase 6
- 内容: Premiere XML書き出し前に必要条件を検証する。
- 受け入れ条件:
  - imageファイル存在を検証できる
  - audio_fileファイル存在を検証できる
  - duration妥当性を検証できる
  - パス解決可否を検証できる
  - Missing imageのみのcutはマーカー出力対象として扱える
  - Missing audioは警告し、音声クリップを除外できる

### PE-033 Premiere XML生成

- 優先度: P0
- フェーズ: Phase 6
- 内容: Final Cut Pro 7 XML互換のPremiere向けXMLを書き出す。
- 受け入れ条件:
  - imageがあるcutを静止画クリップとして出力できる
  - audio_fileがあるcutを音声クリップとして出力できる
  - scene / multicutをシーケンスマーカーとして出力できる
  - cut名、duration、タイムライン順、メディアパスを出力できる
  - 相対パスをfile URLまたは絶対パスへ変換できる

### PE-034 Export Log生成

- 優先度: P1
- フェーズ: Phase 6
- 内容: 書き出し結果、警告、除外項目をログとして確認できる。
- 受け入れ条件:
  - 出力ファイルパスを表示できる
  - Missing Mediaの警告を表示できる
  - 除外された音声クリップを表示できる
  - Prompt-only cutのマーカー出力を記録できる

## Epic 8: 検索・フィルタ・ソート

### PE-035 全文検索

- 優先度: P1
- フェーズ: Phase 14
- 内容: 全カラムを対象に検索する。
- 受け入れ条件:
  - 日本語検索に対応する
  - 大文字小文字を区別しない
  - 入力中に即時反映できる

### PE-036 フィルタ

- 優先度: P1
- フェーズ: Phase 14
- 内容: MVP対象のフィルタを提供する。
- 受け入れ条件:
  - `row_type` で絞り込める
  - `status` で絞り込める
  - `scene` で絞り込める
  - `subject` で絞り込める
  - Missing Media有無で絞り込める

### PE-037 ソート

- 優先度: P1
- フェーズ: Phase 14
- 内容: 階層構造を維持しつつ主要項目でソートする。
- 受け入れ条件:
  - `order` で並べられる
  - `cut` で並べられる
  - `duration` で並べられる
  - `status` で並べられる
  - `row_type` で並べられる

## Epic 9: UIシェルと操作性

### PE-038 メインレイアウト

- 優先度: P0
- フェーズ: Phase 20
- 内容: Toolbar、Left Panel、Main Area、Right Panel、Status Barの基本構成を作る。
- 受け入れ条件:
  - Toolbarを表示できる
  - Left PanelにHierarchy Viewを配置できる
  - Main AreaでTable / Storyboard / Timelineを切り替えられる
  - Right PanelにDetail / Prompt / Media Previewを表示できる
  - Status Barを表示できる

### PE-039 Toolbar

- 優先度: P0
- フェーズ: Phase 20
- 内容: 主要操作への導線をToolbarへ配置する。
- 受け入れ条件:
  - Open / Save / Save Asを表示できる
  - Export TSV / Export Premiere XMLを表示できる
  - Add Scene / Add Multicut / Add Cutを表示できる
  - View切り替えを表示できる
  - Search / Filterを表示できる

### PE-040 Status Bar

- 優先度: P0
- フェーズ: Phase 20
- 内容: プロジェクト状態と検証結果を常時表示する。
- 受け入れ条件:
  - プロジェクト名とパスを表示できる
  - cut / multicut / scene件数を表示できる
  - Missing Media件数を表示できる
  - 未保存状態を表示できる
  - 最終保存時刻を表示できる

### PE-041 ショートカット

- 優先度: P1
- フェーズ: Phase 21
- 内容: 仕様書定義の主要ショートカットを実装する。
- 受け入れ条件:
  - `Ctrl+S` で保存できる
  - `Ctrl+O` で開ける
  - `Ctrl+F` で検索できる
  - `Ctrl+Z` / `Ctrl+Y` でUndo / Redoできる
  - `Alt+1` から `Alt+4` でビュー切り替えできる

## Epic 10: Undo / Redo

### PE-042 Undo / Redo基盤

- 優先度: P1
- フェーズ: Phase 18
- 内容: 編集操作履歴を最大100操作まで保持する。
- 受け入れ条件:
  - セル編集をUndo / Redoできる
  - 行追加をUndo / Redoできる
  - 行削除をUndo / Redoできる
  - グループ作成と移動をUndo / Redoできる
  - 操作履歴を最大100件まで保持できる

## Epic 11: 整合性検証と修復支援

### PE-043 エラー一覧

- 優先度: P1
- フェーズ: Phase 19
- 内容: TSV構造検証とメディア検証の結果を一覧表示する。
- 受け入れ条件:
  - エラーと警告を区別して表示できる
  - 対象行へジャンプできる
  - Status Barにエラー件数を表示できる

### PE-044 修復支援

- 優先度: P1
- フェーズ: Phase 19
- 内容: 自動修復可能な問題に対して修復案を提示する。
- 受け入れ条件:
  - `order` の再計算を実行できる
  - 空durationへデフォルト値を設定できる
  - Missing Mediaの再リンクへ誘導できる

## Epic 12: MVP後の拡張

### PE-045 FCPXML Export

- 優先度: P2
- フェーズ: Phase 7
- 内容: DaVinci Resolve / Final Cut向けFCPXMLを書き出す。

### PE-046 EDL Export

- 優先度: P2
- フェーズ: Phase 7
- 内容: EDLを書き出す。

### PE-047 サムネイル自動生成

- 優先度: P2
- フェーズ: Phase 7
- 内容: メディアからサムネイルを自動生成する。

### PE-048 Prompt-only placeholder生成

- 優先度: P2
- フェーズ: Phase 7
- 内容: Prompt-only cutに対して背景プレースホルダー画像を生成し、静止画クリップとして出力可能にする。

### PE-049 音声トリム

- 優先度: P2
- フェーズ: Phase 7
- 内容: `audio_in` / `audio_out` を扱う詳細音声トリムを実装する。

### PE-050 動画ファイル対応

- 優先度: P2
- フェーズ: Phase 7
- 内容: MVP対象外の動画ファイル読み込み、プレビュー、XML出力を扱う。

## MVPマイルストーン

### M1 TSV表示・保存

- 対象: PE-001, PE-002, PE-003, PE-004, PE-005, PE-006, PE-007, PE-021
- 完了条件: `.lctproj` を開き、`cutlist.tsv` をTable Viewで表示・編集・保存できる。

### M2 階層管理

- 対象: PE-008, PE-009, PE-010, PE-013, PE-038, PE-039, PE-040
- 完了条件: `scene > cut` と任意の `scene > multicut > cut` の階層を表示し、追加とグループ作成ができる。

### M3 プロンプト運用

- 対象: PE-016, PE-017, PE-020
- 完了条件: scene / multicut / cutのプロンプトを編集し、有効プロンプトを表示・TSV出力できる。

### M4 Storyboard

- 対象: PE-023, PE-025, PE-026
- 完了条件: Grouped Storyboard Viewでサムネイル付きcutを確認し、Missing Mediaを把握できる。

### M5 Timeline

- 対象: PE-022, PE-027, PE-028, PE-029
- 完了条件: Timeline Viewで静止画と音声を簡易再生できる。

### M6 Premiere XML

- 対象: PE-031, PE-032, PE-033
- 完了条件: Premiere XMLを書き出し、静止画・音声クリップとscene / multicutマーカーを出力できる。

## MVP完了条件

- `.lctproj` を開ける
- `cutlist.tsv` を読み込める
- scene / multicut / cutをTSV上で表現できる
- `scene > cut` と任意の `scene > multicut > cut` の階層を検証できる
- Table ViewでTSVを表示できる
- Hierarchy Viewで階層表示できる
- Grouped Storyboard Viewでcutをサムネイル付き表示できる
- imageをプレビューできる
- audio_fileを再生できる
- image_prompt / video_promptを編集できる
- cutの有効image_prompt / video_promptを表示できる
- LLMが直接編集したTSVを再読み込みできる
- cutをmulticutへ、multicutをsceneへグループ化できる
- cutのdurationを編集できる
- Timeline Viewで静止画と音声を簡易再生できる
- 編集内容を`cutlist.tsv`へ保存できる
- Premiere XMLを書き出せる
- Missing Mediaを検出できる
- 保存時にバックアップを作成できる
