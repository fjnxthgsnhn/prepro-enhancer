# Tauri版D&D停止 調査レポート

Date: 2026-05-30

## 結論

Tauri版UI上で全てのD&Dが効かなくなっている最有力原因は、`src-tauri/tauri.conf.json` の `dragDropEnabled: true` です。

この設定を有効にすると、Tauri/wry側のnative drag-drop handlerが有効化されます。wryのhandlerはOS/WebViewの既定D&D処理をブロックする設計のため、外部ファイルD&Dだけでなく、HTML5 D&Dで実装されているTable / Storyboard / Timelineの内部並べ替えD&Dにも影響する可能性が高いです。

## 根拠

履歴上、同じ問題に近い修正が過去に入っています。

- `cd75c96 Fix table drag and drop in Tauri`
  - `src-tauri/tauri.conf.json` に `dragDropEnabled: false` を追加。
  - Tauri版のTable D&Dを直す目的のコミット。
- `4278f3e Add native asset drops and chaos resilience tests`
  - `dragDropEnabled: false` を `dragDropEnabled: true` に戻している。
  - native asset dropを追加するための変更だが、HTML5 D&Dへの副作用がある。

現在のUI側にはD&Dハンドラ自体は残っています。

- Table行D&D: `src/app.js` の `tr.draggable = true` と `handleDragStart` / `handleDragOver` / `handleDrop`
- Storyboard D&D: `attachStoryboardDrag`
- Timeline D&D: `.timeline-clip` の `draggable = true`
- Cutへのmedia file drop: `handleMediaDrop`
- Assets viewへのasset drop: `handleAssetDrop` / `handleTauriAssetDropEvent`

そのため、フロント実装のD&Dロジックが丸ごと消えている状態ではありません。実機Tauri/WebViewでイベントがDOMへ届く前、またはWebView既定挙動がブロックされている層が疑わしいです。

## Tauri/wry側の挙動

現在の依存は以下です。

- `tauri 2.11.2`
- `tauri-runtime-wry 2.11.2`
- `wry 0.55.1`

Tauri runtimeでは、`dragDropEnabled` が有効な場合にwryの `with_drag_drop_handler` が設定されます。wryのコメントでは、このhandlerが `true` を返すとOSの既定D&D動作をブロックします。

実際のTauri runtime側のhandlerはnative drag-drop eventをTauriイベントへ変換した後、`true` を返します。このため、Tauri native eventを拾う目的では有効ですが、WebView内の通常のHTML5 D&Dと併用すると衝突しやすい構成です。

## 現状確認

今回の調査時点で以下は成功しています。

```powershell
npm run check
npm run test:smoke
```

ただし、既存のスモークテストは主に以下の方法でD&Dを検証しています。

- DOMへ直接 `DragEvent` をdispatchする。
- Tauri drag/drop eventをmockしてJS handlerへ流す。

そのため、実際のWindows WebView2上でTauri/wryのnative drag-drop handlerがHTML5 D&Dをブロックする問題は検出できません。テスト成功は「JSロジックが壊れていない」ことの根拠にはなりますが、「実機Tauri上のD&Dが正常」という保証にはなりません。

## 問題点

現在の実装は2種類のD&Dを同じWebView上で混在させています。

- HTML5 D&D
  - Table / Storyboard / Timelineの内部並べ替え
  - Cut行・Cutカードへのmedia drop
  - Browser fallbackとしてのAssets drop
- Tauri native D&D
  - OSからdropされたファイルパスをnative eventとして受け取り、Assets viewへ反映

`dragDropEnabled: true` はnative file dropには必要ですが、HTML5 D&Dには副作用があります。特に内部並べ替えD&DはTauri native event経路では代替されていないため、`dragDropEnabled: true` によって全UI上のD&Dが止まったように見える状態になります。

## 推奨修正

短期対応としては、`src-tauri/tauri.conf.json` を `dragDropEnabled: false` に戻すのが最も安全です。

```json
{
  "dragDropEnabled": false
}
```

これにより、Table / Storyboard / TimelineなどのHTML5 D&Dを優先して復旧できます。一方で、Tauri native asset dropによる絶対パス取得は使えなくなるため、Assets登録はDOM drop、Browse、または専用import機能で補う方針になります。

native asset dropを維持したい場合は、内部並べ替えD&DをHTML5 D&DからPointer Eventsベースの独自ドラッグ実装へ移行する必要があります。この場合は修正範囲が大きくなるため、まず `dragDropEnabled: false` で全UI D&Dを復旧し、その後にasset import体験を別途設計するのが現実的です。

## 次の確認項目

修正を入れる場合は、以下を実機Tauriで確認してください。

- Table行の並べ替えができる。
- Storyboardのscene / multicut / cut並べ替えができる。
- Timeline clipの並べ替えができる。
- Cut行またはCutカードへの画像・音声dropが機能する。
- Assets viewの登録導線が仕様どおり動く。

実機確認では、Playwrightのmock D&Dだけでなく、Windows ExplorerからTauriアプリへ実際にドラッグする操作を含める必要があります。
