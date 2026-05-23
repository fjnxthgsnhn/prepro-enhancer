# .lctproj TSV読み込み不具合 現状レポート

作成日: 2026-05-23  
対象: Prepro Enhancer `.lctproj` / `cutlist.tsv` 読み込み処理

## 現状

ユーザー報告として、直近修正後も「`.lctproj`内のTSVが正常に読み込まれない」問題は解消していない。

ローカルの自動検証では以下は通過済み。

- `npm run check`
- `npm run test:smoke`
- `npm run tauri:check`

直近コミット:

- `dab2281 Fix lctproj TSV loading resilience`
- `e7e7b4b Load saved new project file in Tauri`

現在の作業ツリーはレポート作成前時点ではクリーンだった。

## これまでに対応した事項

### NewProject / Tauri保存読み込み

- Tauri側に `read_project_file(path)` を追加し、`NewProject` 後に保存した `.lctproj` を即座に読み戻す流れへ変更した。
- Web fallbackでは `.lctproj` をdownloadし、同じbytesをメモリ上で読み込む流れへ変更した。
- 新規プロジェクトの `cutlist.tsv` はヘッダー行のみとし、初期scene/multicut/cutは作らないようにした。
- Tauri `Save as` で保存先に拡張子が無い場合、Rust側で `.lctproj` を補完するようにした。

### `.lctproj`判定

- `.lctproj`判定を小文字固定の `endsWith(".lctproj")` から、`fileName/path` の小文字比較へ変更した。
- `UPPERCASE.LCTPROJ` のような大文字拡張子でもプロジェクトとして扱うsmokeを追加した。
- Tauri戻り値の `file_name` / `fileName` 差を吸収する `normalizeTauriFile()` を追加した。

### ZIP読み込み

- 旧実装はlocal file headerを先頭から読む簡易方式だったため、central directory基準の読み込みへ変更した。
- `manifest.json` と `manifest.mainCutlist` の探索を追加した。
- `project/manifest.json` + `project/cutlist.tsv` のようなフォルダ配下projectを読めるようにした。
- `__MACOSX`、隠しファイル、`.backups` 系を候補から除外するようにした。
- ZIP path正規化を強化した。
  - `\` を `/` に変換
  - 先頭 `/` を除去
  - `.` セグメントを除去
  - `..` を拒否
- central directoryの境界チェックを追加した。
- Multi-disk ZIP、Zip64、暗号化ZIP、未対応圧縮方式は明示的にエラーにするようにした。
- ZIP解析失敗時に `loadProjectFromBytes()` 全体でcatchし、既存stateを壊さずalert/consoleへ出すようにした。

### TSV parser互換

- ヘッダーのBOM、空白、大文字小文字、スペース/ハイフン/underscore差を吸収するようにした。
- `audio` ヘッダーを `dialogue` として読み替えるようにした。
- 旧 `cut` / `status` カラムは読み込み時に無視し、保存/exportは現行新スキーマのままとした。
- `row_type` / `id` / `parent_id` / `order` の値側をtrimするようにした。
- `row_type` は小文字化し、`multi cut` / `multi_cut` / `mc` / `ct` などを正規化するようにした。

### 読み込み後の階層補正

- `parseTsv()` 後に `normalizeImportedRows()` を通すようにした。
- sceneの `parent_id` は空に補正する。
- 親が無い、または不正なmulticutは自動作成した `Imported Scene` 配下へ移す。
- 親が無い、または不正なcutは自動作成した `Imported Multicut` 配下へ移す。
- 補正後にorderを再計算する。
- 補正が発生した場合、Validationにwarningとして表示する。

### UI状態

- Project/TSV読み込み時にSearch欄をクリアするようにした。
- 読み込み失敗時は既存プロジェクト状態を維持する方針にした。
- 読み込み成功時は先頭行を選択し、空プロジェクトなら未選択にするようにした。

### 追加済みsmoke

追加または確認済みの主なケース:

- NewProjectの `.lctproj` downloadがヘッダーのみTSVを含む。
- `manifest.mainCutlist = data/cutlist.tsv` を読める。
- `project/manifest.json` + `project/cutlist.tsv` を読める。
- 旧TSVの `audio` が `dialogue` に入る。
- `.LCTPROJ` 大文字拡張子を読める。
- `row type` / `parent id` / `audio file` などのヘッダー揺れを読める。
- orphan cutを `Imported Scene` / `Imported Multicut` 配下に表示できる。
- 不正ZIP読み込み時にalertが出て、既存Sample Projectが維持される。

## 現在確認できている実装上の注意点

### 旧 `loadProjectFromBytes()` がコメントとして残っている

`src/app.js` には旧実装の `loadProjectFromBytes()` がブロックコメントで残っている。

これは実行上は無効だが、検索時に同名関数が2件ヒットするため、調査時のノイズになる。次回修正時に削除した方がよい。

### smokeは合成fixture中心

現在のsmokeはテスト内で生成したstored ZIP fixtureを使っている。

そのため、ユーザー環境で失敗している実際の `.lctproj` が以下のどれかに該当する場合、まだ再現できていない可能性がある。

- deflate圧縮されたZIPで、Tauri WebView2側の `DecompressionStream("deflate-raw")` が期待通り動かない
- Zip64形式
- Excelや外部ツール由来の想定外TSVヘッダー
- TSVがUTF-8以外の文字コード
- TSV内の改行/引用符/タブエスケープが現行parser想定と異なる
- manifestやcutlistが重複しており、意図しないentryを選んでいる
- `.lctproj`ではなく通常TSVとして開かれている

### TSV parserは引用符付きTSVに未対応

現行の `splitTsvLine()` は単純な `line.split("\t")`。

以下のようなTSVには対応していない。

- セル内に実改行があるTSV
- セル内にタブが含まれ、引用符で囲われているTSV
- CSV/TSVエクスポートツールが引用符エスケープしたTSV

アプリ自身の保存形式ではセル内改行は `\n` 文字列へ変換するため問題になりにくいが、外部TSVでは原因になり得る。

### 文字コードはUTF-8固定

ZIP entryとTSV本文は `TextDecoder()` のデフォルト、つまりUTF-8として読んでいる。

Shift_JIS / CP932 のTSVが含まれる `.lctproj` の場合、ヘッダーや本文が文字化けし、必須カラム検出に失敗する可能性がある。

### deflate対応はWeb API依存

ZIP method 8は `window.DecompressionStream` がある場合のみ対応している。

Tauri WebView2のバージョンや実行環境によっては、deflate ZIPを読めない可能性が残る。

## 未解決の可能性が高い原因候補

1. 実際の `.lctproj` がテストfixtureと異なるZIP形式である。
   - 特にdeflate / Zip64 / data descriptor / ZIP comment / wrapper重複。

2. 実際の `cutlist.tsv` が単純TSVではない。
   - 引用符付きセル、実改行、タブ入りセル、UTF-8以外の文字コード。

3. 必須ヘッダー名が想定外。
   - 例: `rowType`, `row.type`, `kind`, `parent`, 日本語列名など。

4. 読み込み自体は成功しているが、表示前の別条件でTableが空に見えている。
   - active view、search、選択状態、render中例外など。

5. Tauri実行時のみ失敗している。
   - Browser smokeでは通るが、Tauri WebView2やRust dialog経路でbytes/filename/pathが異なる可能性。

## 次に行うべき調査

### 1. 失敗する実ファイルのZIP entry一覧を取得する

実際に読めない `.lctproj` を対象に、以下を確認する。

- entry名一覧
- `manifest.json` の有無と場所
- `manifest.mainCutlist`
- 実際に選ばれているcutlist path
- 各entryのcompression method
- Zip64かどうか

### 2. cutlist.tsvの先頭数行とヘッダーを確認する

確認項目:

- 文字コード
- 1行目ヘッダー
- `row_type` / `id` 相当列の有無
- 行数
- タブ区切りかどうか
- セル内実改行や引用符の有無

### 3. Tauri版でのconsole診断を取る

現行コードは以下をconsoleへ出す。

- `lctproj entries`
- `lctproj mainCutlist`
- `lctproj tsv headers`
- `Failed to load .lctproj`

Tauri devtoolsまたはログ出力で、この4点を取得できれば原因をかなり絞れる。

### 4. ZIP処理をRust側に寄せる案を検討する

JS手書きZIP readerは限界がある。

実ファイルが外部ZIP実装由来の場合は、Tauri/Rust側で `zip` crate等を使って `manifest.json` と `cutlist.tsv` を抽出し、JSにはテキストとmedia bytesを渡す構成がより安定する。

## 次回修正案

優先順位:

1. 旧コメントの `loadProjectFromBytes()` を削除して調査ノイズをなくす。
2. 失敗ファイルの診断用に、読み込み失敗時の詳細をUI/ログに出す一時的なdebug panelまたはdiagnostic exportを追加する。
3. `splitTsvLine()` を実TSV parserへ置き換え、引用符・セル内改行に対応する。
4. UTF-8 decode失敗/文字化け疑いに対し、CP932 fallbackを検討する。
5. deflate/Zip64含むZIP処理をRust側に移す。

## 参考ファイル

- `src/app.js`
  - `.lctproj`判定: `isProjectFile()`
  - Tauri戻り値正規化: `normalizeTauriFile()`
  - Project読込: `loadProjectFromBytes()`
  - ZIP entry探索: `findZipEntry()`
  - TSV読込: `loadRowsFromTsv()` / `parseTsv()`
  - 階層補正: `normalizeImportedRows()`
  - ZIP parser: `readZipEntries()`
- `src-tauri/src/main.rs`
  - `save_project_as()`
  - `ensure_extension()`
- `tests/smoke.mjs`
  - `.lctproj` / TSV互換テストfixture

