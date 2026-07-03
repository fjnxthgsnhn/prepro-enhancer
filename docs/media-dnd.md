# メディアD&D実装仕様

更新日: 2026-07-03

この文書を、Prepro EnhancerのメディアD&Dに関する唯一の実装仕様とする。過去の`dragDropEnabled`切替案や、HTML5 D&DだけでTauriのフルパスを取得する案は使用しない。

## 必須構成

- `src-tauri/tauri.conf.json`の`dragDropEnabled`は必ず`true`にする。
- Windows ExplorerからのファイルDropはTauri native D&Dで受信し、OSのフルパスを正規入力とする。
- scene、multicut、cut、Timeline clipの内部並べ替えはHTML5 D&Dを使わず、Pointer Eventsで処理する。
- ファイルDropと内部並べ替えは独立した経路にする。

`dragDropEnabled: false`へ戻すとHTML5 Dropは発生するが、WebViewの`File`からフルパスを取得できない。その場合は`media/images/...`などのZIP内部パスへフォールバックするため、Tauri版の「外部フルパスを登録する」という要件を満たさない。

## Tauri native Drop経路

Rustのrun loopは`WindowEvent::DragDrop`の`Enter`、`Over`、`Drop`、`Leave`を受信する。payloadにはイベント種別、フルパス、物理解像度座標、scale factorを含める。

RustからWebViewへは次の経路を併用する。

1. `window.__PREPRO_NATIVE_DROP__`を`WebviewWindow.eval()`で直接呼び出す。
2. `asset-file-drop`カスタムイベントを送信する。
3. フロント側でTauri標準`onDragDropEvent`を登録する。
4. `tauri://drag-drop`も互換フォールバックとして登録する。

複数経路から同じDropが届くため、正規化したpaths、座標、短い時間窓からキーを作り、1回だけ適用する。どれか一つのイベント経路を安易に削除しない。直接WebView転送は、TauriイベントAPIが実機で通知されない場合の主要な耐障害経路である。

## Drop対象と座標

- Table: `tbody tr[data-id]`のcut行
- Storyboard: `.cut-card[data-id]`
- Timeline: `.timeline-clip.cut[data-id]`
- Assets: Assets領域全体、または既存`.asset-card`

Tauriの座標がCSS pixelかphysical pixelかは環境と経路で異なるため、未変換座標と`scaleFactor`で除算した座標の両方を候補にする。`elementFromPoint()`で現在のビューに対応する有効な対象が得られた候補を採用する。

`Enter`と`Over`では対象をハイライトし、`Drop`と`Leave`で解除する。対象を解決できないDropは黙って捨てず、`[assets-dnd]`警告とトーストを出す。

## 登録と永続化

cutへDropしたファイルは拡張子またはMIMEから次へ割り当てる。

- 画像: `image`
- 音声: `audio_file`
- 動画: `video_file`

外部フルパスをcutへ設定した後、同じcut・typeの`generate.json` itemを作成またはactive化する。保存時は`cutlist.tsv`、`generate.json`、`media_index.json`の代表パスを一致させる。通常形式の外部パスはファイルが一時的に存在しなくても削除せず、Missing Mediaとして保持する。

Assets領域ではフルパスを`assets.json`のasset `path`へ登録する。既存カード上へのDropはそのカードを更新し、空き領域へのDropは新規assetを作成する。

Web版などnativeパスを取得できない環境では、裸のファイル名を保存しない。ファイルbytesを`media/images`、`media/audio`、`media/video`、`media/references`へ格納し、ZIP内部パス、`mediaBlobs`、media index、generate itemを同期する。この内部取り込みはWeb版の永続化フォールバックであり、Tauri版native Dropの正常結果ではない。

## 回帰防止

- `dragDropEnabled`を`false`へ変更しない。
- native DropをHTML5 file Dropへ置き換えない。
- 内部並べ替えをHTML5 `draggable`へ戻さない。
- Rust直接転送、標準Tauriイベント、`tauri://drag-drop`、`asset-file-drop`のフォールバックを、実機検証なしに削除しない。
- テスト用mockイベントだけで正常と判断しない。Windows Explorerから実際にDropし、フルパス登録、ハイライト、保存、再起動、再読込まで確認する。
- Tauriを管理者権限で起動すると、通常権限のExplorerからWindows D&Dできない。実機確認は双方を同じ権限レベルで行う。

## 必須テスト

- Table、Storyboard、Timeline、Assetsへの画像・音声・動画Dropでフルパスが登録される。
- 同じDropが複数経路から届いても、履歴、asset、generate itemが重複しない。
- 100%、125%、150%、200% DPIで正しい対象がハイライトされ、Dropされる。
- 保存・再起動・再読込後も外部フルパスからメディアを表示できる。
- 外部ドライブ切断時もパスを保持し、Missing Mediaと再リンク対象にする。
- Web版では実ファイルがZIP内`media/...`へ入り、再読込後も表示できる。
- Pointer EventsによるTable、Storyboard、Timelineの単体・複数選択・階層移動を回帰確認する。

## 診断

`localStorage.preproDebugDnd = "1"`を設定して再読み込みすると、`[assets-dnd]`ログへ受信経路、paths、座標、scale factor、解決対象、重複抑止を出力する。RustからWebViewへの直接転送またはイベント送信に失敗した場合は、Tauriを起動したターミナルへ`[assets-dnd]`エラーを出力する。
