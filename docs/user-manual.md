# Prepro Enhancer ユーザーマニュアル

## 1. Prepro Enhancerとは

Prepro Enhancerは、LLMが作成したカット表を人間が確認・編集するためのローカルデスクトップアプリです。

主に以下の作業に使います。

- シーン、マルチカット、カットの整理
- TSVカット表の確認と編集
- 静止画、音声、動画ファイル参照の管理
- 画像生成・動画生成用プロンプトの編集
- 簡易タイムライン確認
- Premiere Pro向けXMLの書き出し
- プロジェクト内 `AGENTS.md` の編集

動画編集ソフトではなく、生成AIやLLMと連携しやすいプリプロ用のカット設計ツールです。

## 2. 基本用語

| 用語 | 意味 |
|---|---|
| project | `.lctproj` 形式で保存する作業ファイル |
| scene | 物語や撮影単位の大きなまとまり |
| multicut | 複数のcutをまとめる中間グループ |
| cut | 1つの画、1つの生成単位、または最小の演出単位 |
| cutlist.tsv | カット情報の中心となるTSVファイル |
| assets.json | キャラクター、背景、小物などの素材管理データ |
| prompts.json | プロンプト編集データ |
| generate.json | 生成結果や生成対象の管理データ |
| AGENTS.md | LLMやAIエージェント向けのプロジェクト指示書 |

基本階層は以下です。

```text
scene
  multicut
    cut
```

`multicut` は任意です。シンプルなプロジェクトでは `scene > cut` だけでも使えます。

## 3. 起動とプロジェクト

### 新規プロジェクトを作る

1. アプリを起動します。
2. Welcome画面またはFileメニューから `New Project` を選びます。
3. 保存先とファイル名を選び、`.lctproj` として保存します。
4. 空のプロジェクトが開きます。

### 既存プロジェクトを開く

1. Fileメニューから `Open Project` を選びます。
2. `.lctproj`、`.tsv`、または `.txt` を選択します。
3. `.lctproj` の場合はプロジェクト全体が読み込まれます。
4. TSV単体の場合はカット表として読み込まれ、新しい作業状態になります。

### 保存する

- `Save`: 現在の `.lctproj` に上書き保存します。
- `Save as`: 別名で `.lctproj` を保存します。
- 未保存変更がある場合は、ステータスバーに未保存状態が表示されます。

## 4. 画面構成

### Toolbar

画面上部のツールバーから、Fileメニュー、Refresh Project、ビュー切り替え、検索を操作します。

### Left Panel

プロジェクト内の階層を表示します。scene、multicut、cutの構造を確認し、項目を選択できます。

### Main View

選択中のビューを表示します。主なビューは以下です。

- Table
- Storyboard
- Timeline
- PromptEdit
- Assets
- Agents

### Right Panel

選択中の行や素材に関する詳細情報を表示します。

- Detail
- Prompt Preview
- Media Preview
- Validation

右パネルは折りたたみできます。

### Status Bar

画面下部に、プロジェクトパス、行数、メディア不足数、保存状態、最終保存時刻を表示します。

## 5. Table View

Table Viewでは、カット表を表形式で編集します。

表示列は以下の順です。

```text
id, title, duration, scene, subject, composition, action, camera, audio,
image_prompt, video_prompt, image, audio_file, video_file, note
```

### セルを編集する

1. 編集したいセルをクリックします。
2. 値を入力します。
3. フォーカスを外すと変更が反映されます。

### 行を選択する

- 行クリックで選択します。
- 複数選択や範囲選択は、既存のOS操作に近い感覚で使えます。

### 行の種類

| row_type | 用途 |
|---|---|
| scene | シーン |
| multicut | 複数cutのまとまり |
| cut | 最小単位のカット |

`row_type`、`parent_id`、`order` は内部構造管理用で、Table Viewでは通常表示されません。

## 6. Storyboard View

Storyboard Viewでは、scene、multicut、cutの構成をカード形式で確認します。

主な用途:

- カットの流れを視覚的に確認する
- scene単位で構成を見る
- 画像やプロンプトの有無をざっくり確認する

画像パスが設定され、参照先が見つかる場合はプレビューに表示されます。

## 7. Timeline View

Timeline Viewでは、cutの長さや並びを簡易タイムラインで確認します。

主な用途:

- `duration` の確認
- シーン全体の尺感の確認
- 音声や画像の割り当て状況の確認

Premiere Proのような本格編集ではなく、カット設計段階のラフな確認用です。

## 8. PromptEdit View

PromptEdit Viewでは、画像生成・動画生成に使うプロンプトを編集します。

主な対象:

- `image_prompt`
- `video_prompt`
- prompt関連のJSONデータ

Table Viewのprompt列とも連動します。プロンプトを更新した後は、保存して `.lctproj` に反映してください。

## 9. Assets View

Assets Viewでは、キャラクター、背景、小物などの素材を管理します。

主な用途:

- 参照画像や音声ファイルの登録
- asset名や種別の管理
- 画像パスの確認
- 素材不足の確認

メディアファイルは原則として `.lctproj` に埋め込まず、外部ファイルへの相対パスとして参照します。

推奨例:

```text
ProjectFolder/
  ProjectName.lctproj
  media/
    images/
    audio/
    video/
    references/
```

## 10. Agents View

Agents Viewでは、プロジェクト内の `AGENTS.md` を編集できます。

`AGENTS.md` は、LLMやAIコーディングエージェントにプロジェクトの編集方針を伝えるためのMarkdown文書です。

### 編集する

1. `Agents` タブを開きます。
2. テキストエリアでMarkdownを編集します。
3. 保存すると `.lctproj` 内の `AGENTS.md` に書き込まれます。

### Resetする

`Reset` を押すと、既定のAGENTSテンプレートに戻せます。実行前に確認ダイアログが表示されます。

## 11. Refresh Project

`Refresh Project` は、保存済み `.lctproj` をディスクから再読み込みして、アプリ内の正本データを更新します。

対象:

- `manifest.json`
- `cutlist.tsv`
- `assets.json`
- `generate.json`
- `prompts.json`
- `AGENTS.md`

対象外:

- `timeline.json`
- `settings.json`
- 同梱メディアBlob
- UIの折りたたみ状態

外部LLMや手作業で `.lctproj` 内の正本ファイルを編集した後、アプリに反映したい場合に使います。

未保存変更がある場合は、破棄して更新するか確認されます。

## 12. Fileメニュー

主な操作:

| 操作 | 内容 |
|---|---|
| New Project | 新規プロジェクト作成 |
| Open Project | `.lctproj` やTSVを開く |
| Save | 上書き保存 |
| Save as | 別名保存 |
| Settings | UI設定を開く |
| Create Backup Now | 手動バックアップ作成 |
| Restore Backup | バックアップから復元 |
| Repair Current TSV | 現在のTSVを修復 |
| Repair TSV File | 外部TSVファイルを修復 |
| Export TSV | 標準TSVを書き出し |
| Export LLM TSV | LLM向けTSVを書き出し |
| Export Premiere XML | Premiere Pro向けXMLを書き出し |

## 13. Settings

Settingsではアプリ全体のUI設定を変更できます。

設定項目:

- Language: English / 日本語 / 中文 / 한국어
- Theme: Dark / Light
- Auto backup interval: 自動バックアップ間隔

設定はローカル環境の `localStorage` に保存されます。`.lctproj` には保存されません。

## 14. Export

### TSV

標準のカット表TSVを書き出します。既存プロジェクトやLLM編集用の正本として使えます。

### LLM TSV

LLMへ渡しやすいTSV形式で書き出します。AIにカット表を編集してもらう場合に使います。

### Premiere XML

Premiere Pro向けのXMLを書き出します。

現時点では、動画ファイルの実尺取得や本格的な動画編集情報の出力ではなく、カット設計情報をPremiere側へ渡すための簡易出力です。

## 15. バックアップと復元

### 自動バックアップ

保存済み `.lctproj` に対して、自動バックアップが作成されます。間隔はSettingsで変更できます。

### 手動バックアップ

Fileメニューの `Create Backup Now` から手動でバックアップを作成できます。

### 復元

Fileメニューの `Restore Backup` からバックアップを選んで復元できます。復元前には現在状態のバックアップが作成されます。

## 16. TSV修復

TSVの列不足や形式崩れがある場合、修復確認ダイアログが表示されることがあります。

修復を承認すると、読み込み可能な形に補正してプロジェクトへ取り込みます。重要なTSVは、修復前に別ファイルとして保存しておくことを推奨します。

## 17. キーボードショートカット

| 操作 | ショートカット |
|---|---|
| 保存 | Ctrl+S |
| 開く | Ctrl+O |
| 検索 | Ctrl+F |
| グループ化 | Ctrl+G |
| グループ解除 | Ctrl+Shift+G |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| 再生/停止 | Space |
| Table | Alt+1 |
| Storyboard | Alt+2 |
| Timeline | Alt+3 |
| PromptEdit | Alt+4 |
| Assets | Alt+5 |
| Agents | Alt+6 |

## 18. よくあるトラブル

### メディアが表示されない

`image`、`audio_file`、`video_file` のパスが正しいか確認してください。プロジェクトファイルと同じフォルダを基準にした相対パスを推奨します。

### Refresh Projectできない

`.lctproj` として保存済みのプロジェクトを開いている必要があります。ブラウザ版や未保存状態ではRefreshできません。

### 変更が保存されていない

ステータスバーの保存状態を確認してください。未保存の場合は `Save` または `Save as` を実行してください。

### LLMで編集した内容が反映されない

`.lctproj` 内の `cutlist.tsv`、`assets.json`、`generate.json`、`prompts.json`、`AGENTS.md` を更新した後、アプリ側で `Refresh Project` を実行してください。

## 19. 推奨ワークフロー

1. 新規プロジェクトを作成します。
2. 台本や構成案をもとにLLMで `cutlist.tsv` を作成します。
3. `.lctproj` に取り込み、Table Viewで確認します。
4. Storyboard ViewとTimeline Viewで流れと尺を確認します。
5. Assets Viewで必要素材を整理します。
6. PromptEdit Viewで画像・動画生成用プロンプトを調整します。
7. 必要に応じてLLMに `.lctproj` またはTSVを渡し、編集後に `Refresh Project` で反映します。
8. Premiere XMLやTSVを書き出し、次工程に渡します。
