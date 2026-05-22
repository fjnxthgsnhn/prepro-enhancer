# Previz Enhancer 仕様書

## 1. 概要

### 1.1 目的

本アプリは、LLMが生成・編集するTSV形式のカット表を、人間がローカル環境で確認・調整・保存できる制作支援ツールである。

主な用途は以下とする。

- LLMによるカット表作成
- 人間によるカット表レビュー
- 静止画サムネイル付きの構成確認
- 音声ファイル付きの簡易タイムライン確認
- 静止画生成用プロンプトと動画生成用プロンプトの管理
- カットのグループ化管理
- Premiere Pro向けXML書き出し

本アプリは動画ファイルの直接編集アプリではなく、**LLM生成向けのプリビズ・カット設計ツール**として定義する。

---

## 2. 基本方針

### 2.1 MVP方針

MVPでは動画ファイルを扱わない。

MVPで扱う対象は以下とする。

- cut
- multicut
- scene
- TSVカット表
- 静止画ファイル
- 音声ファイル
- 静止画生成用プロンプト
- 動画生成用プロンプト
- 簡易タイムライン
- Premiere Pro向けXML書き出し

MVPで扱わない対象は以下とする。

- 動画ファイル読み込み
- 動画プレビュー
- 動画トリミング
- 動画ファイルの実尺取得
- 動画クリップのPremiere XML出力
- 動画内音声の扱い
- サムネイル自動生成
- プロキシ動画生成

### 2.2 アプリ形態

Tauriを用いたローカルデスクトップアプリとして実装する。

UIはHTML / CSS / TypeScriptで構築し、ローカルファイル読み書き、プロジェクト展開、保存、XML出力などはTauri側で扱う。

---

## 3. 用語定義

| 用語 | 内容 |
|---|---|
| cut | 最小単位。1つのカット、1つの画、1つの生成単位 |
| multicut | 複数のcutを束ねる中間グループ |
| scene | 複数のmulticutを束ねる上位グループ |
| image_prompt | 静止画生成用プロンプト |
| video_prompt | 動画生成用プロンプト |
| cutlist.tsv | LLMと人間が直接編集するカット表 |
| timeline.json | アプリ内部の補助的なタイムライン状態 |
| .lctproj | アプリ用軽量プロジェクトファイル |
| media | 外部参照される静止画・音声ファイル群 |

### 3.1 階層構造

本アプリのデータ階層は以下とする。

```text
scene
  multicut
    cut
```

MVPでは以下の階層のみ許可する。

```text
scene > multicut > cut
```

MVPでは以下を許可しない。

```text
scene > cut
multicut > multicut
cut > cut
```

---

## 4. プロジェクト形式

### 4.1 プロジェクトファイル

アプリのプロジェクトファイルは `.lctproj` とする。

`.lctproj` の実体はZIP形式の軽量プロジェクトファイルとする。

動画・画像・音声などのメディアファイルは原則として `.lctproj` には含めず、外部パス参照とする。

### 4.2 .lctproj内の構成

```text
ProjectName.lctproj
  manifest.json
  cutlist.tsv
  timeline.json
  settings.json
  media_index.json
```

### 4.3 外部メディア構成例

```text
ProjectFolder/
  ProjectName.lctproj
  media/
    images/
      cut001.jpg
      cut002.jpg
    audio/
      cut001.wav
      cut002.wav
```

### 4.4 メディア参照方針

メディアはプロジェクトファイルに含めず、相対パスまたはメディアルート基準のパスで参照する。

TSV内では原則として相対パスを使用する。

```text
media/images/cut001.jpg
media/audio/cut001.wav
```

絶対パスは非推奨とする。

---

## 5. 正本データの扱い

### 5.1 cutlist.tsv

`cutlist.tsv` は、以下の正本とする。

- cut情報
- scene情報
- multicut情報
- タイトル
- 尺
- ステータス
- 静止画パス
- 音声パス
- image_prompt
- video_prompt
- 構図、動作、カメラ、音声演出、メモ

LLMは `cutlist.tsv` を直接編集する。

### 5.2 timeline.json

`timeline.json` は補助データとする。

主に以下を保存する。

- タイムライン表示状態
- 再生ヘッド位置
- ズーム倍率
- 折りたたみ状態
- UI補助情報
- Undo / Redo補助情報

MVPでは、可能な限り `cutlist.tsv` だけでデータを復元できる設計とする。

### 5.3 manifest.json

`manifest.json` はプロジェクト全体設定の正本とする。

例：

```json
{
  "format": "LocalCutBoardProject",
  "formatVersion": "1.0.0",
  "appVersion": "0.1.0",
  "projectName": "Sample Project",
  "mainCutlist": "cutlist.tsv",
  "timeline": "timeline.json",
  "settings": "settings.json",
  "pathMode": "relative",
  "mediaRoots": {
    "project": ".",
    "media": "media",
    "images": "media/images",
    "audio": "media/audio"
  },
  "sequence": {
    "frameRate": 30,
    "width": 1920,
    "height": 1080,
    "audioSampleRate": 48000
  }
}
```

---

## 6. TSV仕様

### 6.1 基本仕様

| 項目 | 仕様 |
|---|---|
| 文字コード | UTF-8 |
| 区切り文字 | タブ |
| 1行目 | ヘッダー |
| 1行 | 1レコード |
| セル内改行 | 直接改行は禁止。必要な場合は `\n` と記述 |
| セル内タブ | 禁止 |

### 6.2 行タイプ

`row_type` により、各行の種類を判定する。

| row_type | 内容 |
|---|---|
| scene | 上位グループ |
| multicut | 中間グループ |
| cut | 最小単位 |

### 6.3 標準カラム

MVP標準カラムは以下とする。

```tsv
row_type	id	parent_id	order	cut	title	duration	status	image	audio_file	image_prompt	video_prompt	scene	subject	composition	action	camera	audio	note
```

### 6.4 カラム定義

| カラム | 必須 | 内容 |
|---|---:|---|
| row_type | 必須 | `scene` / `multicut` / `cut` |
| id | 必須 | 一意ID。例：`sc001`、`mc001`、`ct001` |
| parent_id | 条件付き | 親ID。sceneでは空、multicutではscene ID、cutではmulticut ID |
| order | 必須 | 同一階層内の並び順 |
| cut | 任意 | 表示用カット番号。例：`cut001` |
| title | 任意 | 行タイトル |
| duration | cutでは必須推奨 | 尺。例：`3s` |
| status | 任意 | `draft` / `review` / `fix` / `ok` |
| image | 任意 | 静止画ファイルパス |
| audio_file | 任意 | 音声ファイルパス |
| image_prompt | 任意 | 静止画生成用プロンプト |
| video_prompt | 任意 | 動画生成用プロンプト |
| scene | 任意 | シーン名または場所名 |
| subject | 任意 | 被写体 |
| composition | 任意 | 構図 |
| action | 任意 | 動作 |
| camera | 任意 | カメラワーク |
| audio | 任意 | 音響演出メモ |
| note | 任意 | 制作者メモ |

### 6.5 IDルール

各行は一意の `id` を持つ。

推奨形式は以下とする。

```text
scene:    sc001, sc002, sc003
multicut: mc001, mc002, mc003
cut:      ct001, ct002, ct003
```

`id` は内部同期の基準とする。  
`cut` は表示用の番号であり、リナンバーによって変更される可能性がある。

### 6.6 TSV例

```tsv
row_type	id	parent_id	order	cut	title	duration	status	image	audio_file	image_prompt	video_prompt	scene	subject	composition	action	camera	audio	note
scene	sc001		1		研究所の異変		review			薄暗い研究所、青白い照明、緊張感のある映画的構図	研究所全体を不穏に見せる導入シーン。ゆっくりしたカメラ移動と低い環境音。	研究所		全体	異変の前兆	スローな移動	低い機械音	シーン全体の方向性
multicut	mc001	sc001	1		顕微鏡シークエンス		draft			顕微鏡、研究員の手元、浅い被写界深度	顕微鏡を覗く動作から違和感に気づくまでを数カットで見せる。	研究所	山本	寄り中心	観察する	ドリーイン	微かな機械音	導入マルチカット
cut	ct001	mc001	1	cut001	顕微鏡の寄り	3s	draft	media/images/cut001.jpg	media/audio/cut001.wav	顕微鏡レンズの超クローズアップ、青白い研究室照明、浅い被写界深度	顕微鏡レンズへゆっくりドリーイン。微細な反射が揺れ、緊張感を高める。	研究所	顕微鏡	超寄り	レンズが光る	ゆっくりドリーイン	低い機械音	導入カット
cut	ct002	mc001	2	cut002	山本の目元	3s	review	media/images/cut002.jpg		研究員の目元アップ、真剣な表情、青白い照明	山本が顕微鏡を覗き込み、わずかに眉を寄せる。カメラは微細にプッシュイン。	研究所	山本	目元アップ	違和感に気づく	微細なプッシュイン	息を呑む音	表情重視
```

---

## 7. グループ機能

### 7.1 グループ階層

グループ階層は以下とする。

```text
scene
  multicut
    cut
```

### 7.2 scene

`scene` は最上位のグループである。

主に以下を管理する。

- 場面単位のまとまり
- シーン全体の美術・空気感
- シーン全体のimage_prompt
- シーン全体のvideo_prompt
- シーン全体のnote

### 7.3 multicut

`multicut` は複数のcutを束ねる中間グループである。

主に以下を管理する。

- 連続するカット群
- マルチカット単位の演出意図
- マルチカット単位のimage_prompt
- マルチカット単位のvideo_prompt
- マルチカット単位のnote

### 7.4 cut

`cut` は最小単位である。

主に以下を管理する。

- 1つの静止画
- 1つの音声ファイル
- 1つの尺
- 1つの静止画プロンプト
- 1つの動画プロンプト
- 個別の構図・動作・カメラワーク・音響メモ

### 7.5 グループ作成

選択した複数のcutから、新しいmulticutを作成できる。

処理内容は以下。

1. 新しいmulticut行を作成する
2. 選択cutのparent_idを新しいmulticut IDへ変更する
3. orderを再計算する
4. TSVへ反映する

選択した複数のmulticutから、新しいsceneを作成できる。

処理内容は以下。

1. 新しいscene行を作成する
2. 選択multicutのparent_idを新しいscene IDへ変更する
3. orderを再計算する
4. TSVへ反映する

### 7.6 グループ解除

multicutを解除できる。

解除時は、配下のcutを親scene内の別multicutへ移動するか、新規multicutへ再配置する。

MVPでは、階層制約を維持するため、cutをscene直下には移動しない。

### 7.7 グループ移動

以下の移動を許可する。

- sceneの順番変更
- multicutを別sceneへ移動
- cutを別multicutへ移動

移動時には `parent_id` と `order` を更新する。

### 7.8 折りたたみ

sceneおよびmulticutは折りたたみ表示できる。

折りたたみ状態はTSVには保存せず、settings.jsonまたはtimeline.jsonに保存する。

---

## 8. プロンプト管理

### 8.1 プロンプト種別

本アプリでは以下2種類のプロンプトを扱う。

| カラム | 内容 |
|---|---|
| image_prompt | 静止画生成用プロンプト |
| video_prompt | 動画生成用プロンプト |

MVPでは動画ファイルは扱わないが、動画生成AI用のvideo_promptは管理対象とする。

### 8.2 sceneのプロンプト

sceneのimage_promptおよびvideo_promptは、シーン全体の美術・空気感・演出方向を記述する。

例：

```text
薄暗い研究所。青白い照明。無機質な壁面。緊張感のある映画的な画作り。
```

### 8.3 multicutのプロンプト

multicutのimage_promptおよびvideo_promptは、複数cutにまたがる連続演出を記述する。

例：

```text
顕微鏡を覗く手元から、山本の目元アップ、異変に気づく表情までを連続カットで構成する。
```

### 8.4 cutのプロンプト

cutのimage_promptおよびvideo_promptは、単体cutの具体的な生成指示を記述する。

例：

```text
顕微鏡レンズの超クローズアップ。青白い反射が揺れる。浅い被写界深度。
```

### 8.5 有効プロンプト

cutで実際に使用する有効プロンプトは、階層に沿って合成する。

#### 有効image_prompt

```text
scene.image_prompt
+
multicut.image_prompt
+
cut.image_prompt
```

#### 有効video_prompt

```text
scene.video_prompt
+
multicut.video_prompt
+
cut.video_prompt
```

### 8.6 プロンプト表示モード

アプリは以下の表示モードを持つ。

- cut単体のimage_prompt
- cut単体のvideo_prompt
- 有効image_prompt
- 有効video_prompt

### 8.7 プロンプトコピー

以下をクリップボードへコピーできる。

- 選択cutの有効image_prompt
- 選択cutの有効video_prompt
- 選択multicut配下のcut一覧と有効プロンプト
- 選択scene配下のcut一覧と有効プロンプト

---

## 9. LLM連携要件

### 9.1 基本方針

LLMは `cutlist.tsv` を直接編集する。

アプリはLLM編集後のTSVを読み込み、階層・ID・順序・必須カラムの整合性を検証する。

### 9.2 LLMに編集させてよいカラム

LLMが通常編集してよいカラムは以下とする。

```text
title
duration
status
image_prompt
video_prompt
scene
subject
composition
action
camera
audio
note
```

### 9.3 LLMが慎重に扱うカラム

以下のカラムは構造管理に関わるため、原則としてLLMに変更させない。

```text
row_type
id
parent_id
order
cut
image
audio_file
```

### 9.4 LLM編集ルール

LLMへ渡す標準ルールは以下とする。

```text
TSVを直接編集する。
既存のidは変更しない。
row_type / id / parent_id / order の整合性を壊さない。
新規行を追加する場合は一意のidを付ける。
cutは必ずmulticutの子にする。
multicutは必ずsceneの子にする。
sceneのparent_idは空にする。
セル内にタブを入れない。
セル内に直接改行を入れない。
改行が必要な場合は \n と書く。
```

### 9.5 LLM向けTSV出力

通常のTSVには構造管理カラムが含まれるため、LLMに渡す際は用途に応じて列を絞ったTSVを書き出せる。

#### LLM編集用TSV

```tsv
row_type	id	parent_id	order	cut	title	duration	status	image_prompt	video_prompt	scene	subject	composition	action	camera	audio	note
```

#### LLMレビュー用TSV

```tsv
cut	title	duration	status	image_prompt	video_prompt	note
```

---

## 10. メディア要件

### 10.1 静止画

MVPでは静止画ファイルを扱う。

対応形式は以下とする。

```text
jpg
jpeg
png
webp
gif
```

TSVの `image` カラムに相対パスを指定する。

```text
media/images/cut001.jpg
```

### 10.2 音声

MVPでは音声ファイルを扱う。

対応形式は以下とする。

```text
wav
mp3
aac
m4a
ogg
```

TSVの `audio_file` カラムに相対パスを指定する。

```text
media/audio/cut001.wav
```

### 10.3 動画ファイル

MVPでは動画ファイルを扱わない。

video_promptは管理するが、動画ファイルパス、動画プレビュー、動画トリムは対象外とする。

### 10.4 メディア存在確認

プロジェクト読み込み時およびエクスポート前に、以下を確認する。

- imageの存在
- audio_fileの存在
- サポート形式かどうか
- プロジェクト外パスかどうか

### 10.5 Missing Media

メディアが存在しない場合、以下の警告を表示する。

```text
Missing image
Missing audio
```

### 10.6 Relink Media

メディアパスが壊れた場合、メディアルートを再指定して再リンクできる。

アプリは同名ファイルまたは相対構造の一致をもとにパス修復を試みる。

---

## 11. ビュー要件

### 11.1 Table View

TSVを表形式で表示・編集するビュー。

要件は以下。

- 1行1レコードで表示
- row_typeを視覚的に区別する
- image列はサムネイル表示する
- audio_file列は音声アイコンまたは再生ボタンを表示する
- セル編集に対応する
- 横スクロールに対応する
- 検索、フィルタ、ソートに対応する
- 未保存状態を表示する

### 11.2 Hierarchy View

scene / multicut / cutをツリー表示するビュー。

表示例：

```text
Scene: 研究所の異変
  Multicut: 顕微鏡シークエンス
    cut001 顕微鏡の寄り
    cut002 山本の目元
  Multicut: 警報シークエンス
    cut003 廊下で振り返る
```

要件は以下。

- scene / multicut / cutの階層表示
- 折りたたみ
- ドラッグによる並び替え
- ドラッグによる親変更
- 選択行のDetail Panel表示

### 11.3 Grouped Storyboard View

カットの流れをグループ単位で視覚確認するビュー。

表示構造は以下。

```text
Scene
  Multicut
    Cut Card
    Cut Card
    Cut Card
```

要件は以下。

- scene単位でセクション表示
- multicut単位でカード群をまとめる
- cutは静止画付きカードとして表示
- imageがない場合はimage_promptまたはvideo_promptを表示する
- group行にはプロンプト概要を表示する
- scene / multicutは折りたたみ可能とする

### 11.4 Timeline View

静止画と音声を用いた簡易タイムラインビュー。

MVPでは実クリップ化するのはcutのみとする。

sceneとmulticutはタイムライン上の帯またはマーカーとして表示する。

表示構造は以下。

```text
Scene Band
  Multicut Band
    Cut Clips
```

要件は以下。

- cutをdurationに基づいて横方向に配置する
- imageを静止画クリップとして表示する
- audio_fileを音声クリップとして表示する
- sceneを上位帯として表示する
- multicutを中間帯として表示する
- プレイヘッドを表示する
- スペースキーで再生・停止できる
- 静止画と音声を同期再生する
- cutの順番変更に対応する
- duration変更に対応する
- 編集内容をTSVに反映する

### 11.5 Detail Panel

選択中のscene / multicut / cutを編集するパネル。

#### scene選択時

編集項目：

- title
- status
- image_prompt
- video_prompt
- note

表示項目：

- 配下multicut数
- 配下cut数
- 合計尺
- Missing Media数

#### multicut選択時

編集項目：

- title
- status
- image_prompt
- video_prompt
- note

表示項目：

- 配下cut数
- 合計尺
- Missing Media数

#### cut選択時

編集項目：

- cut
- title
- duration
- status
- image
- audio_file
- image_prompt
- video_prompt
- scene
- subject
- composition
- action
- camera
- audio
- note

表示項目：

- 静止画プレビュー
- 音声再生
- 有効image_prompt
- 有効video_prompt

---

## 12. プレビュー要件

### 12.1 プレビュー優先順位

MVPでは動画ファイルを扱わないため、プレビュー優先順位は以下とする。

```text
1. image
2. image_prompt
3. video_prompt
4. empty placeholder
```

音声は映像プレビュー対象ではなく、再生時に同期再生する。

### 12.2 cutプレビュー

cut選択時は以下を表示する。

- imageが存在する場合：静止画表示
- imageが存在しない場合：image_prompt表示
- image_promptが空の場合：video_prompt表示
- すべて空の場合：空プレースホルダー表示

### 12.3 グループプレビュー

sceneまたはmulticut選択時は、配下cutのサムネイル一覧とグループプロンプトを表示する。

---

## 13. 編集要件

### 13.1 セル編集

Table Viewでセル編集できる。

操作は以下。

| 操作 | 内容 |
|---|---|
| クリック | 行選択 |
| ダブルクリック | セル編集 |
| Enter | 確定 |
| Esc | キャンセル |
| Ctrl+S | 保存 |

### 13.2 行追加

以下の行を追加できる。

- scene
- multicut
- cut

追加時にはIDを自動生成する。

### 13.3 行削除

行を削除できる。

削除前に確認ダイアログを表示する。

scene削除時は配下multicutとcutの扱いを確認する。

multicut削除時は配下cutの扱いを確認する。

MVPでは、配下要素が存在するsceneまたはmulticutを削除する場合、確認後に配下要素も削除する。

### 13.4 行複製

scene / multicut / cutを複製できる。

MVPではcut複製を優先実装とする。

複製時は新しいidを発行する。

### 13.5 リナンバー

cut番号を再採番できる。

例：

```text
cut001
cut002
cut003
```

リナンバーしてもidは変更しない。

MVPではファイル名の自動変更は行わない。

---

## 14. 検索・フィルタ・ソート

### 14.1 検索

全カラムを対象に検索できる。

要件は以下。

- 日本語検索対応
- 大文字小文字を区別しない
- 入力中に即時反映

### 14.2 フィルタ

MVPで対応するフィルタは以下。

- row_type
- status
- scene
- subject
- Missing Media有無

### 14.3 ソート

MVPで対応するソートは以下。

- order
- cut
- duration
- status
- row_type

階層構造を維持するため、通常表示では親子関係を優先する。

---

## 15. タイムライン要件

### 15.1 基本方針

Timeline Viewではcutのみを実クリップとして扱う。

sceneとmulticutはタイムライン上のセクション帯またはマーカーとして扱う。

### 15.2 クリップ生成ルール

cutから以下を読み取り、タイムライン上に配置する。

- duration
- image
- audio_file
- title
- status
- image_prompt
- video_prompt

### 15.3 尺の扱い

cutの尺は `duration` を正とする。

`duration` が空または不正な場合、デフォルト3秒として扱い、警告を表示する。

### 15.4 再生

Timeline Viewでは以下に対応する。

- プレイヘッド移動
- 再生 / 停止
- 静止画の時間表示
- audio_fileの同期再生
- 現在cutのDetail Panel連動

### 15.5 編集

Timeline Viewでは以下を編集できる。

- cut順序
- cutのduration
- cutの有効 / 無効

編集結果は内部データへ即時反映し、保存時にcutlist.tsvへ書き込む。

### 15.6 音声トリム

MVPでは音声の詳細トリムは任意とする。

将来拡張として以下のカラムを追加できる。

```text
audio_in
audio_out
```

---

## 16. Premiere XML Export要件

### 16.1 主ターゲット

主ターゲットはAdobe Premiere Proとする。

主エクスポート形式は以下。

```text
Premiere XML / Final Cut Pro 7 XML / .xml
```

### 16.2 補助ターゲット

補助ターゲットはDaVinci Resolveとする。

DaVinci Resolve向けFCPXML出力は将来拡張とする。

### 16.3 Export UI

Toolbarに以下を配置する。

```text
[Export]
  Premiere XML (.xml)
  DaVinci / Final Cut FCPXML (.fcpxml)  // 将来対応
  EDL (.edl)                            // 将来対応
```

MVPではPremiere XMLのみ有効とする。

### 16.4 Premiere XML出力対象

MVPで出力する対象は以下。

- cutの静止画クリップ
- cutの音声クリップ
- sceneマーカー
- multicutマーカー
- cut名
- duration
- タイムライン順
- メディアパス

### 16.5 Premiere XMLで出力しないもの

MVPでは以下を出力しない。

- 動画クリップ
- トランジション
- エフェクト
- 速度変更
- テキストレイヤー
- カラー補正
- キーフレーム
- ネストシーケンス
- 複数ビデオトラック
- 複雑な音声チャンネル設定

### 16.6 scene / multicutの扱い

sceneおよびmulticutはPremiere上ではシーケンスマーカーとして出力する。

マーカーには以下を含める。

- title
- image_prompt
- video_prompt
- note

### 16.7 cutの扱い

cutはPremiere上では以下として出力する。

- imageがある場合：静止画クリップ
- audio_fileがある場合：音声クリップ
- imageがない場合：マーカーのみ

### 16.8 Prompt-only cut

imageがなく、image_promptまたはvideo_promptのみを持つcutは、MVPではマーカーとして出力する。

将来拡張として、黒背景プレースホルダー画像を生成し、静止画クリップとして出力できるようにする。

### 16.9 パス解決

アプリ内部では相対パスで管理する。

Premiere XML出力時のみ、プロジェクトルート基準で絶対パスまたはfile URLへ変換する。

例：

```text
media/images/cut001.jpg
```

出力時：

```text
file:///D:/Works/Project/media/images/cut001.jpg
```

### 16.10 Export前検証

Export前に以下を検証する。

- imageファイル存在
- audio_fileファイル存在
- duration有効性
- パスが解決できるか
- サポート形式か

Missing imageのみの場合はマーカーとして出力可能とする。  
Missing audioがある場合は警告し、該当音声クリップを除外する。

---

## 17. 保存要件

### 17.1 保存対象

保存対象は以下。

- cutlist.tsv
- timeline.json
- settings.json
- media_index.json
- manifest.json

### 17.2 保存操作

保存操作は以下。

| 操作 | 内容 |
|---|---|
| Ctrl+S | 現在のプロジェクトを保存 |
| Save As | 別名で.lctproj保存 |
| Export TSV | cutlist.tsv単体を書き出し |
| Export Premiere XML | Premiere XMLを書き出し |

### 17.3 即時反映とディスク保存

UI編集後、内部データには即時反映する。

ただし、ディスクへの保存はCtrl+SまたはSave実行時に行う。

自動ディスク保存はMVPでは行わない。

### 17.4 バックアップ

保存時にはバックアップを作成する。

バックアップ対象は以下。

- manifest.json
- cutlist.tsv
- timeline.json
- settings.json

メディアファイルはバックアップ対象外とする。

バックアップ例：

```text
.backups/
  2026-05-22_1530/
    manifest.json
    cutlist.tsv
    timeline.json
    settings.json
```

---

## 18. Undo / Redo要件

### 18.1 対応操作

Undo / Redoは以下の操作に対応する。

- セル編集
- 行追加
- 行削除
- 行複製
- グループ作成
- グループ移動
- cut順変更
- duration変更
- status変更
- プロンプト編集

### 18.2 操作履歴数

MVPでは最大100操作まで保持する。

---

## 19. 整合性検証要件

### 19.1 TSV構造検証

読み込み時に以下を検証する。

- 必須カラムが存在するか
- row_typeが有効か
- idが一意か
- parent_idが存在するか
- sceneのparent_idが空か
- multicutのparent_idがsceneか
- cutのparent_idがmulticutか
- orderが有効か
- 循環参照がないか

### 19.2 メディア検証

以下を検証する。

- imageが存在するか
- audio_fileが存在するか
- サポート形式か
- 相対パスとして解決できるか

### 19.3 修復支援

検証エラーがある場合、エラー一覧を表示する。

可能なものは自動修復を提案する。

例：

- orderの再計算
- Missing Mediaの再リンク
- 空durationへのデフォルト値設定

---

## 20. UI構成

### 20.1 メインレイアウト

```text
------------------------------------------------
Toolbar
  Open / Save / Export / View Switch / Search
------------------------------------------------
Left Panel
  Hierarchy View
------------------------------------------------
Main Area
  Table / Grouped Storyboard / Timeline
------------------------------------------------
Right Panel
  Detail Panel / Prompt Preview / Media Preview
------------------------------------------------
Status Bar
  Project Path / Save State / Error Count
------------------------------------------------
```

### 20.2 Toolbar

Toolbarに以下を配置する。

```text
Open Project
Save
Save As
Export TSV
Export Premiere XML
Add Scene
Add Multicut
Add Cut
Create Multicut
Create Scene
Renumber Cuts
Table
Hierarchy
Storyboard
Timeline
Search
Filter
```

### 20.3 Status Bar

Status Barには以下を表示する。

- 現在のプロジェクト名
- 現在のプロジェクトパス
- cut数
- multicut数
- scene数
- Missing Media数
- 未保存状態
- 最終保存時刻

---

## 21. ショートカット

| 操作 | ショートカット |
|---|---|
| 保存 | Ctrl+S |
| 開く | Ctrl+O |
| 検索 | Ctrl+F |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| 新規cut | Ctrl+N |
| 複製 | Ctrl+D |
| 削除 | Delete |
| 再生 / 停止 | Space |
| Table View | Alt+1 |
| Hierarchy View | Alt+2 |
| Storyboard View | Alt+3 |
| Timeline View | Alt+4 |

---

## 22. 実装フェーズ

### Phase 1: TSV基盤

- .lctproj読み込み
- cutlist.tsv読み込み
- TSVパース
- Table View
- 静止画表示
- 保存
- 基本検証

### Phase 2: グループ管理

- scene / multicut / cut階層表示
- Hierarchy View
- グループ作成
- グループ移動
- 折りたたみ
- order再計算

### Phase 3: プロンプト管理

- image_prompt編集
- video_prompt編集
- 有効image_prompt表示
- 有効video_prompt表示
- プロンプトコピー
- LLM向けTSV書き出し

### Phase 4: Storyboard View

- Grouped Storyboard View
- cutカード表示
- scene / multicutごとのセクション表示
- Missing Media表示

### Phase 5: Timeline View

- cutを静止画クリップ化
- audio_file同期再生
- scene / multicut帯表示
- duration編集
- cut順変更

### Phase 6: Premiere XML Export

- 静止画クリップ出力
- 音声クリップ出力
- scene / multicutマーカー出力
- Export前検証
- Export Log生成

### Phase 7: 拡張

- DaVinci / Final Cut向けFCPXML
- EDL Export
- サムネイル自動生成
- Prompt-only placeholder生成
- 音声トリム
- 動画ファイル対応

---

## 23. MVP受け入れ条件

MVP完了条件は以下とする。

- `.lctproj` を開ける
- `cutlist.tsv` を読み込める
- scene / multicut / cutをTSV上で表現できる
- scene > multicut > cutの階層を検証できる
- Table ViewでTSVを表示できる
- Hierarchy Viewで階層表示できる
- Grouped Storyboard Viewでcutをサムネイル付き表示できる
- imageをプレビューできる
- audio_fileを再生できる
- image_promptを編集できる
- video_promptを編集できる
- scene / multicut / cutそれぞれにimage_promptとvideo_promptを設定できる
- cutの有効image_promptを表示できる
- cutの有効video_promptを表示できる
- LLMが直接編集したTSVを再読み込みできる
- id / parent_id / orderの整合性を検証できる
- cutをmulticutへグループ化できる
- multicutをsceneへグループ化できる
- cutのdurationを編集できる
- Timeline Viewで静止画と音声を簡易再生できる
- 編集内容をcutlist.tsvへ保存できる
- Premiere XMLを書き出せる
- Premiere XMLでcutを静止画・音声クリップとして出力できる
- Premiere XMLでscene / multicutをマーカーとして出力できる
- Missing Mediaを検出できる
- 保存時にバックアップを作成できる

---

## 24. 非機能要件

### 24.1 対象OS

MVPではWindows 10 / 11を第一ターゲットとする。

将来対応としてmacOS / Linuxを検討する。

### 24.2 オフライン動作

本アプリは完全オフラインで動作する。

外部API通信、クラウド同期、CDN依存はMVPでは行わない。

### 24.3 パフォーマンス目標

| 規模 | 目標 |
|---:|---|
| 〜100 cut | 快適に動作 |
| 〜300 cut | 実用範囲 |
| 〜1000 cut | 最適化検討 |

### 24.4 セキュリティ

- 外部通信は行わない
- ユーザーが選択したプロジェクトファイルおよびメディアルートのみを扱う
- 任意の全ディスクアクセスを前提にしない
- メディアパスは読み取り専用扱いとする
- アプリはメディアファイルを勝手に変更しない

---

## 25. 最終仕様まとめ

本アプリは以下の設計で進める。

```text
アプリ形態:
  Tauri製ローカルデスクトップアプリ

プロジェクト形式:
  .lctproj = 軽量ZIPプロジェクト

主データ:
  cutlist.tsv

補助データ:
  timeline.json
  settings.json
  media_index.json
  manifest.json

最小単位:
  cut

階層:
  scene > multicut > cut

MVPメディア:
  静止画
  音声

MVP対象外:
  動画ファイル

プロンプト:
  image_prompt
  video_prompt

LLM連携:
  LLMがcutlist.tsvを直接編集

Export:
  Premiere XMLを主ターゲット
  DaVinci / Final Cut FCPXMLは将来対応
```

本仕様では、動画ファイルをMVPから外すことで実装リスクを抑えつつ、LLMによるTSV編集、静止画確認、音声確認、プロンプト管理、グループ構造、Premiere連携を優先する。

