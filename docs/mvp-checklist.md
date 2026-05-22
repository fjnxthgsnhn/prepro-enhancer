# MVP Checklist

`docs/backlog.md` のMVP完了条件に対する実装対応表。

| 完了条件 | 実装 |
|---|---|
| `.lctproj` を開ける | `Open` から `manifest.json` / `cutlist.tsv` を含む `.lctproj` を読み込み |
| `cutlist.tsv` を読み込める | `.tsv` / `.txt` 読み込み、または `.lctproj` 内TSV読み込み |
| scene / multicut / cutをTSV上で表現できる | 標準カラムと行タイプを `src/app.js` のデータモデルで保持 |
| `scene > multicut > cut` の階層を検証できる | `validate()` で親子関係、ID重複、不正行タイプを検証 |
| Table ViewでTSVを表示できる | Main AreaのTable View |
| Hierarchy Viewで階層表示できる | Left PanelのHierarchy |
| Grouped Storyboard Viewでcutをサムネイル付き表示できる | Storyboard View |
| imageをプレビューできる | Media Preview、Storyboardカード |
| audio_fileを再生できる | Media Previewのaudio control、サンプル音声Blob |
| image_prompt / video_promptを編集できる | Detail Panel |
| cutの有効image_prompt / video_promptを表示できる | Prompt Preview |
| LLMが直接編集したTSVを再読み込みできる | `Open` からTSV再読み込み、`LLM TSV` 書き出し |
| cutをmulticutへ、multicutをsceneへグループ化できる | `Group Cuts` / `Group MC` |
| cutのdurationを編集できる | Detail Panel / Table View |
| Timeline Viewで静止画と音声を簡易再生できる | Timeline ViewのPlay、Media Preview音声再生 |
| 編集内容を`cutlist.tsv`へ保存できる | `Save TSV` |
| Premiere XMLを書き出せる | `XML` |
| Missing Mediaを検出できる | Validation Panel / Status Bar |
| 保存時にバックアップを作成できる | `.lctproj` 書き出し時 `.backups/YYYY-MM-DD_HHmm/` を同梱 |

## 実行

```powershell
npm run check
npm run dev
```

`npm run dev` 後、`http://localhost:4173/` を開く。
