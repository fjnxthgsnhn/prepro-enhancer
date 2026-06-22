const COLUMNS = [
  "row_type",
  "id",
  "parent_id",
  "order",
  "title",
  "duration",
  "status",
  "image",
  "audio_file",
  "video_file",
  "image_prompt",
  "video_prompt",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "audio",
  "note",
];

const EDITABLE_COLUMNS = new Set([
  "title",
  "duration",
  "status",
  "image",
  "audio_file",
  "video_file",
  "image_prompt",
  "video_prompt",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "audio",
  "note",
]);

const DISPLAY_COLUMNS = [
  "id",
  "title",
  "duration",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "audio",
  "image_prompt",
  "video_prompt",
  "image",
  "audio_file",
  "video_file",
  "note",
];

const LLM_TSV_COLUMNS = [
  "row_type",
  "id",
  "parent_id",
  "order",
  "title",
  "duration",
  "status",
  "image",
  "audio_file",
  "video_file",
  "image_prompt",
  "video_prompt",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "audio",
  "note",
];

const HEADER_ALIASES = {
  rowtype: "row_type",
  row_type: "row_type",
  row: "row_type",
  type: "row_type",
  parentid: "parent_id",
  parent_id: "parent_id",
  parent: "parent_id",
  dialogue: "audio",
  dialog: "audio",
  audiofile: "audio_file",
  audio_file: "audio_file",
  videofile: "video_file",
  video_file: "video_file",
  imageprompt: "image_prompt",
  image_prompt: "image_prompt",
  videoprompt: "video_prompt",
  video_prompt: "video_prompt",
};

const DEFAULT_MANIFEST = {
  format: "LocalCutBoardProject",
  formatVersion: "1.0.0",
  appVersion: "0.1.0",
  projectName: "Untitled Project",
  mainCutlist: "cutlist.tsv",
  assets: "assets.json",
  generate: "generate.json",
  prompts: "prompts.json",
  timeline: "timeline.json",
  settings: "settings.json",
  pathMode: "absolute",
  mediaRoots: {
    project: ".",
    media: "media",
    images: "media/images",
    audio: "media/audio",
    video: "media/video",
    references: "media/references",
  },
  sequence: {
    frameRate: 30,
    width: 1920,
    height: 1080,
    audioSampleRate: 48000,
  },
};

const PROJECT_AGENTS_MD = [
  "# Prepro Enhancer Project Agent Instructions",
  "",
  "You are a cutlist production agent for Prepro Enhancer.",
  "When the user provides this `.lctproj` and a script, edit `cutlist.tsv` directly and decompose the script into cuts.",
  "",
  "## Source of Truth",
  "",
  "Edit `cutlist.tsv` only. Keep this column order exactly:",
  "",
  "row_type\tid\tparent_id\torder\ttitle\tduration\tstatus\timage\taudio_file\tvideo_file\timage_prompt\tvideo_prompt\tscene\tsubject\tcomposition\taction\tcamera\taudio\tnote",
  "",
  "## Initial Build Policy",
  "",
  "The default hierarchy is `scene > cut`. `multicut` is optional and should not be created during the first pass.",
  "Use `scene > multicut > cut` only later when the user asks to group cuts.",
  "",
  "- scene: script scene unit",
  "- multicut: optional group for related cuts",
  "- cut: smallest unit of action, dialogue, viewpoint, or composition change",
  "",
  "Leave `image`, `audio_file`, `image_prompt`, and `video_prompt` empty during the first pass.",
  "",
  "## Cut Decomposition Rules",
  "",
  "Read each scene's action lines and dialogue, then divide it into cuts.",
  "Use this composition rhythm as a baseline:",
  "",
  "1. Long shot: location, situation, and character placement",
  "2. Medium shot: action, conversation, and relationships",
  "3. Close shot: expression, hands, important objects, emotion",
  "4. Repeat medium or close shots for dialogue and reactions",
  "5. Return to a long shot when the situation changes",
  "",
  "For cuts with dialogue, calculate duration from `100 Japanese characters = 17 seconds` and include natural pauses.",
  "For action-only cuts, choose a natural duration from the content.",
  "",
  "## Column Guidance",
  "",
  "- title: short cut name",
  "- duration: seconds such as `3s` or `5.5s`",
  "- scene: location or scene name",
  "- subject: main character, object, or subject",
  "- composition: long, medium, close, hands, eyes, etc.",
  "- action: action extracted from script directions",
  "- camera: fixed, pan, dolly, push in, pull out, handheld, etc.",
  "- audio: sound direction, ambience, or dialogue-related audio note",
  "- note: rationale, direction intent, or unresolved points",
  "",
  "## ID Rules",
  "",
  "- scene: `sc001`, `sc002`",
  "- multicut: `mc001`, `mc002`",
  "- cut: `ct001`, `ct002`",
  "",
  "For direct cuts, set `parent_id` to the scene id. For grouped cuts, set `parent_id` to the multicut id.",
  "Use `order` from 1 within the same parent. In a scene, direct cuts and multicuts share the same order sequence.",
  "",
  "## After First Pass",
  "",
  "After the initial `cutlist.tsv` build, ask the user whether to create multicuts and how to group them:",
  "",
  "1. Dialogue unit",
  "2. Action unit",
  "3. Location or situation change unit",
  "4. Camera-work unit",
  "",
  "Also tell the user that after confirming the cut structure, you can build `image_prompt` and `video_prompt` as the next step.",
  "",
  "## Still Image Asset and Prompt Workflow",
  "",
  "### Asset generation preparation",
  "",
  "カットリストから必要なアセットを人物、環境、小物、乗り物に分類して洗い出し、画像なしの状態で `assets.json` の assets 登録候補を作成する。",
  "シナリオやカットリストにアセットの外見、服装、色、形状、年代、質感、役割などの特徴が書かれている場合は、その内容を asset の `note` に記録する。",
  "画像生成へ進む前に、API や skill を使って画像生成するかをユーザーに確認する。",
  "画像生成する場合は、ユーザー環境で利用できる API や skill を調べ、どの手段で生成するかをユーザーに質問して決定する。",
  "API や skill で生成した画像は、作業フォルダに `assets/<project-file-name>/` を作成し、用途が分かるファイル名へリネームして保存またはコピーする。",
  "保存した画像ファイルのパスを、対応する assets 登録アイテムの `path` にフルパスで記録する。",
  "アプリ内で参照する外部ファイルはフルパス優先で管理する。`assets.json` の `assets[].path`、`generate.json` の `items[].path`、`cutlist.tsv` の `image` / `audio_file` / `video_file` にファイルパスを登録する場合は、可能な限り相対パスではなくフルパスを使う。",
  "例外として、`.lctproj` 内に同梱された `media/...` はZIP内部パスのまま扱う。",
  "複数枚を生成する場合はバッチスクリプトを作成し、バックグラウンドスクリプトとして実行する。LLM は生成完了のレスポンス待ちでブロックしない。",
  "",
  "### Still image prompt creation",
  "",
  "静止画プロンプトを作成する前に、ストーリーボードを作るのか開始フレームを作るのかをユーザーに確認する。",
  "ストーリーボードの場合は、画面内に指示文を含めるか、カラーかラフスケッチか、解像度、アスペクト比も確認する。",
  "`scene > multicut > cut` にグループされた単体 cut には `image_prompt` を書かず、グループ元の multicut に `image_prompt` を書く。",
  "プロンプトは `scene`、`subject`、`composition`、`action`、`camera`、`dialogue` などから、状況を説明するキャプションとして作成する。",
  "人物やサブジェクトの reference asset がある場合は、`assets.json` に登録されているファイルパスを使用する。",
  "画像生成エンジンが reference image 指定記法を必要とする場合は、その記法に置き換える。gpt-image-2 ではアップロード順に `image 1`, `image 2`, `image 3` のように参照する。",
  "nanobanana の場合は自然言語で直接参照できるため、reference image 指定記法への置き換えはしない。",
  "アプリ側で使用する reference image は PromptEdit の上部メディア欄、または `prompts.json` の `linkedAssetIds` で管理する。プロンプト本文には reference image のファイルパスを列挙しない。",
  "",
  "### Still image generation",
  "",
  "API や skill で静止画生成する場合は、作成済みの `image_prompt` と reference image を使用して生成する。",
  "生成 API や skill に渡す reference image は、`linkedAssetIds` から `assets.json` のフルパスを解決して使用する。",
  "複数枚を生成する場合はバッチスクリプトを作成し、バックグラウンドスクリプトとして実行する。LLM は生成完了のレスポンス待ちでブロックしない。",
  "",
  "## Final Delivery for Chat AI Editing",
  "",
  "`.lctproj` is a ZIP archive whose extension is `.lctproj`.",
  "In principle, edit `cutlist.tsv`, `prompts.json`, `generate.json`, and `assets.json` according to their roles. Do not delete or rename `manifest.json`, `timeline.json`, `settings.json`, `media_index.json`, or `AGENTS.md`.",
  "",
  "Final packaging steps:",
  "",
  "1. Extract the original `.lctproj` as a ZIP archive.",
  "2. Replace `cutlist.tsv` with the edited version.",
  "3. ZIP only the contents of the extracted folder, not the folder itself.",
  "4. Rename the resulting ZIP extension to `.lctproj`.",
  "",
  "At the ZIP root, at minimum `manifest.json` and `cutlist.tsv` must exist.",
  "Place `cutlist.tsv` at the ZIP root unless the existing `manifest.json` explicitly points to another path.",
  "",
  "PowerShell example:",
  "",
  "```powershell",
  "Compress-Archive -Path .\\ExtractedProject\\* -DestinationPath .\\EditedProject.zip -Force",
  "Rename-Item .\\EditedProject.zip EditedProject.lctproj",
  "```",
  "",
  "macOS/Linux example:",
  "",
  "```sh",
  "cd ExtractedProject",
  "zip -r ../EditedProject.lctproj .",
  "```",
  "",
  "If direct `.lctproj` attachment is unavailable, return the complete `cutlist.tsv` instead. Avoid returning the entire `.lctproj` as Base64 unless explicitly requested.",
].join("\n");

const SAMPLE_TSV = `row_type	id	parent_id	order	title	duration	status	image	audio_file	video_file	image_prompt	video_prompt	scene	subject	composition	action	camera	audio	note
scene	sc001		1	Lab Anomaly		review				wide cinematic laboratory, tense atmosphere	establishing shot of a quiet research lab	Laboratory		Long shot	Establish the lab	Slow push		Opening scene
multicut	mc001	sc001	1	Microscope Sequence		draft				microscope lens, scientist hands, shallow depth of field	push in from microscope to scientist reaction	Laboratory	Yamamoto	Close coverage	Observe specimen	Dolly in		Intro multicut
cut	ct001	mc001	1	Microscope Close	3s	draft	media/images/cut001.jpg	media/audio/cut001.wav		extreme close-up of microscope lens in a white lab	slow dolly toward microscope lens	Laboratory	Microscope	Close shot	Lens fills the frame	Slow dolly	low machine hum	Opening cut
cut	ct002	mc001	2	Yamamoto Eyes	3s	review	media/images/cut002.jpg			close-up of a scientist's eyes, tense expression	scientist narrows eyes while looking into microscope	Laboratory	Yamamoto	Eye close-up	Notices something strange	Subtle push in	breath catches	Reaction cut
multicut	mc002	sc001	2	Warning Lamp		draft				red warning lamp reflected in glass	warning lamp flashes and lab reacts	Laboratory	Warning lamp	Cutaway	Alarm begins	Fixed and pan	warning beep	
cut	ct003	mc002	1	Warning Flash	2s	draft	media/images/cut003.jpg	media/audio/cut003.wav		close-up of red warning lamp, hard shadows	red warning lamp flashes rhythmically	Laboratory	Warning lamp	Close shot	Lamp flashes	Locked shot	warning beep	`; 
const DEFAULT_UI_SETTINGS = {
  language: "en",
  theme: "dark",
  autoBackupIntervalMinutes: 10,
};
const UI_SETTINGS_KEY = "preproEnhancer.uiSettings.v1";

const I18N = {
  en: {
    "menu.file": "File", "menu.new": "NewProject", "menu.open": "OpenProject", "menu.save": "Save", "menu.saveAs": "Save as", "menu.settings": "Settings", "menu.recovery": "Recovery", "menu.createBackup": "Create Backup Now", "menu.restoreBackup": "Restore Backup", "menu.repairFileLinks": "Repair File Links", "menu.repairCurrentTsv": "Repair Current TSV", "menu.repairTsvFile": "Repair TSV File", "menu.export": "Export", "menu.llmTsv": "LLM TSV",
    "action.refreshProject": "Refresh Project", "action.refreshProjectTitle": "Refresh project",
    "view.table": "Table", "view.storyboard": "Storyboard", "view.timeline": "Timeline", "view.promptEdit": "PromptEdit", "view.assets": "Assets", "view.agents": "Agents",
    "search.label": "Search", "status.saved": "Saved", "status.unsaved": "Unsaved", "status.never": "Never", "status.noFile": "No file loaded", "status.browserWorkspace": "Browser workspace", "status.missing": "Missing", "status.savedAt": "Saved",
    "settings.title": "Settings", "settings.language": "Language", "settings.theme": "Theme", "settings.dark": "Dark", "settings.light": "Light", "settings.autoBackup": "Auto backup interval", "settings.minutes": "minutes", "settings.close": "Close", "settings.apply": "Apply",
    "toast.autoBackup": "Auto backup saved", "toast.settingsSaved": "Settings saved", "toast.updateNotAvailable": "No updates available", "toast.updateInstalled": "Update installed. Restarting...",
    "update.available": "Version {version} is available. Download and install now?", "update.failed": "Update check failed.",
    "empty.recent": "Recent projects will appear here.", "empty.tree": "Open a TSV or load the sample.", "empty.table": "No rows. Add a row to start.", "empty.search": "No rows match the current search.",
  },
  ja: {
    "menu.file": "ファイル", "menu.new": "新規プロジェクト", "menu.open": "プロジェクトを開く", "menu.save": "保存", "menu.saveAs": "別名保存", "menu.settings": "設定", "menu.recovery": "復旧", "menu.createBackup": "今すぐバックアップ", "menu.restoreBackup": "バックアップ復元", "menu.repairFileLinks": "ファイルリンクを修復", "menu.repairCurrentTsv": "現在のTSVを修復", "menu.repairTsvFile": "TSVファイルを修復", "menu.export": "書き出し", "menu.llmTsv": "LLM TSV",
    "action.refreshProject": "プロジェクト更新", "action.refreshProjectTitle": "プロジェクトを更新",
    "view.table": "テーブル", "view.storyboard": "絵コンテ", "view.timeline": "タイムライン", "view.promptEdit": "プロンプト編集", "view.assets": "素材", "view.agents": "Agents",
    "search.label": "検索", "status.saved": "保存済み", "status.unsaved": "未保存", "status.never": "未保存", "status.noFile": "ファイル未選択", "status.browserWorkspace": "ブラウザ作業領域", "status.missing": "不足", "status.savedAt": "保存",
    "settings.title": "設定", "settings.language": "言語", "settings.theme": "テーマ", "settings.dark": "ダーク", "settings.light": "ライト", "settings.autoBackup": "自動バックアップ間隔", "settings.minutes": "分", "settings.close": "閉じる", "settings.apply": "適用",
    "toast.autoBackup": "自動バックアップを保存しました", "toast.settingsSaved": "設定を保存しました", "toast.updateNotAvailable": "利用可能な更新はありません", "toast.updateInstalled": "更新をインストールしました。再起動します...",
    "update.available": "バージョン {version} を利用できます。今すぐダウンロードしてインストールしますか？", "update.failed": "更新確認に失敗しました。",
    "empty.recent": "最近使ったプロジェクトが表示されます。", "empty.tree": "TSVを開くかサンプルを読み込んでください。", "empty.table": "行がありません。行を追加してください。", "empty.search": "検索条件に一致する行がありません。",
  },
  zh: {
    "menu.file": "文件", "menu.new": "新建项目", "menu.open": "打开项目", "menu.save": "保存", "menu.saveAs": "另存为", "menu.settings": "设置", "menu.recovery": "恢复", "menu.createBackup": "立即备份", "menu.restoreBackup": "恢复备份", "menu.repairFileLinks": "修复文件链接", "menu.repairCurrentTsv": "修复当前TSV", "menu.repairTsvFile": "修复TSV文件", "menu.export": "导出", "menu.llmTsv": "LLM TSV",
    "action.refreshProject": "刷新项目", "action.refreshProjectTitle": "刷新项目",
    "view.table": "表格", "view.storyboard": "故事板", "view.timeline": "时间线", "view.promptEdit": "提示编辑", "view.assets": "素材", "view.agents": "Agents",
    "search.label": "搜索", "status.saved": "已保存", "status.unsaved": "未保存", "status.never": "从未", "status.noFile": "未加载文件", "status.browserWorkspace": "浏览器工作区", "status.missing": "缺失", "status.savedAt": "已保存",
    "settings.title": "设置", "settings.language": "语言", "settings.theme": "主题", "settings.dark": "深色", "settings.light": "浅色", "settings.autoBackup": "自动备份间隔", "settings.minutes": "分钟", "settings.close": "关闭", "settings.apply": "应用",
    "toast.autoBackup": "自动备份已保存", "toast.settingsSaved": "设置已保存", "toast.updateNotAvailable": "没有可用更新", "toast.updateInstalled": "更新已安装。正在重启...",
    "update.available": "版本 {version} 可用。现在下载并安装吗？", "update.failed": "检查更新失败。",
    "empty.recent": "最近项目会显示在这里。", "empty.tree": "打开TSV或加载示例。", "empty.table": "没有行。请先添加一行。", "empty.search": "没有匹配当前搜索的行。",
  },
  ko: {
    "menu.file": "파일", "menu.new": "새 프로젝트", "menu.open": "프로젝트 열기", "menu.save": "저장", "menu.saveAs": "다른 이름 저장", "menu.settings": "설정", "menu.recovery": "복구", "menu.createBackup": "지금 백업", "menu.restoreBackup": "백업 복원", "menu.repairFileLinks": "파일 링크 복구", "menu.repairCurrentTsv": "현재 TSV 복구", "menu.repairTsvFile": "TSV 파일 복구", "menu.export": "내보내기", "menu.llmTsv": "LLM TSV",
    "action.refreshProject": "프로젝트 새로고침", "action.refreshProjectTitle": "프로젝트 새로고침",
    "view.table": "테이블", "view.storyboard": "스토리보드", "view.timeline": "타임라인", "view.promptEdit": "프롬프트 편집", "view.assets": "에셋", "view.agents": "Agents",
    "search.label": "검색", "status.saved": "저장됨", "status.unsaved": "미저장", "status.never": "없음", "status.noFile": "파일 없음", "status.browserWorkspace": "브라우저 작업공간", "status.missing": "누락", "status.savedAt": "저장",
    "settings.title": "설정", "settings.language": "언어", "settings.theme": "테마", "settings.dark": "다크", "settings.light": "라이트", "settings.autoBackup": "자동 백업 간격", "settings.minutes": "분", "settings.close": "닫기", "settings.apply": "적용",
    "toast.autoBackup": "자동 백업 저장됨", "toast.settingsSaved": "설정 저장됨", "toast.updateNotAvailable": "사용 가능한 업데이트가 없습니다", "toast.updateInstalled": "업데이트를 설치했습니다. 다시 시작합니다...",
    "update.available": "버전 {version}을 사용할 수 있습니다. 지금 다운로드하고 설치할까요?", "update.failed": "업데이트 확인에 실패했습니다.",
    "empty.recent": "최근 프로젝트가 여기에 표시됩니다.", "empty.tree": "TSV를 열거나 샘플을 불러오세요.", "empty.table": "행이 없습니다. 행을 추가하세요.", "empty.search": "현재 검색과 일치하는 행이 없습니다.",
  },
};

const state = {
  manifest: structuredClone(DEFAULT_MANIFEST),
  rows: [],
  selectedIds: new Set(),
  activeId: "",
  selectionAnchorId: "",
  view: "table",
  search: "",
  dirty: false,
  lastSaved: "",
  projectFileName: "",
  projectPath: "",
  mediaUrls: new Map(),
  mediaBlobs: new Map(),
  mediaPathStatus: new Map(),
  mediaPathStatusRunId: 0,
  promptPreviewUrls: new Map(),
  assets: [],
  generatedMedia: [],
  prompts: [],
  agentsText: PROJECT_AGENTS_MD,
  assetSelectedIds: new Set(),
  assetSelectionAnchorId: "",
  assetModalId: "",
  assetSuggest: null,
  importWarnings: [],
  collapsed: new Set(),
  panelCollapsed: new Set(),
  rightPanelCollapsed: false,
  undo: [],
  redo: [],
  playing: false,
  raf: 0,
  playStartedAt: 0,
  playOffset: 0,
  draggingId: "",
  contextMenu: null,
  addOverlayAnchor: null,
  timelinePreviewCutId: "",
  timelineScrubbing: false,
  timelineResizing: null,
  timelineScrollLeft: 0,
  shiftDown: false,
  isWelcomeVisible: false,
  recentProjects: [],
  promptEditSessions: new Map(),
  pendingRepairTsvFile: false,
  uiSettings: loadUiSettings(),
};

const tauriInvoke = window.__TAURI__?.core?.invoke || null;
const tauriUpdater = window.__TAURI__?.updater || null;
const tauriProcess = window.__TAURI__?.process || null;
const RECENT_PROJECTS_KEY = "preproEnhancer.recentProjects.v1";
const MAX_RECENT_PROJECTS = 10;
const MAX_PROJECT_BACKUPS = 10;
let autoBackupTimer = 0;
let updateCheckStarted = false;

const el = {
  projectName: document.querySelector("#projectName"),
  projectPath: document.querySelector("#projectPath"),
  counts: document.querySelector("#counts"),
  missingCount: document.querySelector("#missingCount"),
  saveState: document.querySelector("#saveState"),
  lastSaved: document.querySelector("#lastSaved"),
  input: document.querySelector("#projectInput"),
  tree: document.querySelector("#hierarchyTree"),
  table: document.querySelector("#tableView"),
  storyboard: document.querySelector("#storyboardView"),
  timeline: document.querySelector("#timelineView"),
  promptEdit: document.querySelector("#promptEditView"),
  assetsView: document.querySelector("#assetsView"),
  agentsView: document.querySelector("#agentsView"),
  welcome: document.querySelector("#welcomeView"),
  welcomeNew: document.querySelector("#welcomeNewProjectBtn"),
  welcomeOpen: document.querySelector("#welcomeOpenProjectBtn"),
  recentProjects: document.querySelector("#recentProjectsList"),
  refreshTsv: document.querySelector("#refreshTsvBtn"),
  detail: document.querySelector("#detailPanel"),
  prompt: document.querySelector("#promptPanel"),
  media: document.querySelector("#mediaPanel"),
  validation: document.querySelector("#validationPanel"),
  search: document.querySelector("#searchInput"),
};

setupTauriAssetDrop();

decorateStaticIconButton(el.welcomeNew, "note_add");
decorateStaticIconButton(el.welcomeOpen, "folder_open");
applyUiSettings();
applyI18n();
startAutoBackupTimer();

document.querySelector("#fileMenuBtn").addEventListener("click", (event) => {
  event.stopPropagation();
  toggleFileMenu();
});
document.querySelectorAll("[data-file-action]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    closeFileMenu();
    await handleFileAction(button.dataset.fileAction);
  });
});
document.querySelectorAll("[data-toggle-panel]").forEach((button) => {
  button.addEventListener("click", () => togglePanel(button.dataset.togglePanel));
});

document.querySelector("#rightPanelToggle").addEventListener("click", toggleRightPanel);
el.welcomeNew?.addEventListener("click", newProject);
el.welcomeOpen?.addEventListener("click", openProject);
el.refreshTsv?.addEventListener("click", refreshProjectFromDisk);

document.querySelectorAll(".view-btn").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

[el.table, el.storyboard, el.timeline].forEach((pane) => {
  pane.addEventListener("click", (event) => {
    if (event.target === pane) clearSelection();
  });
});

el.input.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (state.pendingRepairTsvFile) {
    state.pendingRepairTsvFile = false;
    const decoded = decodeTsvBytes(new Uint8Array(await file.arrayBuffer()));
    await repairTsvTextIntoState(decoded.text, file.name.replace(/\.[^.]+$/, ""), "Repair TSV File");
    el.input.value = "";
    return;
  }
  if (isProjectFile(file.name, "")) {
    await loadProjectFromBytes(new Uint8Array(await file.arrayBuffer()), file.name, "");
  } else {
    await loadTsvBytes(new Uint8Array(await file.arrayBuffer()), file.name.replace(/\.[^.]+$/, ""));
  }
  el.input.value = "";
});

el.search.addEventListener("input", () => {
  state.search = el.search.value.trim().toLowerCase();
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Shift") state.shiftDown = true;
  if (event.ctrlKey && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveProject();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "o") {
    event.preventDefault();
    openProject();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "f") {
    event.preventDefault();
    el.search.focus();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "g") {
    event.preventDefault();
    if (event.shiftKey) ungroupSelectionFromShortcut();
    else groupSelectionFromShortcut();
  }
  if ((event.key === "Delete" || event.key === "Backspace") && !isTextEntryTarget(event.target)) {
    event.preventDefault();
    if (state.view === "assets") {
      deleteSelectedAssets();
      return;
    }
    deleteSelectedRows();
  }
  if (event.code === "Space" && !isTextEntryTarget(event.target)) {
    event.preventDefault();
    togglePlayback();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  }
  if (event.altKey && ["1", "2", "3", "4", "5", "6"].includes(event.key)) {
    event.preventDefault();
    setView(["table", "storyboard", "timeline", "promptEdit", "assets", "agents"][Number(event.key) - 1]);
  }
  if (event.key === "Escape") {
    closeSettingsModal();
    if (state.assetModalId) closeAssetModal();
    closeContextMenu();
    closeFileMenu();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Shift") state.shiftDown = false;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest?.(".table-context-menu")) closeContextMenu();
  if (!event.target.closest?.(".file-menu")) closeFileMenu();
  if (!event.target.closest?.(".asset-suggest")) closeAssetSuggest();
});

function startAutoBackupTimer() {
  clearInterval(autoBackupTimer);
  const minutes = clampAutoBackupMinutes(state.uiSettings.autoBackupIntervalMinutes);
  autoBackupTimer = setInterval(() => {
    createProjectBackup("auto", { notify: "toast" }).catch((error) => console.warn("Auto backup failed", error));
  }, minutes * 60 * 1000);
}

function loadUiSettings() {
  try {
    return normalizeUiSettings(JSON.parse(localStorage.getItem(UI_SETTINGS_KEY) || "{}"));
  } catch {
    return structuredClone(DEFAULT_UI_SETTINGS);
  }
}

function saveUiSettings() {
  localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(state.uiSettings));
}

function normalizeUiSettings(settings = {}) {
  return {
    language: ["en", "ja", "zh", "ko"].includes(settings.language) ? settings.language : DEFAULT_UI_SETTINGS.language,
    theme: ["dark", "light"].includes(settings.theme) ? settings.theme : DEFAULT_UI_SETTINGS.theme,
    autoBackupIntervalMinutes: clampAutoBackupMinutes(settings.autoBackupIntervalMinutes),
  };
}

function clampAutoBackupMinutes(value) {
  const minutes = Number.parseInt(value, 10);
  if (!Number.isFinite(minutes)) return DEFAULT_UI_SETTINGS.autoBackupIntervalMinutes;
  return Math.min(120, Math.max(1, minutes));
}

function t(key) {
  return I18N[state.uiSettings.language]?.[key] || I18N.en[key] || key;
}

function applyUiSettings() {
  state.uiSettings = normalizeUiSettings(state.uiSettings);
  document.documentElement.dataset.theme = state.uiSettings.theme;
  document.documentElement.lang = { en: "en", ja: "ja", zh: "zh", ko: "ko" }[state.uiSettings.language] || "en";
}

function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.setAttribute("title", t(node.dataset.i18nTitle));
  });
}

function toggleFileMenu() {
  const menu = document.querySelector("#fileMenu");
  const button = document.querySelector("#fileMenuBtn");
  const open = menu.hidden;
  menu.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

function closeFileMenu() {
  const menu = document.querySelector("#fileMenu");
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  document.querySelector("#fileMenuBtn")?.setAttribute("aria-expanded", "false");
}

function openSettingsModal() {
  closeSettingsModal();
  const modal = document.createElement("div");
  modal.className = "settings-modal-backdrop";
  modal.innerHTML = `
    <section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <header>
        <h2 id="settingsTitle">${iconHtml("settings")}<span>${escapeHtml(t("settings.title"))}</span></h2>
        <button type="button" data-settings-action="close">${iconHtml("close")}<span class="icon-button-label">${escapeHtml(t("settings.close"))}</span></button>
      </header>
      <div class="settings-fields">
        <label>${escapeHtml(t("settings.language"))}
          <select id="settingsLanguage">
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
            <option value="ko">한국어</option>
          </select>
        </label>
        <label>${escapeHtml(t("settings.theme"))}
          <select id="settingsTheme">
            <option value="dark">${escapeHtml(t("settings.dark"))}</option>
            <option value="light">${escapeHtml(t("settings.light"))}</option>
          </select>
        </label>
        <label>${escapeHtml(t("settings.autoBackup"))}
          <span class="settings-inline">
            <input id="settingsAutoBackup" type="number" min="1" max="120" step="1">
            <span>${escapeHtml(t("settings.minutes"))}</span>
          </span>
        </label>
      </div>
      <footer>
        <button type="button" data-settings-action="close">${escapeHtml(t("settings.close"))}</button>
        <button type="button" class="primary-action" data-settings-action="apply">${escapeHtml(t("settings.apply"))}</button>
      </footer>
    </section>`;
  document.body.appendChild(modal);
  modal.querySelector("#settingsLanguage").value = state.uiSettings.language;
  modal.querySelector("#settingsTheme").value = state.uiSettings.theme;
  modal.querySelector("#settingsAutoBackup").value = state.uiSettings.autoBackupIntervalMinutes;
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-settings-action='close']")) closeSettingsModal();
    if (event.target.closest("[data-settings-action='apply']")) applySettingsFromModal();
  });
  modal.querySelector("#settingsLanguage")?.focus();
}

function closeSettingsModal() {
  document.querySelector(".settings-modal-backdrop")?.remove();
}

function applySettingsFromModal() {
  const modal = document.querySelector(".settings-modal-backdrop");
  if (!modal) return;
  state.uiSettings = normalizeUiSettings({
    language: modal.querySelector("#settingsLanguage")?.value,
    theme: modal.querySelector("#settingsTheme")?.value,
    autoBackupIntervalMinutes: modal.querySelector("#settingsAutoBackup")?.value,
  });
  saveUiSettings();
  applyUiSettings();
  applyI18n();
  startAutoBackupTimer();
  render();
  showToast(t("toast.settingsSaved"));
  openSettingsModal();
}

async function handleFileAction(action) {
  if (action === "new") return newProject();
  if (action === "open") return openProject();
  if (action === "save") return saveProject();
  if (action === "saveAs") return saveProjectAs();
  if (action === "settings") return openSettingsModal();
  if (action === "createBackup") return createProjectBackup("manual");
  if (action === "restoreBackup") return restoreProjectBackup();
  if (action === "repairFileLinks") return repairFileLinks();
  if (action === "repairCurrentTsv") return repairCurrentTsv();
  if (action === "repairTsvFile") return repairTsvFile();
  if (action === "exportTsv") return exportTsv();
  if (action === "exportLlmTsv") return exportLlmTsv();
  if (action === "exportXml") return exportPremiereXml();
}

function normalizeTauriFile(file) {
  return {
    ...file,
    fileName: file?.file_name || file?.fileName || "",
    path: file?.path || "",
    bytes: file?.bytes || [],
  };
}

function fileNameFromPath(path) {
  return String(path || "").split(/[\\/]/).pop() || "";
}

function loadRecentProjects() {
  if (!tauriInvoke) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.path).map((item) => ({
          fileName: item.fileName || fileNameFromPath(item.path),
          path: item.path,
          timestamp: item.timestamp || new Date().toISOString(),
        })).slice(0, MAX_RECENT_PROJECTS)
      : [];
  } catch {
    return [];
  }
}

function saveRecentProjects() {
  if (!tauriInvoke) return;
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(state.recentProjects.slice(0, MAX_RECENT_PROJECTS)));
}

function rememberRecentProject(fileName, path) {
  if (!tauriInvoke || !path) return;
  const normalizedPath = String(path);
  const next = {
    fileName: fileName || fileNameFromPath(normalizedPath),
    path: normalizedPath,
    timestamp: new Date().toISOString(),
  };
  state.recentProjects = [
    next,
    ...state.recentProjects.filter((item) => item.path !== normalizedPath),
  ].slice(0, MAX_RECENT_PROJECTS);
  saveRecentProjects();
}

function removeRecentProject(path) {
  state.recentProjects = state.recentProjects.filter((item) => item.path !== path);
  saveRecentProjects();
}

function isProjectFile(fileName = "", path = "") {
  const text = `${fileName} ${path}`.toLowerCase();
  return text.includes(".lctproj");
}

function clearSearch() {
  state.search = "";
  if (el.search) el.search.value = "";
}

async function newProject() {
  const manifest = structuredClone(DEFAULT_MANIFEST);
  manifest.projectName = "Untitled Project";
  const rows = [];
  const defaultName = `${safeName(manifest.projectName)}.lctproj`;
  const bytes = await projectArchiveBytes({ manifest, rows, assets: [], generatedMedia: [], prompts: [], agentsText: PROJECT_AGENTS_MD, mediaBlobs: new Map(), collapsed: [], activeId: "", view: "table" });
  if (tauriInvoke) {
    const saved = await tauriInvoke("save_project_as", { defaultName, bytes: [...bytes] });
    if (!saved) return;
    const savedFile = normalizeTauriFile(saved);
    const opened = normalizeTauriFile(await tauriInvoke("read_project_file", { path: savedFile.path }));
    await loadProjectFromBytes(new Uint8Array(opened.bytes || []), opened.fileName || savedFile.fileName || defaultName, opened.path || savedFile.path || "");
  } else {
    downloadBlob(defaultName, new Blob([bytes], { type: "application/zip" }));
    await loadProjectFromBytes(bytes, defaultName, "");
  }
  state.isWelcomeVisible = false;
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

async function openProject() {
  if (!tauriInvoke) {
    el.input.click();
    return;
  }
  const opened = await tauriInvoke("open_project");
  if (!opened) return;
  const openedFile = normalizeTauriFile(opened);
  const fileName = openedFile.fileName || "";
  const path = openedFile.path || "";
  const bytes = new Uint8Array(opened.bytes || []);
  if (isProjectFile(fileName, path)) {
    await loadProjectFromBytes(bytes, fileName, path);
  } else {
    loadTsvBytes(bytes, fileName.replace(/\.[^.]+$/, ""));
    state.projectPath = path;
    state.isWelcomeVisible = false;
    render();
  }
}

async function loadTsvBytes(bytes, name) {
  const decoded = decodeTsvBytes(bytes);
  try {
    loadTsv(decoded.text, name);
  } catch (error) {
    if (confirm(`${error.message || "TSV could not be loaded."}\n\nRepair and load this TSV?`)) {
      await repairTsvTextIntoState(decoded.text, name || "Repaired TSV", "Load Repair");
    }
  }
}

function loadTsv(text, name) {
  stopPlayback(0);
  state.manifest = {
    ...structuredClone(DEFAULT_MANIFEST),
    projectName: name || "TSV Project",
  };
  state.rows = loadRowsFromTsv(text);
  state.assets = [];
  state.generatedMedia = generatedMediaFromRows(state.rows);
  state.prompts = promptsFromRows(state.rows);
  state.agentsText = PROJECT_AGENTS_MD;
  syncRowsFromJsonState();
  clearAssetSelection();
  state.mediaUrls = new Map();
  state.mediaBlobs = new Map();
  clearMediaPathStatus();
  if (text === SAMPLE_TSV) seedSampleMedia();
  state.projectFileName = name || "";
  state.projectPath = "";
  state.selectedIds.clear();
  state.activeId = state.rows[0]?.id || "";
  if (state.activeId) state.selectedIds.add(state.activeId);
  state.selectionAnchorId = state.activeId;
  clearSearch();
  state.dirty = false;
  state.undo = [];
  state.redo = [];
  render();
}

async function openRecentProject(path) {
  if (!tauriInvoke || !path) return;
  try {
    const opened = normalizeTauriFile(await tauriInvoke("read_project_file", { path }));
    await loadProjectFromBytes(new Uint8Array(opened.bytes || []), opened.fileName || fileNameFromPath(path), opened.path || path);
  } catch (error) {
    removeRecentProject(path);
    alert(error.message || "Recent project could not be opened.");
    render();
  }
}

async function loadProjectFromBytes(bytes, fileName, path = "") {
  let manifest;
  let rows;
  let entries;
  try {
    entries = await readZipEntries(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const manifestMatch = findZipEntry(entries, "manifest.json");
    const manifestEntry = manifestMatch?.entry;
    const manifestText = decodeZipText(manifestEntry);
    if (!manifestText) throw new Error("manifest.json was not found.");
    manifest = { ...structuredClone(DEFAULT_MANIFEST), ...JSON.parse(manifestText) };
    const cutlistMatch = findZipEntry(entries, manifest.mainCutlist || "cutlist.tsv");
    const cutlistEntry = cutlistMatch?.entry;
    if (!cutlistEntry) throw new Error(`${manifest.mainCutlist || "cutlist.tsv"} was not found.`);
    const decoded = decodeTsvBytes(cutlistEntry.data);
    try {
      rows = loadRowsFromTsv(decoded.text);
    } catch (error) {
      if (!confirm(`${error.message || "cutlist.tsv could not be loaded."}\n\nRepair and load this project?`)) throw error;
      const repaired = repairTsvText(decoded.text);
      rows = repaired.rows;
      state.importWarnings = repaired.warnings;
    }
  } catch (error) {
    alert(error.message || "cutlist.tsv could not be loaded.");
    return;
  }
  stopPlayback(0);
  revokeMediaUrls();
  state.manifest = manifest;
  state.rows = rows;
  state.assets = loadAssetsFromEntries(entries, manifest);
  state.generatedMedia = loadGeneratedMediaFromEntries(entries, manifest);
  state.prompts = loadPromptsFromEntries(entries, manifest);
  state.agentsText = loadAgentsFromEntries(entries);
  if (!state.generatedMedia.length) state.generatedMedia = generatedMediaFromRows(state.rows);
  if (!state.prompts.length) state.prompts = promptsFromRows(state.rows);
  syncRowsFromJsonState();
  clearAssetSelection();
  state.mediaUrls = new Map();
  state.mediaBlobs = new Map();
  clearMediaPathStatus();
  entries.forEach((entry, name) => {
    if (!name.startsWith("media/")) return;
    const blob = new Blob([entry.data], { type: mimeFromPath(name) });
    state.mediaBlobs.set(name, blob);
    state.mediaUrls.set(name, URL.createObjectURL(blob));
  });
  state.projectFileName = fileName;
  state.projectPath = path;
  if (path) rememberRecentProject(fileName, path);
  state.isWelcomeVisible = false;
  state.selectedIds.clear();
  state.activeId = state.rows[0]?.id || "";
  if (state.activeId) state.selectedIds.add(state.activeId);
  state.selectionAnchorId = state.activeId;
  clearSearch();
  state.dirty = false;
  state.undo = [];
  state.redo = [];
  render();
}

function loadAssetsFromEntries(entries, manifest) {
  const assetMatch = findZipEntry(entries, manifest.assets || "assets.json");
  const text = decodeZipText(assetMatch?.entry);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    const assets = Array.isArray(parsed.assets) ? parsed.assets : [];
    return normalizeAssets(assets).filter((asset) => asset.id || asset.path || asset.title || asset.note);
  } catch {
    return [];
  }
}

function loadGeneratedMediaFromEntries(entries, manifest) {
  const match = findZipEntry(entries, manifest.generate || "generate.json");
  const text = decodeZipText(match?.entry);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return normalizeGeneratedMedia(Array.isArray(parsed.items) ? parsed.items : []);
  } catch {
    return [];
  }
}

function loadPromptsFromEntries(entries, manifest) {
  const match = findZipEntry(entries, manifest.prompts || "prompts.json");
  const text = decodeZipText(match?.entry);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return normalizePrompts(Array.isArray(parsed.prompts) ? parsed.prompts : []);
  } catch {
    return [];
  }
}

function loadAgentsFromEntries(entries) {
  const match = findZipEntry(entries, "AGENTS.md");
  return match?.entry ? decodeZipText(match.entry) : PROJECT_AGENTS_MD;
}

function normalizeAssets(assets = []) {
  const used = new Set();
  return assets.map(normalizeAsset).map((asset) => {
    if (!asset.id || used.has(asset.id)) asset.id = nextAssetId(used);
    used.add(asset.id);
    return asset;
  });
}

function normalizeAsset(asset = {}) {
  const path = String(asset.path || "").trim();
  return {
    id: String(asset.id || nextAssetId()).trim(),
    type: "reference_image",
    path,
    title: String(asset.title || "").trim(),
    tags: Array.isArray(asset.tags) ? asset.tags.map(String) : String(asset.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    note: String(asset.note || "").trim(),
    createdAt: String(asset.createdAt || new Date().toISOString()),
  };
}

function normalizeGeneratedMedia(items = []) {
  const used = new Set();
  return items.map((item) => {
    const normalized = normalizeGeneratedMediaItem(item);
    if (!normalized.id || used.has(normalized.id)) normalized.id = nextGeneratedMediaId(used);
    used.add(normalized.id);
    return normalized;
  });
}

function normalizeGeneratedMediaItem(item = {}) {
  const type = ["image", "audio", "video"].includes(item.type) ? item.type : mediaTypeFromPath(item.path || "");
  return {
    id: String(item.id || "").trim(),
    cutId: String(item.cutId || item.cut_id || "").trim(),
    type,
    path: String(item.path || "").trim(),
    takeName: String(item.takeName || item.take_name || "").trim(),
    status: ["candidate", "ok", "ng", "hold"].includes(item.status) ? item.status : "candidate",
    isActive: Boolean(item.isActive ?? item.is_active),
    note: String(item.note || "").trim(),
    createdAt: String(item.createdAt || item.created_at || new Date().toISOString()),
    sourcePromptId: String(item.sourcePromptId || item.source_prompt_id || "").trim(),
    referenceAssetIds: Array.isArray(item.referenceAssetIds) ? item.referenceAssetIds.map(String) : [],
  };
}

function normalizePrompts(prompts = []) {
  const used = new Set();
  return prompts.map((prompt) => {
    const normalized = normalizePrompt(prompt);
    if (!normalized.id || used.has(normalized.id)) normalized.id = nextPromptId(used);
    used.add(normalized.id);
    return normalized;
  });
}

function normalizePrompt(prompt = {}) {
  return {
    id: String(prompt.id || "").trim(),
    ownerId: String(prompt.ownerId || prompt.owner_id || "").trim(),
    ownerType: ["scene", "multicut", "cut"].includes(prompt.ownerType) ? prompt.ownerType : "cut",
    kind: ["image", "video"].includes(prompt.kind) ? prompt.kind : "image",
    text: String(prompt.text || "").trim(),
    status: String(prompt.status || (prompt.isActive || prompt.is_active ? "active" : "candidate")).trim(),
    isActive: Boolean(prompt.isActive ?? prompt.is_active),
    linkedAssetIds: Array.isArray(prompt.linkedAssetIds) ? prompt.linkedAssetIds.map(String) : [],
    note: String(prompt.note || "").trim(),
    createdAt: String(prompt.createdAt || prompt.created_at || new Date().toISOString()),
    updatedAt: String(prompt.updatedAt || prompt.updated_at || new Date().toISOString()),
  };
}

function generatedMediaFromRows(rows = state.rows) {
  const items = [];
  rows.filter((row) => row.row_type === "cut").forEach((row) => {
    [
      ["image", row.image],
      ["audio", row.audio_file],
      ["video", row.video_file],
    ].forEach(([type, path]) => {
      if (!path) return;
      items.push(normalizeGeneratedMediaItem({
        id: nextGeneratedMediaId(),
        cutId: row.id,
        type,
        path,
        status: "candidate",
        isActive: true,
      }));
    });
  });
  return normalizeGeneratedMedia(items);
}

function promptsFromRows(rows = state.rows) {
  const prompts = [];
  rows.forEach((row) => {
    [
      ["image", row.image_prompt],
      ["video", row.video_prompt],
    ].forEach(([kind, text]) => {
      if (!text) return;
      prompts.push(normalizePrompt({
        id: nextPromptId(),
        ownerId: row.id,
        ownerType: row.row_type,
        kind,
        text,
        status: "active",
        isActive: true,
      }));
    });
  });
  return normalizePrompts(prompts);
}

function syncRowsFromJsonState(rows = state.rows) {
  rows.forEach((row) => {
    row.image = activeGeneratedPath(row.id, "image");
    row.audio_file = activeGeneratedPath(row.id, "audio");
    row.video_file = activeGeneratedPath(row.id, "video");
    row.image_prompt = activePromptText(row.id, "image");
    row.video_prompt = activePromptText(row.id, "video");
  });
}

function rowWithJsonValues(row) {
  return {
    ...row,
    image: activeGeneratedPath(row.id, "image") || row.image || "",
    audio_file: activeGeneratedPath(row.id, "audio") || row.audio_file || "",
    video_file: activeGeneratedPath(row.id, "video") || row.video_file || "",
    image_prompt: activePromptText(row.id, "image") || row.image_prompt || "",
    video_prompt: activePromptText(row.id, "video") || row.video_prompt || "",
  };
}

function activeGeneratedPath(cutId, type) {
  return state.generatedMedia.find((item) => item.cutId === cutId && item.type === type && item.isActive)?.path || "";
}

function activePromptText(ownerId, kind) {
  return activePromptEntry(ownerId, kind)?.text || "";
}

function activePromptEntry(ownerId, kind) {
  return state.prompts.find((prompt) => prompt.ownerId === ownerId && prompt.kind === kind && prompt.isActive) || null;
}

function ensureActivePrompt(ownerId, ownerType, kind) {
  if (!ownerId || !kind) return null;
  let prompt = activePromptEntry(ownerId, kind);
  if (!prompt) {
    prompt = normalizePrompt({ id: nextPromptId(), ownerId, ownerType, kind, status: "active", isActive: true });
    state.prompts.push(prompt);
  }
  state.prompts.forEach((entry) => {
    if (entry.ownerId === ownerId && entry.kind === kind && entry !== prompt) entry.isActive = false;
  });
  prompt.status = "active";
  prompt.isActive = true;
  prompt.updatedAt = new Date().toISOString();
  return prompt;
}

function setActiveGeneratedMedia(cutId, type, path) {
  if (!cutId || !type) return;
  state.generatedMedia.forEach((item) => {
    if (item.cutId === cutId && item.type === type) item.isActive = false;
  });
  if (!path) return;
  let item = state.generatedMedia.find((entry) => entry.cutId === cutId && entry.type === type && entry.path === path);
  if (!item) {
    item = normalizeGeneratedMediaItem({ id: nextGeneratedMediaId(), cutId, type, path, status: "candidate", isActive: true });
    state.generatedMedia.push(item);
  }
  item.isActive = true;
}

function setActivePrompt(ownerId, ownerType, kind, text) {
  if (!ownerId || !kind) return;
  const current = activePromptEntry(ownerId, kind);
  const linkedAssetIds = current?.linkedAssetIds?.length ? [...current.linkedAssetIds] : [];
  state.prompts.forEach((prompt) => {
    if (prompt.ownerId === ownerId && prompt.kind === kind) prompt.isActive = false;
  });
  if (!text && !linkedAssetIds.length) return;
  let prompt = current || state.prompts.find((entry) => entry.ownerId === ownerId && entry.kind === kind && entry.text === text);
  if (!prompt) {
    prompt = normalizePrompt({ id: nextPromptId(), ownerId, ownerType, kind, text, status: "active", isActive: true, linkedAssetIds });
    state.prompts.push(prompt);
  }
  prompt.text = text;
  if (!prompt.linkedAssetIds?.length && linkedAssetIds.length) prompt.linkedAssetIds = linkedAssetIds;
  prompt.status = "active";
  prompt.isActive = true;
  prompt.updatedAt = new Date().toISOString();
}

function assetIdFromParts(alias, path, title) {
  const source = `${alias || "asset"}:${path || ""}:${title || ""}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `asset-${Math.abs(hash).toString(36)}`;
}

async function refreshProjectFromDisk() {
  if (!tauriInvoke || !state.projectPath) {
    alert("Open a saved .lctproj project to refresh the project.");
    return;
  }
  if (state.dirty && !confirm("Discard unsaved changes and refresh the project from disk?")) return;
  await createProjectBackup("before-refresh", { silent: true });
  let diskManifest;
  let rows;
  let assets;
  let generatedMedia;
  let prompts;
  let agentsText;
  try {
    const opened = normalizeTauriFile(await tauriInvoke("read_project_file", { path: state.projectPath }));
    const bytes = new Uint8Array(opened.bytes || []);
    const entries = await readZipEntries(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const manifestMatch = findZipEntry(entries, "manifest.json");
    const manifestText = decodeZipText(manifestMatch?.entry);
    if (!manifestText) throw new Error("manifest.json was not found.");
    diskManifest = { ...structuredClone(DEFAULT_MANIFEST), ...JSON.parse(manifestText) };
    const cutlistMatch = findZipEntry(entries, diskManifest.mainCutlist || "cutlist.tsv");
    const cutlistEntry = cutlistMatch?.entry;
    if (!cutlistEntry) throw new Error(`${diskManifest.mainCutlist || "cutlist.tsv"} was not found.`);
    const tsvText = decodeTsvBytes(cutlistEntry.data).text;
    try {
      rows = loadRowsFromTsv(tsvText);
    } catch (error) {
      if (!confirm(`${error.message || "cutlist.tsv could not be refreshed."}\n\nRepair and refresh the project from disk?`)) throw error;
      const repaired = repairTsvText(tsvText);
      rows = repaired.rows;
      state.importWarnings = repaired.warnings;
    }
    assets = loadAssetsFromEntries(entries, diskManifest);
    generatedMedia = loadGeneratedMediaFromEntries(entries, diskManifest);
    prompts = loadPromptsFromEntries(entries, diskManifest);
    agentsText = loadAgentsFromEntries(entries);
    if (!generatedMedia.length) generatedMedia = generatedMediaFromRows(rows);
    if (!prompts.length) prompts = promptsFromRows(rows);
  } catch (error) {
    alert(error.message || "Project could not be refreshed.");
    return;
  }
  pushHistory();
  state.manifest = diskManifest;
  state.rows = rows;
  state.assets = assets;
  state.generatedMedia = generatedMedia;
  state.prompts = prompts;
  state.agentsText = agentsText;
  syncRowsFromJsonState();
  clearAssetSelection();
  preserveSelectionAfterRowsRefresh();
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  renderAfterRowsRefresh();
}

function preserveSelectionAfterRowsRefresh() {
  const rowIds = new Set(state.rows.map((row) => row.id));
  const selected = [...state.selectedIds].filter((id) => rowIds.has(id));
  state.selectedIds = new Set(selected);
  if (!rowIds.has(state.activeId)) state.activeId = selected[0] || state.rows[0]?.id || "";
  if (state.activeId) state.selectedIds.add(state.activeId);
  if (!rowIds.has(state.selectionAnchorId)) state.selectionAnchorId = state.activeId;
}

function renderAfterRowsRefresh() {
  const issues = validate();
  renderWelcome();
  renderStatus(issues);
  renderTree();
  renderCurrentView();
  renderDetail();
  renderPrompt();
  renderMedia();
  renderValidation(issues);
  renderPanels();
}

function renderCurrentView() {
  if (state.view === "storyboard") {
    renderStoryboard();
    return;
  }
  if (state.view === "timeline") {
    renderTimeline();
    return;
  }
  if (state.view === "promptEdit") {
    renderPromptEdit();
    return;
  }
  if (state.view === "assets") {
    renderAssets();
    return;
  }
  if (state.view === "agents") {
    renderAgents();
    return;
  }
  renderTable();
}

function findZipEntry(entries, path) {
  const target = normalizeZipPath(path);
  const candidates = [...entries.entries()].filter(([name]) => isProjectZipEntry(name));
  const exact = candidates.find(([name]) => name === target);
  if (exact) return { name: exact[0], entry: exact[1] };
  const wrapped = candidates.find(([name]) => stripZipRoot(name) === target);
  if (wrapped) return { name: wrapped[0], entry: wrapped[1] };
  const suffix = candidates.find(([name]) => name.endsWith(`/${target}`));
  if (suffix) return { name: suffix[0], entry: suffix[1] };
  return null;
}

function isProjectZipEntry(path) {
  return !path.split("/").some((part) => part === "__MACOSX" || part.startsWith(".") || part === ".backups");
}

function stripZipRoot(path) {
  const parts = path.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : path;
}

function normalizeZipPath(path) {
  const parts = String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part && part !== ".");
  if (parts.includes("..")) throw new Error(`Unsafe ZIP path: ${path}`);
  return parts.join("/");
}

function loadRowsFromTsv(text) {
  const parsed = parseTsv(text);
  const { rows, warnings } = normalizeImportedRows(parsed.rows);
  state.importWarnings = warnings;
  return rows;
}

function repairTsvText(text) {
  const warnings = [];
  let records;
  try {
    records = parseDelimitedText(String(text || "").replace(/^\uFEFF/, ""), "\t");
  } catch (error) {
    warnings.push(`Strict TSV parse failed: ${error.message || error}. Falling back to line repair.`);
    records = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.split("\t"));
  }
  records = records.filter((record) => record.some((cell) => String(cell || "").trim()));
  if (!records.length) {
    return { rows: [], warnings: ["Empty TSV was repaired to an empty project."] };
  }

  const firstHeaders = records[0].map(normalizeTsvHeader);
  const hasHeader = firstHeaders.includes("row_type") || firstHeaders.includes("id") || firstHeaders.some((header) => COLUMNS.includes(header));
  const headers = hasHeader ? firstHeaders : COLUMNS;
  const dataRecords = hasHeader ? records.slice(1) : records;
  if (!hasHeader) warnings.push("Missing header row: standard Prepro columns were assumed.");
  COLUMNS.forEach((column) => {
    if (!headers.includes(column)) warnings.push(`Missing column ${column}: empty values were added.`);
  });

  const usedIds = new Set();
  const repairedRows = dataRecords.map((values, index) => {
    const row = emptyRow("cut");
    COLUMNS.forEach((column, columnIndex) => {
      const headerIndex = headers.includes(column) ? headers.indexOf(column) : columnIndex;
      row[column] = decodeCell(values[headerIndex] || "");
    });
    row.row_type = normalizeRowType(row.row_type);
    if (!["scene", "multicut", "cut"].includes(row.row_type)) {
      warnings.push(`Line ${index + 2}: invalid row_type was changed to cut.`);
      row.row_type = "cut";
    }
    const prefix = { scene: "sc", multicut: "mc", cut: "ct" }[row.row_type] || "row";
    const preferred = String(row.id || `${prefix}_recovered_${index + 1}`).trim();
    row.id = uniqueRepairId(preferred, usedIds);
    if (row.id !== preferred) warnings.push(`Line ${index + 2}: duplicate id ${preferred} was changed to ${row.id}.`);
    row.parent_id = String(row.parent_id || "").trim();
    row.order = String(row.order || index + 1).trim();
    if (values.length !== headers.length) warnings.push(`Line ${index + 2}: column count was repaired (${values.length} -> ${headers.length}).`);
    return row;
  });

  const normalized = normalizeImportedRows(repairedRows);
  return { rows: normalized.rows, warnings: [...warnings, ...normalized.warnings] };
}

function uniqueRepairId(preferred, usedIds) {
  if (!usedIds.has(preferred)) {
    usedIds.add(preferred);
    return preferred;
  }
  let index = 1;
  while (usedIds.has(`${preferred}_${index}`)) index += 1;
  const id = `${preferred}_${index}`;
  usedIds.add(id);
  return id;
}

function parseTsv(text) {
  const records = parseDelimitedText(text.replace(/^\uFEFF/, ""), "\t").filter((record) => record.some((cell) => String(cell).trim()));
  if (!records.length) return { headers: [], rowCount: 0, rows: [] };
  const headers = records[0].map(normalizeTsvHeader);
  for (const column of ["row_type", "id"]) {
    if (!headers.includes(column)) throw new Error(`cutlist.tsv is missing required column ${column}.`);
  }
  const rows = records.slice(1).map((rawValues, index) => {
    const values = normalizeTsvValuesForHeaders(headers, rawValues);
    const row = {};
    COLUMNS.forEach((column) => {
      const headerIndex = headerIndexForColumn(headers, column);
      row[column] = headerIndex >= 0 ? decodeCell(values[headerIndex] || "") : "";
    });
    row.row_type = normalizeRowType(row.row_type || "cut");
    row.id = String(row.id || nextId(row.row_type)).trim();
    row.parent_id = String(row.parent_id || "").trim();
    row.order = String(row.order || index + 1).trim();
    return row;
  });
  return { headers, rowCount: records.length - 1, rows };
}

function normalizeTsvValuesForHeaders(headers, values) {
  if (headers.join("\t") === COLUMNS.join("\t") && values.length === 17) {
    const [row_type, id, parent_id, order, title, duration, scene, subject, composition, action, camera, audio, image, audio_file, image_prompt, video_prompt, note] = values;
    return [row_type, id, parent_id, order, title, duration, "", image, audio_file, "", image_prompt, video_prompt, scene, subject, composition, action, camera, audio, note];
  }
  return values;
}

function normalizeTsvHeader(header) {
  const normalized = String(header || "")
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return HEADER_ALIASES[normalized] || normalized;
}

function headerIndexForColumn(headers, column) {
  const index = headers.indexOf(column);
  if (index >= 0) return index;
  return -1;
}

function normalizeRowType(value) {
  const type = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (type === "scene" || type === "scense") return "scene";
  if (type === "multicut" || type === "multi_cut" || type === "mc") return "multicut";
  if (type === "cut" || type === "ct") return "cut";
  return type || "cut";
}

function normalizeImportedRows(rows) {
  const normalized = rows.map((row) => ({ ...row }));
  const warnings = [];
  const ids = new Set(normalized.map((row) => row.id).filter(Boolean));
  const get = (id) => normalized.find((row) => row.id === id);
  let importedScene = null;

  const uniqueId = (prefix, preferred) => {
    if (!ids.has(preferred)) {
      ids.add(preferred);
      return preferred;
    }
    let index = 1;
    while (ids.has(`${preferred}_${index}`)) index += 1;
    const id = `${preferred}_${index}`;
    ids.add(id);
    return id;
  };

  const ensureImportedScene = () => {
    if (importedScene) return importedScene;
    importedScene = {
      ...emptyRow("scene"),
      id: uniqueId("sc", "sc_imported"),
      title: "Imported Scene",
      order: String(nextOrder(normalized.filter((row) => row.row_type === "scene"))),
    };
    normalized.push(importedScene);
    warnings.push("Imported Scene was created for rows with missing or invalid scene parents.");
    return importedScene;
  };

  normalized.forEach((row) => {
    row.row_type = normalizeRowType(row.row_type);
    row.id = String(row.id || uniqueId("row", "row_imported")).trim();
    row.parent_id = String(row.parent_id || "").trim();
    row.order = String(row.order || "1").trim();
    if (row.row_type === "scene" && row.parent_id) {
      row.parent_id = "";
      warnings.push(`${row.id}: scene parent_id was cleared.`);
    }
  });

  normalized.forEach((row) => {
    if (row.row_type !== "multicut") return;
    const parent = get(row.parent_id);
    if (!parent || parent.row_type !== "scene") {
      row.parent_id = ensureImportedScene().id;
      warnings.push(`${row.id}: multicut was moved under Imported Scene.`);
    }
  });

  normalized.forEach((row) => {
    if (row.row_type !== "cut") return;
    const parent = get(row.parent_id);
    if (!parent || !["scene", "multicut"].includes(parent.row_type)) {
      row.parent_id = ensureImportedScene().id;
      warnings.push(`${row.id}: cut was moved under Imported Scene.`);
    }
  });

  normalizeRowOrders(normalized);
  return { rows: normalized, warnings };
}

function emptyRow(type) {
  return Object.fromEntries(COLUMNS.map((column) => [column, column === "row_type" ? type : ""]));
}

function normalizeRowOrders(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = orderGroupKey(row, rows);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  groups.forEach((items) => items.sort(sortByOrder).forEach((row, index) => (row.order = String(index + 1))));
}

function orderGroupKey(row, rows = state.rows) {
  if (row.row_type === "scene") return "scene:root";
  const parent = rows.find((item) => item.id === row.parent_id);
  if ((row.row_type === "multicut" && parent?.row_type === "scene") || (row.row_type === "cut" && parent?.row_type === "scene")) {
    return `scene-children:${parent.id}`;
  }
  if (row.row_type === "cut" && parent?.row_type === "multicut") return `multicut-cuts:${parent.id}`;
  return `${row.row_type}:${row.parent_id || "root"}`;
}

function parseDelimitedText(text, delimiter = "\t") {
  const records = [];
  let record = [];
  let cell = "";
  let inQuote = false;
  let quoteClosed = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuote) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuote = false;
        quoteClosed = true;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"' && cell === "" && !quoteClosed) {
      inQuote = true;
    } else if (char === delimiter) {
      record.push(cell);
      cell = "";
      quoteClosed = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      record.push(cell);
      records.push(record);
      record = [];
      cell = "";
      quoteClosed = false;
    } else {
      if (quoteClosed && char.trim()) throw new Error(`Invalid TSV quote near character ${index}.`);
      if (quoteClosed && !char.trim()) continue;
      cell += char;
    }
  }
  if (inQuote) throw new Error("Invalid TSV: unterminated quoted field.");
  if (cell || record.length) {
    record.push(cell);
    records.push(record);
  }
  return records;
}

function splitTsvLine(line) {
  return parseDelimitedText(line, "\t")[0] || [];
}

function encodeCell(value) {
  return String(value ?? "").replace(/\r?\n/g, "\\n").replace(/\t/g, " ");
}

function decodeCell(value) {
  return String(value ?? "").replace(/\\n/g, "\n");
}

function serializeTsv(rows = state.rows) {
  syncRowsFromJsonState(rows);
  return [COLUMNS.join("\t"), ...rows.map((row) => {
    const exported = rowWithJsonValues(row);
    return COLUMNS.map((column) => encodeCell(exported[column])).join("\t");
  })].join("\n");
}

function emptyProjectTsv() {
  return COLUMNS.join("\t");
}

function serializeLlmTsv(rows = state.rows) {
  syncRowsFromJsonState(rows);
  return [LLM_TSV_COLUMNS.join("\t"), ...rows.map((row) => {
    const exported = rowWithJsonValues(row);
    return LLM_TSV_COLUMNS.map((column) => encodeCell(exported[column])).join("\t");
  })].join("\n");
}

function buildTree() {
  const scenes = state.rows.filter((row) => row.row_type === "scene").sort(sortByOrder);
  const multicuts = state.rows.filter((row) => row.row_type === "multicut").sort(sortByOrder);
  const cuts = state.rows.filter((row) => row.row_type === "cut").sort(sortByOrder);
  return scenes.map((scene) => {
    const children = [
      ...multicuts
        .filter((multicut) => multicut.parent_id === scene.id)
        .map((multicut) => ({
          type: "multicut",
          row: multicut,
          cuts: cuts.filter((cut) => cut.parent_id === multicut.id).sort(sortByOrder),
        })),
      ...cuts
        .filter((cut) => cut.parent_id === scene.id)
        .map((cut) => ({
          type: "cut",
          row: cut,
          cuts: [],
        })),
    ].sort((a, b) => sortByOrder(a.row, b.row));
    return {
      row: scene,
      children,
      multicuts: children.filter((child) => child.type === "multicut"),
      directCuts: children.filter((child) => child.type === "cut").map((child) => child.row),
    };
  });
}

function sortByOrder(a, b) {
  return Number(a.order || 0) - Number(b.order || 0) || a.id.localeCompare(b.id);
}

function filteredRows() {
  const ordered = hierarchyRows();
  if (!state.search) return ordered;
  return ordered.filter((row) => COLUMNS.some((column) => String(row[column] || "").toLowerCase().includes(state.search)));
}

function hierarchyRows() {
  return buildTree().flatMap((scene) => [
    scene.row,
    ...scene.children.flatMap((child) => (child.type === "multicut" ? [child.row, ...child.cuts] : [child.row])),
  ]);
}

function rowLabel(row) {
  return row?.title || row?.id || "";
}

function iconHtml(name, className = "") {
  return `<span class="material-symbols-outlined app-icon${className ? ` ${className}` : ""}" aria-hidden="true">${escapeHtml(name)}</span>`;
}

function rowTypeIcon(type) {
  return { scene: "movie", multicut: "dynamic_feed", cut: "content_cut" }[type] || "movie";
}

function cutPlacementClass(row) {
  if (row?.row_type !== "cut") return "";
  return getRow(row.parent_id)?.row_type === "multicut" ? "nested-cut" : "direct-cut";
}

function decorateStaticIconButton(button, icon) {
  if (!button || button.querySelector(".app-icon")) return;
  const label = button.textContent;
  button.innerHTML = `${iconHtml(icon)}<span class="icon-button-label"></span>`;
  button.querySelector(".icon-button-label").textContent = label;
}

function setIconText(element, icon, text) {
  if (!element) return;
  element.innerHTML = `${iconHtml(icon)}<span class="icon-button-label">${escapeHtml(text)}</span>`;
}

function setStatusItem(element, icon, text) {
  if (!element) return;
  element.innerHTML = `${iconHtml(icon)}<span class="status-value">${escapeHtml(text)}</span>`;
}

function render() {
  const issues = validate();
  scheduleMediaPathStatusChecks();
  renderWelcome();
  renderStatus(issues);
  renderTree();
  renderTable();
  renderStoryboard();
  renderTimeline();
  renderPromptEdit();
  renderAssets();
  renderAgents();
  renderDetail();
  renderPrompt();
  renderMedia();
  renderValidation(issues);
  renderPanels();
}

function renderWelcome() {
  if (!el.welcome) return;
  el.welcome.hidden = !state.isWelcomeVisible;
  document.querySelector(".app-shell")?.classList.toggle("welcome-active", state.isWelcomeVisible);
  if (!el.recentProjects) return;
  if (!state.recentProjects.length) {
    el.recentProjects.innerHTML = `<div class="recent-empty">${escapeHtml(t("empty.recent"))}</div>`;
    return;
  }
  el.recentProjects.innerHTML = state.recentProjects.map((project) => `
    <button class="recent-project-row" type="button" data-path="${escapeAttr(project.path)}">
      ${iconHtml("folder_open", "recent-icon")}
      <span class="recent-file">${escapeHtml(project.fileName || "Untitled Project.lctproj")}</span>
      <span class="recent-path">${escapeHtml(project.path)}</span>
      <span class="recent-time">${escapeHtml(formatRecentTimestamp(project.timestamp))}</span>
    </button>
  `).join("");
  el.recentProjects.querySelectorAll(".recent-project-row").forEach((button) => {
    button.addEventListener("click", () => openRecentProject(button.dataset.path || ""));
  });
}

function renderStatus(issues) {
  scheduleMediaPathStatusChecks();
  const counts = countRows();
  el.projectName.textContent = state.manifest.projectName || "Untitled Project";
  setStatusItem(el.projectPath, "folder", state.projectPath || state.projectFileName || (tauriInvoke ? t("status.noFile") : t("status.browserWorkspace")));
  setStatusItem(el.counts, "tag", `scene ${counts.scene} / multicut ${counts.multicut} / cut ${counts.cut}`);
  setStatusItem(el.missingCount, "image_not_supported", `${t("status.missing")} ${issues.filter((issue) => issue.kind === "missing-media").length}`);
  setStatusItem(el.saveState, "cloud_done", state.dirty ? t("status.unsaved") : t("status.saved"));
  setStatusItem(el.lastSaved, "schedule", state.lastSaved ? `${t("status.savedAt")} ${state.lastSaved}` : t("status.never"));
}

function countRows() {
  return state.rows.reduce(
    (acc, row) => {
      acc[row.row_type] = (acc[row.row_type] || 0) + 1;
      return acc;
    },
    { scene: 0, multicut: 0, cut: 0 },
  );
}

function renderTree() {
  const tree = buildTree();
  el.tree.innerHTML = "";
  if (!tree.length) {
    el.tree.innerHTML = `<div class="empty-state">${escapeHtml(t("empty.tree"))}</div>`;
    return;
  }
  tree.forEach((scene) => {
    el.tree.appendChild(treeNode(scene.row, 0));
    if (!state.collapsed.has(scene.row.id)) {
      scene.children.forEach((child) => {
        if (child.type === "cut") {
          el.tree.appendChild(treeNode(child.row, 1));
          return;
        }
        el.tree.appendChild(treeNode(child.row, 1));
        if (!state.collapsed.has(child.row.id)) {
          child.cuts.forEach((cut) => el.tree.appendChild(treeNode(cut, 2)));
        }
      });
    }
  });
}

function treeNode(row, level) {
  const node = document.createElement("div");
  node.className = `tree-node level-${level}${state.activeId === row.id ? " selected" : ""}`;
  node.innerHTML = `<span class="badge">${iconHtml(rowTypeIcon(row.row_type), "badge-icon")}<span>${row.row_type}</span></span><span>${escapeHtml(rowLabel(row))}</span>`;
  node.addEventListener("click", (event) => {
    if (event.altKey && row.row_type !== "cut") {
      toggleCollapse(row.id);
      return;
    }
    selectRow(row.id, event);
  });
  node.addEventListener("dblclick", () => row.row_type !== "cut" && toggleCollapse(row.id));
  return node;
}

function renderTable() {
  const rows = filteredRows();
  closeContextMenu();
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `<thead><tr>${DISPLAY_COLUMNS.map((column) => `<th>${column}</th>`).join("")}</tr></thead>`;
  const tbody = document.createElement("tbody");
  if (!rows.length) {
    const canInitialAdd = !state.search && state.rows.length === 0;
    const tr = document.createElement("tr");
    tr.className = "empty-table-row";
    const td = document.createElement("td");
    td.colSpan = DISPLAY_COLUMNS.length;
    td.innerHTML = `
      <div class="empty-table-state">
        <span>${escapeHtml(state.search ? t("empty.search") : t("empty.table"))}</span>
        ${canInitialAdd ? `<div class="empty-add-actions">
          <button class="add-row-btn scene" type="button" data-initial-add-type="scene" title="Add Scene" aria-label="Add Scene">${iconHtml("movie", "small-icon")}</button>
          <button class="add-row-btn multicut" type="button" data-initial-add-type="multicut" title="Add Multicut" aria-label="Add Multicut">${iconHtml("dynamic_feed", "small-icon")}</button>
          <button class="add-row-btn cut" type="button" data-initial-add-type="cut" title="Add Cut" aria-label="Add Cut">${iconHtml("content_cut", "small-icon")}</button>
        </div>` : ""}
      </div>`;
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    rows.forEach((row) => {
    const tr = document.createElement("tr");
    const visualSelected = tableVisualSelectedIds();
    tr.className = [row.row_type, cutPlacementClass(row), visualSelected.has(row.id) ? "selected" : "", tableSelectionClass(row)].filter(Boolean).join(" ");
    tr.draggable = true;
    tr.dataset.id = row.id;
    tr.dataset.type = row.row_type;
    tr.addEventListener("click", (event) => selectRow(row.id, event));
    tr.addEventListener("dragstart", (event) => handleDragStart(event, row));
    tr.addEventListener("dragover", (event) => handleDragOver(event, row));
    tr.addEventListener("dragleave", clearDropClasses);
    tr.addEventListener("drop", (event) => handleDrop(event, row));
    tr.addEventListener("dragend", clearDragState);
    tr.addEventListener("contextmenu", (event) => showRowContextMenu(event, row));
    DISPLAY_COLUMNS.forEach((column) => {
      const td = document.createElement("td");
      td.dataset.column = column;
      td.textContent = column === "duration" ? displayDuration(row) : String(row[column] || "");
      if (EDITABLE_COLUMNS.has(column) && !(column === "duration" && row.row_type !== "cut")) {
        td.classList.add("editable");
        td.addEventListener("click", (event) => {
          event.stopPropagation();
          const wasSelected = state.selectedIds.has(row.id);
          if (event.ctrlKey || event.metaKey || event.shiftKey || !wasSelected) {
            selectRow(row.id, event);
            return;
          }
          editCell(td, row.id, column);
        });
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  }
  table.appendChild(tbody);
  el.table.replaceChildren(table);
  el.table.querySelectorAll("[data-initial-add-type]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      addInitialRow(button.dataset.initialAddType);
    });
  });
  renderAddOverlay();
}

function renderAddOverlay() {
  const activeRow = el.table.querySelector(`tr[data-id="${CSS.escape(state.activeId)}"]`);
  if (!activeRow) return;
  const overlay = document.createElement("div");
  overlay.className = "add-row-overlay";
  overlay.innerHTML = `
    <div class="add-row-actions" aria-label="Add row below selection">
      <button class="add-row-btn scene" type="button" data-add-type="scene" title="Add Scene" aria-label="Add Scene">${iconHtml("movie", "small-icon")}</button>
      <button class="add-row-btn multicut" type="button" data-add-type="multicut" title="Add Multicut" aria-label="Add Multicut">${iconHtml("dynamic_feed", "small-icon")}</button>
      <button class="add-row-btn cut" type="button" data-add-type="cut" title="Add Cut" aria-label="Add Cut">${iconHtml("content_cut", "small-icon")}</button>
    </div>`;
  const tableRect = el.table.getBoundingClientRect();
  const rowRect = activeRow.getBoundingClientRect();
  const overlayWidth = 124;
  const overlayHeight = 42;
  const margin = 10;
  const anchorX = state.addOverlayAnchor?.x ?? tableRect.left + margin + 12;
  const minX = tableRect.left + margin;
  const maxX = tableRect.right - overlayWidth - margin;
  const viewportLeft = clamp(anchorX - 12, minX, Math.max(minX, maxX));
  const belowTop = rowRect.bottom - tableRect.top + el.table.scrollTop + 10;
  const aboveTop = rowRect.top - tableRect.top + el.table.scrollTop - overlayHeight + 8;
  const viewportBelow = rowRect.bottom + overlayHeight <= tableRect.bottom - margin;
  const top = viewportBelow ? belowTop : Math.max(el.table.scrollTop + margin, aboveTop);
  overlay.style.top = `${top}px`;
  overlay.style.left = `${viewportLeft - tableRect.left + el.table.scrollLeft}px`;
  overlay.addEventListener("click", (event) => event.stopPropagation());
  overlay.querySelectorAll("[data-add-type]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      addRowBelow(button.dataset.addType);
    });
  });
  el.table.appendChild(overlay);
}

function rememberAddOverlayAnchor(event) {
  if (event?.clientX == null || !event.target?.closest?.("#tableView")) return;
  state.addOverlayAnchor = { x: event.clientX, y: event.clientY };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function editCell(td, id, column) {
  const row = getRow(id);
  if (!row || td.querySelector("input")) return;
  const input = document.createElement("input");
  const original = row[column] || "";
  input.value = String(original).replace(/\r?\n/g, " ");
  td.replaceChildren(input);
  input.focus();
  input.select();
  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    if (commit && input.value !== original) updateRow(id, { [column]: input.value });
    else render();
  };
  input.addEventListener("keydown", (event) => {
    if (handleAssetSuggestKeydown(event)) return;
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  attachAssetAutocomplete(input);
  input.addEventListener("blur", () => finish(true));
}

function renderStoryboard() {
  const tree = buildTree();
  const root = document.createElement("div");
  root.className = "storyboard";
  root.addEventListener("click", (event) => {
    if (event.target === root) clearSelection();
  });
  tree.forEach((scene) => {
    const sceneEl = document.createElement("section");
    sceneEl.className = `scene-section${state.selectedIds.has(scene.row.id) ? " selected" : ""}`;
    attachStoryboardDrag(sceneEl, scene.row);
    sceneEl.innerHTML = `<div class="scene-header"><h2>${iconHtml("movie")}<span>${escapeHtml(scene.row.title || scene.row.id)}</span></h2><span>${scene.directCuts.length} direct cuts / ${scene.multicuts.length} multicuts / ${displayDuration(scene.row)}</span></div>`;
    sceneEl.querySelector(".scene-header").addEventListener("click", (event) => {
      event.stopPropagation();
      selectRow(scene.row.id, event);
    });
    sceneEl.querySelector(".scene-header").addEventListener("contextmenu", (event) => showRowContextMenu(event, scene.row));
    let directGrid = null;
    const appendDirectCut = (cut) => {
      if (!directGrid) {
        directGrid = document.createElement("div");
        directGrid.className = "card-grid scene-cut-grid";
        sceneEl.appendChild(directGrid);
      }
      directGrid.appendChild(cutCard(cut));
    };
    scene.children.forEach((child) => {
      if (child.type === "cut") {
        appendDirectCut(child.row);
        return;
      }
      directGrid = null;
      const multicut = child;
      const mc = document.createElement("section");
      mc.className = `multicut-section${state.selectedIds.has(multicut.row.id) ? " selected" : ""}`;
      attachStoryboardDrag(mc, multicut.row);
      mc.innerHTML = `<div class="multicut-header"><h3>${iconHtml("dynamic_feed")}<span>${escapeHtml(multicut.row.title || multicut.row.id)}</span></h3><span>${multicut.cuts.length} cuts / ${displayDuration(multicut.row)}</span></div>`;
      mc.querySelector(".multicut-header").addEventListener("click", (event) => {
        event.stopPropagation();
        selectRow(multicut.row.id, event);
      });
      mc.querySelector(".multicut-header").addEventListener("contextmenu", (event) => showRowContextMenu(event, multicut.row));
      const grid = document.createElement("div");
      grid.className = "card-grid";
      multicut.cuts.forEach((cut) => grid.appendChild(cutCard(cut)));
      mc.appendChild(grid);
      sceneEl.appendChild(mc);
    });
    root.appendChild(sceneEl);
  });
  el.storyboard.replaceChildren(root);
}

function attachStoryboardDrag(element, row) {
  element.draggable = true;
  element.dataset.id = row.id;
  element.dataset.type = row.row_type;
  element.addEventListener("dragstart", (event) => {
    event.stopPropagation();
    handleDragStart(event, row);
  });
  element.addEventListener("dragover", (event) => {
    event.stopPropagation();
    handleDragOver(event, row);
  });
  element.addEventListener("dragleave", (event) => {
    event.stopPropagation();
    clearDropClasses();
  });
  element.addEventListener("drop", (event) => {
    event.stopPropagation();
    handleDrop(event, row);
  });
  element.addEventListener("dragend", (event) => {
    event.stopPropagation();
    clearDragState();
  });
}

function cutCard(cut) {
  const card = document.createElement("article");
  card.className = `cut-card ${cutPlacementClass(cut)}${state.selectedIds.has(cut.id) ? " selected" : ""}`;
  attachStoryboardDrag(card, cut);
  card.addEventListener("click", (event) => selectRow(cut.id, event));
  card.addEventListener("contextmenu", (event) => showRowContextMenu(event, cut));
  const media = displayMediaUrl(cut.image);
  card.innerHTML = `
      <div class="thumb">${media ? `<img src="${media}" alt="">` : `<span>${cut.image ? "Missing image" : "No image"}</span>`}</div>
    <div class="card-body">
      <div class="card-title">${iconHtml("content_cut", "small-icon")}<span>${escapeHtml(rowLabel(cut))}</span></div>
      <div class="card-meta"><span>${escapeHtml(displayDuration(cut))}</span><span>${escapeHtml(cut.id)}</span></div>
    </div>`;
  return card;
}

function renderTimeline() {
  const previousStage = el.timeline.querySelector(".timeline-stage");
  if (previousStage) state.timelineScrollLeft = previousStage.scrollLeft;
  const model = timelineModel();
  const total = model.total;
  const playTime = Math.min(currentPlaybackTime(), total);
  const active = activeCutAt(playTime, model.cuts);
  const root = document.createElement("div");
  root.className = "timeline";
  root.addEventListener("click", (event) => {
    if (event.target === root) clearSelection();
  });
  root.innerHTML = `
    ${timelinePreviewHtml(active?.cut, active?.offset || 0)}
    <div class="timeline-controls">
      <button id="playBtn"></button>
      <input id="timelineSeek" class="timeline-seek" type="range" min="0" max="${total || 0}" step="0.05" value="${playTime}" aria-label="Timeline seek" />
      <span id="timelineTime">${formatTime(playTime)} / ${formatTime(total)}</span>
    </div>
    <div class="timeline-stage">
      <div class="nested-track" style="width:${model.width}px">
        <div class="playhead"><div class="playhead-handle" aria-label="Scrub timeline"></div></div>
        <div class="timeline-ruler">${timelineRulerHtml(model)}</div>
        <div class="timeline-lane scene-lane"></div>
        <div class="timeline-lane multicut-lane"></div>
        <div class="timeline-lane cut-lane"></div>
      </div>
    </div>`;
  renderTimelineLane(root.querySelector(".scene-lane"), model.scenes, "scene");
  renderTimelineLane(root.querySelector(".multicut-lane"), model.multicuts, "multicut");
  renderTimelineLane(root.querySelector(".cut-lane"), model.cuts, "cut");
  renderPlayButton(root.querySelector("#playBtn"));
  root.querySelector("#playBtn").addEventListener("click", togglePlayback);
  root.querySelector("#timelineSeek").addEventListener("input", (event) => {
    setPlaybackOffset(Number(event.target.value) || 0);
  });
  const stage = root.querySelector(".timeline-stage");
  attachTimelineScrub(stage);
  el.timeline.replaceChildren(root);
  if (stage) stage.scrollLeft = Math.min(state.timelineScrollLeft, Math.max(0, stage.scrollWidth - stage.clientWidth));
  updateTimelinePlaybackUi({ forcePreview: true, model, active });
}

function timelineRulerHtml(model) {
  const total = Math.ceil(model.total || 0);
  if (!total) return "";
  return Array.from({ length: total + 1 }, (_, second) => {
    const major = second % 5 === 0;
    const left = timelineXFromSeconds(second, model);
    return `<div class="timeline-tick${major ? " major" : ""}" style="left:${left}px">${major ? `<span>${second}s</span>` : ""}</div>`;
  }).join("");
}

function timelinePreviewHtml(cut, offset) {
  if (!cut) return `<div class="timeline-preview"><div class="timeline-text-preview"><strong>No cut</strong></div></div>`;
  const image = displayMediaUrl(cut.image);
  const audio = displayMediaUrl(cut.audio_file);
  const textRows = ["title", "scene", "subject", "composition", "action", "camera", "audio"]
    .map((field) => [field, field === "title" ? rowLabel(cut) : cut[field]])
    .filter(([, value]) => value)
    .map(([field, value]) => `<div><span>${escapeHtml(field)}</span><strong>${escapeHtml(value)}</strong></div>`);
  if (!textRows.length) textRows.push(`<div><span>title</span><strong>${escapeHtml(cut.id)}</strong></div>`);
  return `
    <div class="timeline-preview" data-cut-id="${escapeHtml(cut.id)}" data-cut-offset="${offset}">
      ${image ? `<img src="${image}" alt="">` : `<div class="timeline-text-preview">${textRows.join("")}</div>`}
      ${audio ? `<audio id="timelineAudio" src="${audio}" preload="auto"></audio>` : ""}
    </div>`;
}

function renderTimelineLane(lane, items, type) {
  items.forEach((item) => {
    const clip = document.createElement("div");
    clip.className = `clip timeline-clip ${type} ${cutPlacementClass(item.row)}${state.selectedIds.has(item.row.id) ? " selected" : ""}`;
    clip.draggable = true;
    clip.dataset.id = item.row.id;
    clip.dataset.type = type;
    clip.style.left = `${item.start}px`;
    clip.style.width = `${item.width}px`;
    clip.innerHTML = `<strong>${iconHtml(rowTypeIcon(type), "small-icon")}<span>${escapeHtml(rowLabel(item.row))}</span></strong><span>${escapeHtml(displayDuration(item.row))}</span>${type === "cut" ? `<button class="clip-resize-handle" type="button" aria-label="Adjust out point" title="Adjust out point"></button>` : ""}`;
    clip.addEventListener("click", (event) => {
      event.stopPropagation();
      selectRow(item.row.id, event);
    });
    clip.querySelector(".clip-resize-handle")?.addEventListener("pointerdown", (event) => startClipResize(event, item.row));
    clip.addEventListener("dragstart", (event) => {
      if (state.timelineResizing) {
        event.preventDefault();
        return;
      }
      clip.classList.add("dragging");
      handleDragStart(event, item.row);
    });
    clip.addEventListener("dragover", (event) => handleDragOver(event, item.row));
    clip.addEventListener("dragleave", clearDropClasses);
    clip.addEventListener("drop", (event) => handleDrop(event, item.row));
    clip.addEventListener("dragend", clearDragState);
    clip.addEventListener("contextmenu", (event) => showRowContextMenu(event, item.row));
    lane.appendChild(clip);
  });
}

function sortByGlobalTimeline(a, b) {
  const ordered = hierarchyRows();
  return ordered.findIndex((row) => row.id === a.id) - ordered.findIndex((row) => row.id === b.id);
}

function timelineModel() {
  const unit = timelineUnit();
  const minWidth = timelineMinWidth();
  let cursor = 0;
  const scenes = [];
  const multicuts = [];
  const cuts = [];
  buildTree().forEach((scene) => {
    const sceneStart = cursor;
    scene.children.forEach((child) => {
      if (child.type === "cut") {
        const width = Math.max(minWidth, durationSeconds(child.row.duration) * unit);
        cuts.push({ row: child.row, start: cursor, width, seconds: durationSeconds(child.row.duration) });
        cursor += width;
        return;
      }
      const multicut = child;
      const multicutStart = cursor;
      multicut.cuts.forEach((cut) => {
        const width = Math.max(minWidth, durationSeconds(cut.duration) * unit);
        cuts.push({ row: cut, start: cursor, width, seconds: durationSeconds(cut.duration) });
        cursor += width;
      });
      const multicutWidth = Math.max(minWidth, cursor - multicutStart);
      multicuts.push({ row: multicut.row, start: multicutStart, width: multicutWidth });
      if (cursor === multicutStart) cursor += multicutWidth;
    });
    const sceneWidth = Math.max(minWidth, cursor - sceneStart);
    scenes.push({ row: scene.row, start: sceneStart, width: sceneWidth });
    if (cursor === sceneStart) cursor += sceneWidth;
  });
  const total = cuts.reduce((sum, item) => sum + item.seconds, 0);
  return { scenes, multicuts, cuts, width: Math.max(cursor, 640), total };
}

function activeCutAt(time, cutItems = timelineModel().cuts) {
  let elapsed = 0;
  for (const item of cutItems) {
    const end = elapsed + item.seconds;
    if (time < end || item === cutItems[cutItems.length - 1]) return { cut: item.row, offset: Math.max(0, time - elapsed), start: elapsed, end };
    elapsed = end;
  }
  return null;
}

function updateTimelinePlaybackUi({ forcePreview = false, model = timelineModel(), active = null } = {}) {
  const root = el.timeline.querySelector(".timeline");
  if (!root) return;
  const total = model.total;
  const playTime = clamp(currentPlaybackTime(), 0, total);
  const activeCut = active || activeCutAt(playTime, model.cuts);
  const seek = root.querySelector("#timelineSeek");
  const time = root.querySelector("#timelineTime");
  const stage = root.querySelector(".timeline-stage");
  const track = root.querySelector(".nested-track");
  const playhead = root.querySelector(".playhead");
  const playBtn = root.querySelector("#playBtn");
  renderPlayButton(playBtn);
  if (seek) {
    seek.max = String(total || 0);
    seek.value = String(playTime);
  }
  if (time) time.textContent = `${formatTime(playTime)} / ${formatTime(total)}`;
  if (track && playhead) {
    playhead.style.left = `${timelineXFromSeconds(playTime, model)}px`;
  }
  const preview = root.querySelector(".timeline-preview");
  const cut = activeCut?.cut || null;
  const offset = activeCut?.offset || 0;
  if (preview && (forcePreview || preview.dataset.cutId !== (cut?.id || ""))) {
    preview.outerHTML = timelinePreviewHtml(cut, offset);
  } else if (preview) {
    preview.dataset.cutOffset = String(offset);
  }
  syncTimelineAudio(cut, offset);
}

function centerTimelineOnPlayhead() {
  const root = el.timeline.querySelector(".timeline");
  const stage = root?.querySelector(".timeline-stage");
  const track = root?.querySelector(".nested-track");
  if (!stage) return;
  const model = timelineModel();
  const target = timelineXFromSeconds(currentPlaybackTime(), model) + (track?.offsetLeft || 0) - stage.clientWidth / 2;
  const maxScroll = Math.max(0, stage.scrollWidth - stage.clientWidth);
  stage.scrollLeft = clamp(target, 0, maxScroll);
  state.timelineScrollLeft = stage.scrollLeft;
  updateTimelinePlaybackUi({ model });
}

function renderPlayButton(playBtn) {
  if (!playBtn) return;
  setIconText(playBtn, state.playing ? "stop" : "play_arrow", state.playing ? "Stop" : "Play");
}

function attachTimelineScrub(stage) {
  if (!stage) return;
  const start = (event) => {
    if (event.target.closest(".timeline-clip") && !event.target.closest(".playhead")) return;
    event.preventDefault();
    state.timelineScrubbing = true;
    stage.classList.add("scrubbing");
    stage.setPointerCapture?.(event.pointerId);
    scrubTimelineAt(event);
  };
  const move = (event) => {
    if (!state.timelineScrubbing) return;
    event.preventDefault();
    scrubTimelineAt(event);
  };
  const end = (event) => {
    if (!state.timelineScrubbing) return;
    state.timelineScrubbing = false;
    stage.classList.remove("scrubbing");
    stage.releasePointerCapture?.(event.pointerId);
  };
  stage.addEventListener("pointerdown", start);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  stage.addEventListener("scroll", () => {
    state.timelineScrollLeft = stage.scrollLeft;
    updateTimelinePlaybackUi();
  });
  stage.addEventListener("wheel", (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    stage.scrollLeft += delta;
    updateTimelinePlaybackUi();
  }, { passive: false });
}

function scrubTimelineAt(event) {
  const stage = event.currentTarget;
  const model = timelineModel();
  const x = timelineXFromClientX(stage, event.clientX);
  state.playOffset = secondsFromTimelineX(x, model);
  if (state.playing) state.playStartedAt = performance.now();
  updateTimelinePlaybackUi({ model });
}

function timelineXFromClientX(stage, clientX) {
  const track = stage?.querySelector(".nested-track");
  if (!stage || !track) return 0;
  const stageRect = stage.getBoundingClientRect();
  return clamp(clientX - stageRect.left + stage.scrollLeft - track.offsetLeft, 0, track.offsetWidth);
}

function timelineXFromSeconds(seconds, model = timelineModel()) {
  if (!model.cuts.length) return 0;
  const target = clamp(seconds, 0, model.total);
  let elapsed = 0;
  for (const item of model.cuts) {
    const end = elapsed + item.seconds;
    if (target <= end || item === model.cuts[model.cuts.length - 1]) {
      const ratio = item.seconds ? clamp((target - elapsed) / item.seconds, 0, 1) : 0;
      return item.start + item.width * ratio;
    }
    elapsed = end;
  }
  const last = model.cuts[model.cuts.length - 1];
  return last.start + last.width;
}

function secondsFromTimelineX(x, model = timelineModel()) {
  if (!model.cuts.length) return 0;
  const target = clamp(x, 0, model.width);
  let elapsed = 0;
  for (const item of model.cuts) {
    const endX = item.start + item.width;
    if (target <= endX || item === model.cuts[model.cuts.length - 1]) {
      const ratio = item.width ? clamp((target - item.start) / item.width, 0, 1) : 0;
      return clamp(elapsed + item.seconds * ratio, 0, model.total);
    }
    elapsed += item.seconds;
  }
  return model.total;
}

function startClipResize(event, row) {
  event.preventDefault();
  event.stopPropagation();
  const clip = event.currentTarget.closest(".timeline-clip");
  if (!clip || row.row_type !== "cut") return;
  const seconds = durationSeconds(row.duration);
  state.timelineResizing = {
    id: row.id,
    startX: event.clientX,
    startSeconds: seconds,
    previewSeconds: seconds,
  };
  clip.classList.add("resizing");
  const move = (moveEvent) => resizeClipPreview(moveEvent, clip);
  const end = (upEvent) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", end);
    document.removeEventListener("pointercancel", end);
    finishClipResize(upEvent, clip, row);
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}

function resizeClipPreview(event, clip) {
  if (!state.timelineResizing) return;
  event.preventDefault();
  const delta = event.clientX - state.timelineResizing.startX;
  const nextSeconds = clampDuration(state.timelineResizing.startSeconds + delta / timelineUnit());
  state.timelineResizing.previewSeconds = nextSeconds;
  clip.style.width = `${Math.max(timelineMinWidth(), nextSeconds * timelineUnit())}px`;
  clip.querySelector("span").textContent = formatDuration(nextSeconds);
}

function finishClipResize(event, clip, row) {
  if (!state.timelineResizing) return;
  event.preventDefault();
  event.stopPropagation();
  const seconds = state.timelineResizing.previewSeconds;
  state.timelineResizing = null;
  clip.classList.remove("resizing");
  const nextDuration = formatDuration(seconds);
  if (row.duration !== nextDuration) {
    pushHistory();
    row.duration = nextDuration;
    state.activeId = row.id;
    state.selectedIds = new Set([row.id]);
    state.selectionAnchorId = row.id;
    state.playOffset = clamp(state.playOffset, 0, timelineModel().total);
    if (state.playing) state.playStartedAt = performance.now();
    markDirty();
  }
  render();
}

function clampDuration(seconds) {
  return Math.round(Math.max(0.5, seconds) * 10) / 10;
}

function timelineUnit() {
  return 72;
}

function timelineMinWidth() {
  return 112;
}

function renderDetail() {
  const row = getRow(state.activeId);
  if (!row) {
    el.detail.innerHTML = `<div class="empty-state">Select a row.</div>`;
    return;
  }
  const form = document.createElement("div");
  form.className = "form-grid";
  const fields = ["id", "title", "duration", "status", "image", "audio_file", "video_file", "image_prompt", "video_prompt", "scene", "subject", "composition", "action", "camera", "audio", "note"];
  fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const autoDuration = field === "duration" && row.row_type !== "cut";
    const readOnly = autoDuration || !EDITABLE_COLUMNS.has(field);
    const tag = ["image_prompt", "video_prompt", "note"].includes(field) ? "textarea" : "input";
    wrapper.innerHTML = `<label>${field}</label><${tag} ${readOnly ? "readonly" : ""}>${tag === "textarea" ? escapeHtml(row[field] || "") : ""}</${tag}>`;
    const input = wrapper.querySelector(tag);
    if (tag === "input") input.value = autoDuration ? displayDuration(row) : row[field] || "";
    if (!readOnly) input.addEventListener("change", () => updateRow(row.id, { [field]: input.value }));
    if (!readOnly) attachAssetAutocomplete(input);
    form.appendChild(wrapper);
  });
  el.detail.replaceChildren(form);
}

function renderPrompt() {
  const row = getRow(state.activeId);
  if (!row) {
    el.prompt.innerHTML = `<div class="empty-state">No row selected.</div>`;
    return;
  }
  const effective = effectivePrompts(row);
  el.prompt.innerHTML = `
    <div class="field"><label>Effective image_prompt</label><div class="prompt-output">${escapeHtml(effective.image || "(empty)")}</div></div>
    <div class="field"><label>Effective video_prompt</label><div class="prompt-output">${escapeHtml(effective.video || "(empty)")}</div></div>
    <button id="copyPromptBtn">${iconHtml("content_copy")}<span class="icon-button-label">Copy Effective Prompts</span></button>`;
  document.querySelector("#copyPromptBtn").addEventListener("click", () => {
    navigator.clipboard?.writeText(`image_prompt:\n${effective.image}\n\nvideo_prompt:\n${effective.video}`);
  });
}

function renderMedia() {
  const row = getRow(state.activeId);
  if (!row || row.row_type !== "cut") {
    el.media.innerHTML = `<div class="empty-state">Select a cut.</div>`;
    return;
  }
  const image = displayMediaUrl(row.image);
  const audio = displayMediaUrl(row.audio_file);
  el.media.innerHTML = `
    <div class="media-preview">
      <div class="image-preview">${image ? `<img src="${image}" alt="">` : `<span>${row.image ? "Missing image" : "No image"}</span>`}</div>
      <div>${escapeHtml(row.image || "No image path")}</div>
      ${audio ? `<audio controls src="${audio}"></audio>` : `<div>${escapeHtml(row.audio_file || "No audio path")}</div>`}
    </div>`;
}

function renderPromptEdit() {
  if (!el.promptEdit) return;
  const row = getRow(state.activeId);
  if (!row) {
    el.promptEdit.innerHTML = `
      <div class="prompt-edit-empty">
        ${iconHtml("edit_note", "empty-icon")}
        <span>Select a row to edit prompts.</span>
      </div>`;
    return;
  }
  el.promptEdit.innerHTML = `
    <div class="prompt-edit-layout" data-row-id="${escapeAttr(row.id)}">
      ${promptEditColumnHtml(row, "image_prompt", "Still Image", row.image_prompt || "")}
      ${promptEditColumnHtml(row, "video_prompt", "Video", row.video_prompt || "")}
    </div>
    <div class="prompt-hover-preview" hidden></div>`;
  el.promptEdit.querySelectorAll(".prompt-textarea").forEach((editor) => {
    editor.addEventListener("focus", () => startPromptEditSession(editor));
    editor.addEventListener("input", () => handlePromptTextareaInput(editor));
    editor.addEventListener("blur", (event) => finishPromptEditSession(editor, event));
  });
  el.promptEdit.querySelectorAll("[data-prompt-ref-add]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openPromptAssetPicker(event.currentTarget);
    });
  });
  el.promptEdit.querySelectorAll("[data-prompt-ref-remove]").forEach((button) => {
    button.addEventListener("click", (event) => removePromptReferenceAsset(event.currentTarget));
  });
  resolvePromptMediaPreviews();
  resolvePromptReferencePreviews();
}

function bindPromptReferenceControls(root = el.promptEdit) {
  root?.querySelectorAll("[data-prompt-ref-add]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openPromptAssetPicker(event.currentTarget);
    });
  });
  root?.querySelectorAll("[data-prompt-ref-remove]").forEach((button) => {
    button.addEventListener("click", (event) => removePromptReferenceAsset(event.currentTarget));
  });
}

function openPromptAssetPicker(button) {
  closeAssetSuggest();
  const row = getRow(state.activeId);
  const field = button?.dataset?.promptRefAdd || "";
  if (!row || !field) return;
  const prompt = activePromptEntry(row.id, promptKindFromField(field));
  const linked = new Set(prompt?.linkedAssetIds || []);
  const candidates = state.assets.filter((asset) => asset.id && !linked.has(asset.id));
  const popup = document.createElement("div");
  popup.className = "asset-suggest prompt-asset-picker";
  const rect = button.getBoundingClientRect();
  popup.style.left = `${Math.max(8, rect.left)}px`;
  popup.style.top = `${Math.min(window.innerHeight - 260, rect.bottom + 8)}px`;
  popup.innerHTML = candidates.length
    ? candidates.map((asset, index) => promptAssetPickerItemHtml(asset, index)).join("")
    : `<div class="prompt-asset-picker-empty">No assets available.</div>`;
  popup.querySelectorAll("[data-prompt-asset-index]").forEach((item) => {
    item.addEventListener("mousedown", (event) => {
      event.preventDefault();
      addPromptReferenceAsset(field, candidates[Number(item.dataset.promptAssetIndex)]?.id || "");
    });
  });
  document.body.appendChild(popup);
  state.assetSuggest = { popup, target: button, context: { field }, matches: candidates, index: 0 };
  resolvePromptAssetPickerPreviews(popup);
}

function promptAssetPickerItemHtml(asset, index) {
  return `
    <button type="button" class="prompt-asset-picker-item" data-prompt-asset-index="${index}" data-path="${escapeAttr(asset.path)}">
      <div class="prompt-asset-picker-thumb">${promptMediaCardBodyHtml(asset.path)}</div>
      <span class="prompt-asset-picker-text">
        <strong>${escapeHtml(assetDisplayName(asset))}</strong>
        <small>${escapeHtml(asset.path || asset.id)}</small>
      </span>
    </button>`;
}

async function resolvePromptAssetPickerPreviews(root) {
  const items = [...(root?.querySelectorAll?.(".prompt-asset-picker-item[data-path]") || [])];
  await Promise.all(items.map((item) => resolvePromptMediaPath(item.dataset.path || "")));
  items.forEach((item) => {
    const path = item.dataset.path || "";
    const thumb = item.querySelector(".prompt-asset-picker-thumb");
    if (thumb) thumb.innerHTML = promptMediaCardBodyHtml(path);
  });
}

function addPromptReferenceAsset(field, assetId) {
  const row = getRow(state.activeId);
  const asset = assetById(assetId);
  if (!row || !field || !asset) return;
  const prompt = ensureActivePrompt(row.id, row.row_type, promptKindFromField(field));
  if (!prompt) return;
  if (!prompt.linkedAssetIds.includes(asset.id)) {
    pushHistory();
    prompt.linkedAssetIds.push(asset.id);
    prompt.updatedAt = new Date().toISOString();
    markDirty();
  }
  closeAssetSuggest();
  syncRowsFromJsonState();
  renderPromptEdit();
  renderPrompt();
  renderStatus(validate());
}

function removePromptReferenceAsset(button) {
  const row = getRow(state.activeId);
  const field = button?.dataset?.promptRefRemove || "";
  const assetId = button?.dataset?.assetId || "";
  const prompt = row ? activePromptEntry(row.id, promptKindFromField(field)) : null;
  if (!prompt || !assetId) return;
  const next = prompt.linkedAssetIds.filter((id) => id !== assetId);
  if (next.length === prompt.linkedAssetIds.length) return;
  pushHistory();
  prompt.linkedAssetIds = next;
  prompt.updatedAt = new Date().toISOString();
  if (!prompt.text && !prompt.linkedAssetIds.length) prompt.isActive = false;
  markDirty();
  syncRowsFromJsonState();
  renderPromptEdit();
  renderPrompt();
  renderStatus(validate());
}

function renderAssets() {
  if (!el.assetsView) return;
  const modalAsset = state.assets.find((asset) => asset.id === state.assetModalId);
  el.assetsView.innerHTML = `
    <div class="assets-view">
      <div class="assets-drop-zone">
        <div class="assets-grid">
          ${state.assets.length ? state.assets.map((asset, index) => assetCardHtml(asset, index)).join("") : `<div class="empty-state">Drop reference image files here.</div>`}
        </div>
      </div>
    </div>
    ${modalAsset ? assetModalHtml(modalAsset) : ""}`;
  const dropTarget = el.assetsView;
  const dropSurface = el.assetsView.querySelector(".assets-view");
  dropTarget?.addEventListener("dragover", (event) => {
    if (!hasFilePayload(event.dataTransfer)) return;
    event.preventDefault();
    dropSurface?.classList.add("drag-over");
  });
  dropTarget?.addEventListener("dragleave", (event) => {
    if (!dropTarget.contains(event.relatedTarget)) dropSurface?.classList.remove("drag-over");
  });
  dropTarget?.addEventListener("drop", handleAssetDrop);
  el.assetsView.querySelectorAll(".asset-card").forEach((card) => {
    card.addEventListener("click", (event) => selectAsset(card.dataset.assetId, event));
  });
  el.assetsView.querySelectorAll(".asset-thumb").forEach((thumb) => {
    thumb.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = thumb.closest(".asset-card")?.dataset.assetId || "";
      if (!assetById(id)) return;
      state.assetModalId = id;
      renderAssets();
    });
  });
  el.assetsView.querySelectorAll("[data-asset-field]").forEach((input) => {
    input.addEventListener("click", (event) => event.stopPropagation());
    input.addEventListener("change", () => updateAsset(input.dataset.assetId, input.dataset.assetField, input.value));
    attachAssetAutocomplete(input);
  });
  el.assetsView.querySelectorAll("[data-asset-action]").forEach((button) => {
    button.addEventListener("click", () => handleAssetAction(button.dataset.assetAction, button.dataset.assetId));
  });
  el.assetsView.querySelector(".asset-modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("asset-modal-backdrop")) closeAssetModal();
  });
  resolvePromptMediaPreviews(el.assetsView);
}

function renderAgents() {
  if (!el.agentsView) return;
  el.agentsView.innerHTML = `
    <div class="agents-view">
      <header class="agents-header">
        <div>
          <strong>AGENTS.md</strong>
          <span>Project agent instructions saved at the .lctproj root.</span>
        </div>
        <button id="resetAgentsBtn" type="button">${iconHtml("restore")}<span class="icon-button-label">Reset</span></button>
      </header>
      <textarea id="agentsEditor" spellcheck="false" aria-label="AGENTS.md">${escapeHtml(state.agentsText)}</textarea>
    </div>`;
  const editor = el.agentsView.querySelector("#agentsEditor");
  editor?.addEventListener("input", () => {
    if (state.agentsText === editor.value) return;
    pushHistory();
    state.agentsText = editor.value;
    markDirty();
    renderStatus(validate());
  }, { once: true });
  editor?.addEventListener("input", () => {
    state.agentsText = editor.value;
    markDirty();
    renderStatus(validate());
  });
  el.agentsView.querySelector("#resetAgentsBtn")?.addEventListener("click", resetAgentsText);
}

function resetAgentsText() {
  if (state.agentsText === PROJECT_AGENTS_MD) return;
  if (!confirm("Reset AGENTS.md to the default project instructions?")) return;
  pushHistory();
  state.agentsText = PROJECT_AGENTS_MD;
  markDirty();
  renderAgents();
  renderStatus(validate());
}

function assetCardHtml(asset, index) {
  return `
    <article class="asset-card${state.assetSelectedIds.has(asset.id) ? " selected" : ""}" data-asset-id="${escapeAttr(asset.id)}" data-asset-index="${index}">
      <div class="asset-thumb" title="Open details">${assetPreviewHtml(asset)}</div>
      <label>title<input data-asset-id="${escapeAttr(asset.id)}" data-asset-field="title" value="${escapeAttr(asset.title)}"></label>
      <label>tags<input data-asset-id="${escapeAttr(asset.id)}" data-asset-field="tags" value="${escapeAttr(asset.tags.join(", "))}"></label>
    </article>`;
}

function assetModalHtml(asset) {
  return `
    <div class="asset-modal-backdrop">
      <section class="asset-modal" role="dialog" aria-modal="true">
        <header>
          <h2>${iconHtml("inventory_2")}<span>Asset</span></h2>
          <button type="button" data-asset-action="close" data-asset-id="${escapeAttr(asset.id)}">${iconHtml("close")}<span class="icon-button-label">Close</span></button>
        </header>
        <div class="asset-modal-body">
          <div class="asset-modal-preview">${assetPreviewHtml(asset)}</div>
          <div class="asset-modal-fields">
            <label>path<input data-asset-id="${escapeAttr(asset.id)}" data-asset-field="path" value="${escapeAttr(asset.path)}"></label>
            <label>type<input data-asset-id="${escapeAttr(asset.id)}" data-asset-field="type" value="${escapeAttr(asset.type)}" readonly></label>
            <label>title<input data-asset-id="${escapeAttr(asset.id)}" data-asset-field="title" value="${escapeAttr(asset.title)}"></label>
            <label>tags<input data-asset-id="${escapeAttr(asset.id)}" data-asset-field="tags" value="${escapeAttr(asset.tags.join(", "))}"></label>
            <label>note<textarea data-asset-id="${escapeAttr(asset.id)}" data-asset-field="note">${escapeHtml(asset.note)}</textarea></label>
          </div>
        </div>
        <footer class="asset-actions">
          <button type="button" data-asset-action="browse" data-asset-id="${escapeAttr(asset.id)}">${iconHtml("folder_open")}<span class="icon-button-label">Browse</span></button>
          <button type="button" data-asset-action="delete" data-asset-id="${escapeAttr(asset.id)}">${iconHtml("delete")}<span class="icon-button-label">Delete</span></button>
        </footer>
      </section>
    </div>`;
}

function assetPreviewHtml(asset) {
  return promptMediaCardHtml(asset.path || "", true);
}

function updateAsset(id, field, value) {
  const asset = assetById(id);
  if (!asset) return;
  if (field === "path") {
    invalidateMediaPathStatus(asset.path);
    invalidateMediaPathStatus(value);
  }
  asset[field] = field === "tags" ? String(value).split(",").map((tag) => tag.trim()).filter(Boolean) : value;
  if (field === "path") asset.type = assetTypeFromPath(value);
  if (field === "path" && !asset.title) asset.title = fileStem(value);
  markDirty();
  renderAssets();
  renderStatus(validate());
}

function handleAssetDrop(event) {
  event.preventDefault();
  el.assetsView?.querySelector(".assets-view")?.classList.remove("drag-over");
  const files = [...(event.dataTransfer?.files || [])];
  if (!files.length) return;
  const targetAssetId = assetDropCardIdFromElement(event.target);
  handleResolvedAssetDrop({
    assets: targetAssetId ? [assetFromDroppedFile(files[0])] : files.map(assetFromDroppedFile),
    target: event.target,
    source: "browser",
  });
}

function setupTauriAssetDrop() {
  const listen = window.__TAURI__?.event?.listen;
  const registered = [];
  const hasStandardListener = setupTauriStandardAssetDrop(() => {
    if (listen) registerTauriAssetDropEventListen("tauri://drag-drop", "tauri-event", registered);
  }, registered);
  if (!hasStandardListener && listen) registerTauriAssetDropEventListen("tauri://drag-drop", "tauri-event", registered);
  if (listen) registerTauriAssetDropEventListen("asset-file-drop", "asset-file-drop", registered);
  console.info(`[assets-dnd] registered listeners: ${registered.length ? registered.join(", ") : "none"}`);
  debugAssetDrop("available tauri namespaces", {
    hasEventListen: typeof listen === "function",
    hasWebview: Boolean(window.__TAURI__?.webview),
    hasWebviewWindow: Boolean(window.__TAURI__?.webviewWindow),
  });
}

function setupTauriStandardAssetDrop(onFailure, registered = []) {
  const webviewWindow = window.__TAURI__?.webviewWindow;
  const webview = window.__TAURI__?.webview;
  const candidates = [
    { label: "webview.getCurrentWebview", owner: webview, method: "getCurrentWebview" },
    { label: "webview.getCurrent", owner: webview, method: "getCurrent" },
    { label: "webviewWindow.getCurrentWebviewWindow", owner: webviewWindow, method: "getCurrentWebviewWindow" },
    { label: "webviewWindow.getCurrent", owner: webviewWindow, method: "getCurrent" },
  ];
  for (const candidate of candidates) {
    try {
      const getCurrent = candidate.owner?.[candidate.method];
      if (typeof getCurrent !== "function") continue;
      const current = getCurrent.call(candidate.owner);
      const onDragDropEvent = current?.onDragDropEvent;
      if (typeof onDragDropEvent !== "function") continue;
      Promise.resolve(onDragDropEvent((event) => handleTauriAssetDropEvent(event, "tauri-standard")))
        .catch((error) => {
          console.warn("Tauri standard drag/drop listener could not be registered", error);
          onFailure?.();
        });
      registered.push(candidate.label);
      return true;
    } catch (error) {
      console.warn(`Tauri standard drag/drop listener could not be initialized via ${candidate.label}`, error);
    }
  }
  return false;
}

function registerTauriAssetDropEventListen(eventName, source, registered = []) {
  const listen = window.__TAURI__?.event?.listen;
  if (!listen) return;
  Promise.resolve(listen(eventName, (event) => handleTauriAssetDropEvent(event, source)))
    .catch((error) => console.warn(`Tauri ${eventName} listener could not be registered`, error));
  registered.push(eventName);
}

function handleTauriAssetDropEvent(event, source = "tauri") {
  const drop = normalizeTauriAssetDropEvent(event, source);
  debugAssetDrop("received native drop event", drop);
  if (drop.type && drop.type !== "drop") {
    debugAssetDrop("ignored non-drop event", drop);
    return;
  }
  if (!drop.paths.length) {
    debugAssetDrop("ignored empty drop", drop);
    return;
  }
  const target = assetDropTargetFromPosition(drop.position, drop.scaleFactor);
  if (!target) {
    debugAssetDrop("ignored drop outside assets view", drop);
    return;
  }
  const targetAssetId = assetDropCardIdFromElement(target);
  handleResolvedAssetDrop({
    assets: targetAssetId ? [assetFromDroppedPath(drop.paths[0])] : drop.paths.map(assetFromDroppedPath),
    target,
    source: drop.source,
    position: drop.position,
    scaleFactor: drop.scaleFactor,
  });
}

function normalizeTauriAssetDropEvent(event, source = "tauri") {
  const payload = event?.payload || event || {};
  const inner = payload?.payload || {};
  const paths = payload?.paths || inner?.paths || [];
  return {
    source,
    type: payload?.type || inner?.type || event?.type || "",
    paths: Array.isArray(paths) ? paths : [],
    position: payload?.position || inner?.position || null,
    scaleFactor: payload?.scaleFactor ?? payload?.scale_factor ?? inner?.scaleFactor ?? inner?.scale_factor ?? window.devicePixelRatio ?? 1,
  };
}

function assetDropTargetFromPosition(position, scaleFactor = 1) {
  const view = el.assetsView;
  if (!view || view.hidden || state.view !== "assets") {
    debugAssetDrop("drop target unavailable", { hasAssetsView: Boolean(view), hidden: view?.hidden, currentView: state.view });
    return null;
  }
  if (el.assetsView.querySelector(".asset-modal-backdrop")) {
    debugAssetDrop("drop ignored because asset modal is open");
    return null;
  }
  if (!position || position.x == null || position.y == null) {
    debugAssetDrop("drop has no position; using assets view as target", { target: describeAssetDropElement(view) });
    return view;
  }
  const scale = Number(scaleFactor) || window.devicePixelRatio || 1;
  const point = { x: position.x / scale, y: position.y / scale };
  const rect = view.getBoundingClientRect();
  if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) {
    debugAssetDrop("drop point outside assets view", { position, scaleFactor: scale, cssPoint: point, assetsViewRect: domRectToObject(rect) });
    return null;
  }
  const element = document.elementFromPoint(point.x, point.y) || view;
  debugAssetDrop("resolved drop target", {
    position,
    scaleFactor: scale,
    cssPoint: point,
    assetsViewRect: domRectToObject(rect),
    element: describeAssetDropElement(element),
    targetAssetId: assetDropCardIdFromElement(element),
  });
  return element;
}

function assetDropCardIdFromElement(element) {
  const card = element?.closest?.(".asset-card");
  return card?.dataset?.assetId || "";
}

function handleResolvedAssetDrop({ assets, target, source, position = null, scaleFactor = 1 }) {
  if (!assets?.length) return;
  const targetAssetId = assetDropCardIdFromElement(target);
  debugAssetDrop("accepted drop", { source, paths: assets.map((asset) => asset.path), position, scaleFactor, targetAssetId });
  if (targetAssetId) {
    applyDroppedAssetToExistingAsset(targetAssetId, assets[0]);
    showToast("Asset path updated. Save the project to write it to the .lctproj file.");
    return;
  }
  addDroppedAssets(assets);
  showToast(`${assets.length} asset${assets.length === 1 ? "" : "s"} added. Save the project to write assets.json.`);
}

function debugAssetDrop(message, details = {}) {
  if (localStorage.getItem("preproDebugDnd") !== "1") return;
  console.debug("[assets-dnd]", message, details);
}

function describeAssetDropElement(element) {
  if (!element) return null;
  return {
    tagName: element.tagName,
    id: element.id || "",
    className: typeof element.className === "string" ? element.className : "",
    assetId: element.closest?.(".asset-card")?.dataset?.assetId || "",
  };
}

function domRectToObject(rect) {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function addDroppedAssets(added) {
  if (!added.length) return;
  state.assets.push(...added);
  state.assetSelectedIds = new Set(added.map((asset) => asset.id));
  state.assetSelectionAnchorId = added[0]?.id || "";
  markDirty();
  renderAssets();
  renderStatus(validate());
}

function applyDroppedAssetToExistingAsset(assetId, droppedAsset) {
  const asset = assetById(assetId);
  if (!asset || !droppedAsset?.path) return;
  invalidateMediaPathStatus(asset.path);
  invalidateMediaPathStatus(droppedAsset.path);
  asset.path = droppedAsset.path;
  asset.type = assetTypeFromPath(droppedAsset.path);
  if (!asset.title) asset.title = fileStem(droppedAsset.path);
  state.assetSelectedIds = new Set([asset.id]);
  state.assetSelectionAnchorId = asset.id;
  markDirty();
  renderAssets();
  renderStatus(validate());
}

function assetFromDroppedFile(file) {
  const path = assetPathFromDroppedFile(file);
  setSessionMediaUrl(path, file);
  const title = fileStem(path);
  return normalizeAsset({
    id: nextAssetId(),
    path,
    type: assetTypeFromPath(path),
    title,
    note: "",
  });
}

function assetFromDroppedPath(droppedPath) {
  const path = assetPathFromDroppedPath(droppedPath);
  const title = fileStem(path);
  return normalizeAsset({
    id: nextAssetId(),
    path,
    type: assetTypeFromPath(path),
    title,
    note: "",
  });
}

function assetPathFromDroppedFile(file) {
  const rawPath = normalizeAssetPathSeparators(file.path || "");
  if (tauriInvoke && rawPath && isAbsoluteAssetPath(rawPath)) return rawPath;
  const webkitPath = normalizeAssetPathSeparators(file.webkitRelativePath || "");
  if (webkitPath) return webkitPath;
  return `assets/${normalizeAssetPathSeparators(file.name || "asset")}`;
}

function assetPathFromDroppedPath(path) {
  const normalized = normalizeAssetPathSeparators(path);
  return normalized;
}

function relativeAssetPathFromProject(path) {
  if (!path || !state.projectPath || !isAbsoluteAssetPath(path)) return "";
  const projectDir = normalizeAssetPathSeparators(state.projectPath).replace(/\/[^/]*$/, "");
  if (!projectDir) return "";
  const normalizedPath = normalizeAssetPathSeparators(path);
  const prefix = projectDir.endsWith("/") ? projectDir : `${projectDir}/`;
  return normalizedPath.toLowerCase().startsWith(prefix.toLowerCase()) ? normalizedPath.slice(prefix.length) : "";
}

function isAbsoluteAssetPath(path) {
  return /^[A-Za-z]:\//.test(path) || path.startsWith("/");
}

function normalizeAssetPathSeparators(path) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, (match) => match.length > 1 ? "/" : match);
}

async function handleAssetAction(action, id) {
  const asset = assetById(id);
  if (action === "close") return closeAssetModal();
  if (!asset) return;
  if (action === "delete") {
    deleteAssetsByIds(new Set([asset.id]));
    return;
  }
  if (action === "browse") {
    if (!tauriInvoke || !state.projectPath) return alert("Open or save a .lctproj project before browsing assets.");
    const picked = await tauriInvoke("pick_asset_file", { projectPath: state.projectPath, project_path: state.projectPath });
    if (!picked) return;
    const file = normalizeTauriFile(picked);
    invalidateMediaPathStatus(asset.path);
    invalidateMediaPathStatus(file.path);
    asset.path = file.path;
    asset.type = assetTypeFromPath(file.path);
    if (!asset.title) asset.title = file.fileName.replace(/\.[^.]+$/, "");
  }
  markDirty();
  renderAssets();
}

function selectAsset(id, event = {}) {
  if (!id) return;
  const ids = state.assets.map((asset) => asset.id);
  if (event.shiftKey && state.assetSelectionAnchorId) {
    const anchorIndex = ids.indexOf(state.assetSelectionAnchorId);
    const targetIndex = ids.indexOf(id);
    if (anchorIndex >= 0 && targetIndex >= 0) {
      const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
      state.assetSelectedIds = new Set(ids.slice(start, end + 1));
    } else {
      state.assetSelectedIds = new Set([id]);
      state.assetSelectionAnchorId = id;
    }
  } else if (event.ctrlKey || event.metaKey) {
    if (state.assetSelectedIds.has(id)) state.assetSelectedIds.delete(id);
    else state.assetSelectedIds.add(id);
    if (!state.assetSelectionAnchorId) state.assetSelectionAnchorId = id;
  } else {
    state.assetSelectedIds = new Set([id]);
    state.assetSelectionAnchorId = id;
  }
  renderAssets();
}

function deleteSelectedAssets() {
  if (!state.assetSelectedIds.size) return;
  deleteAssetsByIds(state.assetSelectedIds);
}

function deleteAssetsByIds(ids) {
  state.assets = state.assets.filter((asset) => !ids.has(asset.id));
  state.assetSelectedIds = new Set([...state.assetSelectedIds].filter((id) => !ids.has(id)));
  if (ids.has(state.assetSelectionAnchorId)) state.assetSelectionAnchorId = "";
  if (ids.has(state.assetModalId)) state.assetModalId = "";
  markDirty();
  renderAssets();
  renderStatus(validate());
}

function closeAssetModal() {
  state.assetModalId = "";
  renderAssets();
}

function clearAssetSelection() {
  state.assetSelectedIds = new Set();
  state.assetSelectionAnchorId = "";
  state.assetModalId = "";
}

function assetById(id) {
  return state.assets.find((asset) => asset.id === id);
}

function duplicateAssetAliases() {
  const seen = new Set();
  const duplicates = new Set();
  state.assets.forEach((asset) => {
    const alias = asset.alias?.toLowerCase();
    if (!alias) return;
    if (seen.has(alias)) duplicates.add(asset.alias);
    seen.add(alias);
  });
  return duplicates;
}

function uniqueAssetAlias(base) {
  const taken = new Set(state.assets.map((asset) => asset.alias?.toLowerCase()).filter(Boolean));
  const root = safeAssetAlias(base);
  let alias = root;
  let index = 2;
  while (taken.has(alias.toLowerCase())) alias = `${root}${index++}`;
  return alias;
}

let assetIdCounter = 0;

function nextAssetId(extraTaken = new Set()) {
  const taken = new Set([...state.assets.map((asset) => asset.id), ...extraTaken]);
  let id = "";
  while (!id || taken.has(id)) {
    assetIdCounter += 1;
    id = `asset_${String(assetIdCounter).padStart(3, "0")}`;
  }
  return id;
}

let generatedMediaIdCounter = 0;

function nextGeneratedMediaId(extraTaken = new Set()) {
  const taken = new Set([...state.generatedMedia.map((item) => item.id), ...extraTaken]);
  let id = "";
  while (!id || taken.has(id)) {
    generatedMediaIdCounter += 1;
    id = `gen_${String(generatedMediaIdCounter).padStart(3, "0")}`;
  }
  return id;
}

let promptIdCounter = 0;

function nextPromptId(extraTaken = new Set()) {
  const taken = new Set([...state.prompts.map((prompt) => prompt.id), ...extraTaken]);
  let id = "";
  while (!id || taken.has(id)) {
    promptIdCounter += 1;
    id = `prompt_${String(promptIdCounter).padStart(3, "0")}`;
  }
  return id;
}

function safeAssetAlias(value) {
  return String(value || "asset")
    .replace(/^@+/, "")
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "") || "asset";
}

function fileStem(path) {
  return String(path || "")
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, "");
}

function assetTypeFromPath(path) {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(path) ? "reference_image" : "reference_image";
}

function mediaTypeFromPath(path) {
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(path)) return "image";
  if (/\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(path)) return "audio";
  if (/\.(mp4|mov|m4v|webm)$/i.test(path)) return "video";
  return "image";
}

function promptEditColumnHtml(row, field, label, value) {
  return `
    <section class="prompt-edit-column" data-field="${field}">
      <header class="prompt-edit-header">
        ${iconHtml(field === "image_prompt" ? "perm_media" : "movie", "small-icon")}
        <span>${escapeHtml(label)}</span>
        <code>${escapeHtml(field)}</code>
      </header>
      <div class="prompt-media-strip" data-preview-field="${field}">
        ${promptReferenceStripHtml(row, field)}
      </div>
      <textarea class="prompt-textarea" spellcheck="false" data-field="${field}" aria-label="${escapeAttr(field)}">${escapeHtml(value)}</textarea>
    </section>`;
}

function promptReferenceStripHtml(row, field) {
  const prompt = activePromptEntry(row.id, promptKindFromField(field));
  const ids = [...new Set(prompt?.linkedAssetIds || [])];
  const empty = ids.length ? "" : `<div class="prompt-preview-empty">No references selected.</div>`;
  return `${empty}${ids.map((assetId) => promptReferenceCardHtml(assetId, field)).join("")}<button class="prompt-reference-add" type="button" data-prompt-ref-add="${escapeAttr(field)}" title="Add reference"><span class="prompt-reference-plus">+</span><span class="icon-button-label">Add reference</span></button>`;
}

function promptReferenceCardHtml(assetId, field) {
  const asset = assetById(assetId);
  if (!asset) {
    return `
      <article class="prompt-media-card prompt-reference-card missing" data-asset-id="${escapeAttr(assetId)}">
        <div class="prompt-media-thumb"><span>Missing</span></div>
        <div class="prompt-media-path" title="${escapeAttr(assetId)}">${escapeHtml(assetId)}</div>
        <button class="prompt-reference-remove" type="button" data-prompt-ref-remove="${escapeAttr(field)}" data-asset-id="${escapeAttr(assetId)}" title="Remove reference">${iconHtml("close", "small-icon")}</button>
      </article>`;
  }
  return `
    <article class="prompt-media-card prompt-reference-card" data-asset-id="${escapeAttr(asset.id)}" data-path="${escapeAttr(asset.path)}">
      ${promptMediaCardBodyHtml(asset.path)}
      <div class="prompt-media-path" title="${escapeAttr(asset.path || asset.id)}">${escapeHtml(assetDisplayName(asset))}</div>
      <button class="prompt-reference-remove" type="button" data-prompt-ref-remove="${escapeAttr(field)}" data-asset-id="${escapeAttr(asset.id)}" title="Remove reference">${iconHtml("close", "small-icon")}</button>
    </article>`;
}

function promptKindFromField(field) {
  return field === "video_prompt" ? "video" : "image";
}

function assetDisplayName(asset) {
  return asset?.title || fileNameFromPath(asset?.path || "") || asset?.id || "Asset";
}

function promptMediaPreviewHtml(paths) {
  if (!paths.length) return `<div class="prompt-preview-empty">No media paths in this prompt.</div>`;
  return paths.map((path) => promptMediaCardHtml(path)).join("");
}

function promptMediaCardHtml(path, compact = false) {
  if (!path) {
    return `<article class="prompt-media-card${compact ? " compact" : ""} missing" data-kind="other"><div class="prompt-media-thumb"><span>No path</span></div><div class="prompt-media-path">No path</div></article>`;
  }
  const kind = promptMediaKind(path);
  const resolved = promptMediaResolution(path);
  const label = escapeHtml(path);
  const missing = resolved?.status === "missing";
  const loading = !resolved && !isBrowserSafeMediaPath(path) && !state.mediaUrls.has(path);
  return `<article class="prompt-media-card${compact ? " compact" : ""}${missing ? " missing" : ""}${loading ? " loading" : ""}" data-kind="${kind}" data-path="${escapeAttr(path)}">${promptMediaCardBodyHtml(path)}<div class="prompt-media-path" title="${escapeAttr(path)}">${label}</div></article>`;
}

function promptMediaCardBodyHtml(path) {
  const kind = promptMediaKind(path);
  const resolved = promptMediaResolution(path);
  const url = resolved?.url || "";
  const missing = resolved?.status === "missing";
  const loading = !resolved && !isBrowserSafeMediaPath(path) && !state.mediaUrls.has(path);
  const placeholder = missing ? "Missing / not readable" : "Loading preview...";
  return kind === "image"
    ? `<div class="prompt-media-thumb">${url ? `<img src="${escapeAttr(url)}" alt="">` : `<span>${placeholder}</span>`}</div>`
    : `<div class="prompt-media-audio">${url ? `<audio controls src="${escapeAttr(url)}"></audio>` : `<span>${placeholder}</span>`}</div>`;
}

function tokenizePromptText(text) {
  const matches = mediaPathMatches(text);
  if (!matches.length) return promptTextSegmentHtml(text) + promptTrailingBreakHtml(text);
  let html = "";
  let cursor = 0;
  matches.forEach((match) => {
    html += promptTextSegmentHtml(text.slice(cursor, match.index));
    html += `<span class="prompt-path-token" data-path="${escapeAttr(match.path)}">${escapeHtml(match.path)}</span>`;
    cursor = match.end;
  });
  html += promptTextSegmentHtml(text.slice(cursor)) + promptTrailingBreakHtml(text);
  return html;
}

function promptTextSegmentHtml(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function promptTrailingBreakHtml(text) {
  return String(text || "").endsWith("\n") ? `<br data-prompt-filler="true">` : "";
}

function startPromptEditSession(editor) {
  const key = promptEditorKey(editor);
  state.promptEditSessions.set(key, {
    rowId: state.activeId,
    field: editor.dataset.field,
    historyPushed: false,
    timer: null,
  });
}

function handlePromptEditorInput(editor) {
  const key = promptEditorKey(editor);
  const session = state.promptEditSessions.get(key) || { rowId: state.activeId, field: editor.dataset.field, historyPushed: false, timer: null };
  clearTimeout(session.timer);
  state.promptEditSessions.set(key, session);
  if (isPromptEditorComposing(editor)) return;
  session.timer = setTimeout(() => {
    commitPromptEditor(editor);
    retokenizePromptEditor(editor);
  }, 160);
  renderPromptEditorPreview(editor.dataset.field, promptEditorText(editor));
}

function handlePromptTextareaInput(editor) {
  const key = promptEditorKey(editor);
  const session = state.promptEditSessions.get(key) || { rowId: state.activeId, field: editor.dataset.field, historyPushed: false, timer: null };
  clearTimeout(session.timer);
  state.promptEditSessions.set(key, session);
  session.timer = setTimeout(() => commitPromptEditor(editor), 120);
}

function startPromptEditorComposition(editor) {
  editor.dataset.composing = "true";
  const key = promptEditorKey(editor);
  const session = state.promptEditSessions.get(key) || { rowId: state.activeId, field: editor.dataset.field, historyPushed: false, timer: null };
  if (session.timer) clearTimeout(session.timer);
  state.promptEditSessions.set(key, session);
  closeAssetSuggest();
}

function finishPromptEditorComposition(editor) {
  delete editor.dataset.composing;
  handlePromptEditorInput(editor);
  updateAssetSuggest(editor);
}

function isPromptEditorComposing(editor) {
  return editor?.dataset?.composing === "true";
}

function handlePromptEditorKeydown(event) {
  if (handleAssetSuggestKeydown(event)) return;
  if (event.key === "Enter") {
    event.preventDefault();
    insertPromptEditorText(event.currentTarget, "\n");
  }
}

function finishPromptEditSession(editor, event = {}) {
  const key = promptEditorKey(editor);
  const session = state.promptEditSessions.get(key);
  if (session?.timer) clearTimeout(session.timer);
  commitPromptEditor(editor);
  state.promptEditSessions.delete(key);
  const row = getRow(state.activeId);
  if (row && state.view === "promptEdit" && !event.relatedTarget?.closest?.("#promptEditView")) renderPromptEdit();
}

function commitPromptEditor(editor) {
  const row = getRow(state.activeId);
  const field = editor.dataset.field;
  if (!row || !EDITABLE_COLUMNS.has(field)) return;
  const value = promptEditorText(editor);
  if ((row[field] || "") === value) return;
  const key = promptEditorKey(editor);
  const session = state.promptEditSessions.get(key);
  if (!session?.historyPushed) {
    pushHistory();
    if (session) session.historyPushed = true;
  }
  if (field === "image_prompt") setActivePrompt(row.id, row.row_type, "image", value);
  if (field === "video_prompt") setActivePrompt(row.id, row.row_type, "video", value);
  row[field] = value;
  syncRowsFromJsonState();
  markDirty();
  renderStatus(validate());
  renderPrompt();
}

function renderPromptEditorPreview(field, text) {
  const preview = el.promptEdit?.querySelector(`[data-preview-field="${field}"]`);
  if (preview) {
    const row = getRow(state.activeId);
    if (row) {
      preview.innerHTML = promptReferenceStripHtml(row, field);
      bindPromptReferenceControls(preview);
      resolvePromptMediaPreviews(preview);
      resolvePromptReferencePreviews(preview);
    }
  }
}

function retokenizePromptEditor(editor) {
  if (!editor?.isConnected || document.activeElement !== editor || isPromptEditorComposing(editor)) return;
  const text = promptEditorText(editor);
  const offset = promptEditorSelectionOffset(editor);
  editor.innerHTML = tokenizePromptText(text);
  bindPromptPathTokens(editor);
  restorePromptEditorSelection(editor, offset);
}

function promptEditorText(editor) {
  if (editor?.tagName === "TEXTAREA") return normalizePromptEditorText(editor.value);
  return normalizePromptEditorText(promptEditorPlainText(editor));
}

function promptEditorPlainText(root) {
  let text = "";
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue || "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
      if (!node.dataset.promptFiller) text += "\n";
      return;
    }
    const isBlock = node.nodeType === Node.ELEMENT_NODE && node !== root && /^(DIV|P|LI)$/i.test(node.tagName);
    if (isBlock && text && !text.endsWith("\n")) text += "\n";
    node.childNodes.forEach(walk);
    if (isBlock && text && !text.endsWith("\n")) text += "\n";
  };
  root.childNodes.forEach(walk);
  return text.replace(/\u00a0/g, " ");
}

function normalizePromptEditorText(text) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
}

function promptEditorOffsetForDomPosition(editor, node, offset) {
  if (!node || !editor.contains(node)) return promptEditorText(editor).length;
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.setEnd(node, offset);
  return promptEditorPlainText(range.cloneContents()).replace(/\r\n/g, "\n").replace(/\r/g, "\n").length;
}

function promptEditorSelectionOffsets(editor) {
  const selection = window.getSelection();
  const textLength = promptEditorText(editor).length;
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return { start: textLength, end: textLength };
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return { start: textLength, end: textLength };
  const start = promptEditorOffsetForDomPosition(editor, range.startContainer, range.startOffset);
  const end = promptEditorOffsetForDomPosition(editor, range.endContainer, range.endOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function insertPromptEditorText(editor, insertText) {
  if (!editor) return;
  const text = promptEditorText(editor);
  const range = promptEditorSelectionOffsets(editor);
  const next = `${text.slice(0, range.start)}${insertText}${text.slice(range.end)}`;
  editor.innerHTML = tokenizePromptText(next);
  bindPromptPathTokens(editor);
  restorePromptEditorSelection(editor, range.start + insertText.length);
  editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: insertText }));
}

function promptEditorKey(editor) {
  return `${state.activeId}:${editor.dataset.field || ""}`;
}

function pastePlainText(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") || "";
  insertPromptEditorText(event.currentTarget, text.replace(/\r\n/g, "\n"));
}

function extractPromptMediaPaths(text) {
  const seen = new Set();
  return mediaPathMatches(text)
    .map((match) => match.path)
    .filter((path) => {
      const key = path.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mediaPathMatches(text) {
  const source = String(text || "");
  const mediaExt = /\.(png|jpe?g|webp|gif|svg|wav|mp3|m4a|aac|ogg|flac)(?:$|[?#])/i;
  const matches = [];
  let token = "";
  let tokenStart = 0;
  const flush = (end) => {
    if (!token) return;
    const trimmed = trimPromptMediaPath(token);
    const path = trimmed.path;
    if (path && (mediaExt.test(path) || /^data:(image|audio)\//i.test(path) || /^blob:/i.test(path))) {
      matches.push({ path, index: tokenStart + trimmed.offset, end: tokenStart + trimmed.offset + path.length });
    }
    token = "";
  };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (isPromptPathBoundary(char)) {
      flush(index);
      continue;
    }
    if (!token) tokenStart = index;
    token += char;
  }
  flush(source.length);
  return matches;
}

function trimPromptMediaPath(path) {
  const leading = path.match(/^[([{「『"'`]+/)?.[0] || "";
  const trailing = path.match(/[)\]}」』"',.;:!?。、`]+$/)?.[0] || "";
  return { path: path.slice(leading.length, path.length - trailing.length), offset: leading.length };
}

function isPromptPathBoundary(char) {
  return /[\s<>]/u.test(char);
}

function promptMediaKind(path) {
  if (/^data:image\//i.test(path)) return "image";
  if (/^data:audio\//i.test(path)) return "audio";
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(path) ? "image" : "audio";
}

function showPromptHoverPreview(event, path) {
  const preview = el.promptEdit?.querySelector(".prompt-hover-preview");
  if (!preview || !path) return;
  preview.innerHTML = promptMediaCardHtml(path, true);
  preview.hidden = false;
  positionPromptHoverPreview(event);
  resolvePromptMediaPath(path).then(() => {
    if (!preview.hidden) preview.innerHTML = promptMediaCardHtml(path, true);
  });
}

function positionPromptHoverPreview(event) {
  const preview = el.promptEdit?.querySelector(".prompt-hover-preview");
  if (!preview || preview.hidden) return;
  const bounds = el.promptEdit.getBoundingClientRect();
  const x = Math.min(event.clientX - bounds.left + 14, bounds.width - 230);
  const y = Math.min(event.clientY - bounds.top + 14, bounds.height - 180);
  preview.style.left = `${Math.max(10, x)}px`;
  preview.style.top = `${Math.max(10, y)}px`;
}

function hidePromptHoverPreview() {
  const preview = el.promptEdit?.querySelector(".prompt-hover-preview");
  if (preview) preview.hidden = true;
}

function attachAssetAutocomplete(target) {
  if (!target) return;
  target.addEventListener("keydown", handleAssetSuggestKeydown);
  if (target.isContentEditable) target.addEventListener("beforeinput", () => setTimeout(() => updateAssetSuggest(target), 0));
  target.addEventListener("input", () => updateAssetSuggest(target));
  target.addEventListener("keyup", () => updateAssetSuggest(target));
  target.addEventListener("blur", () => setTimeout(() => {
    if (state.assetSuggest?.target === target) closeAssetSuggest();
  }, 120));
}

function updateAssetSuggest(target) {
  if (target?.isContentEditable && isPromptEditorComposing(target)) return closeAssetSuggest();
  const context = assetSuggestContext(target);
  if (!context) return closeAssetSuggest();
  const matches = assetSuggestionMatches(context.query);
  if (!matches.length) return closeAssetSuggest();
  renderAssetSuggest(target, context, matches);
}

function assetSuggestContext(target) {
  const text = target.isContentEditable ? promptEditorText(target) : target.value;
  const cursor = target.isContentEditable ? promptEditorSelectionOffset(target) : target.selectionStart;
  if (cursor == null) return null;
  const before = text.slice(0, cursor);
  const match = before.match(/@([\p{L}\p{N}_-]*)$/u);
  if (!match) return null;
  const start = cursor - match[0].length;
  if (start > 0 && !isAssetSuggestBoundary(text[start - 1])) return null;
  return { text, start, end: cursor, query: match[1] || "" };
}

function isAssetSuggestBoundary(char) {
  return /[\s"'`([{<>,.:;!?、。・「」『』【】（）]/u.test(char);
}

function assetSuggestionMatches(query) {
  const normalized = query.toLowerCase();
  const seen = new Set();
  return state.assets
    .filter((asset) => asset.path)
    .filter((asset) => {
      const key = assetSuggestKey(asset).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return !normalized || key.startsWith(normalized) || asset.title?.toLowerCase().includes(normalized) || asset.path?.toLowerCase().includes(normalized);
    })
    .slice(0, 8);
}

function assetSuggestKey(asset) {
  return safeAssetAlias(asset.title || fileStem(asset.path) || asset.id);
}

function renderAssetSuggest(target, context, matches) {
  closeAssetSuggest();
  const popup = document.createElement("div");
  popup.className = "asset-suggest";
  const rect = assetSuggestAnchorRect(target) || target.getBoundingClientRect();
  popup.style.left = `${Math.max(8, rect.left + 12)}px`;
  popup.style.top = `${Math.min(window.innerHeight - 180, rect.top + 30)}px`;
  popup.innerHTML = matches.map((asset, index) => `
    <button type="button" data-suggest-index="${index}"${index === 0 ? " class=\"active\"" : ""}>
      <strong>@${escapeHtml(assetSuggestKey(asset))}</strong>
      <span>${escapeHtml(asset.title || asset.path)}</span>
    </button>`).join("");
  popup.querySelectorAll("button").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applyAssetSuggestion(target, context, matches[Number(button.dataset.suggestIndex)]);
    });
  });
  document.body.appendChild(popup);
  state.assetSuggest = { popup, target, context, matches, index: 0 };
}

function assetSuggestAnchorRect(target) {
  if (!target?.isContentEditable) return null;
  const selection = window.getSelection();
  if (!selection?.rangeCount || !target.contains(selection.anchorNode)) return null;
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);
  const rect = range.getBoundingClientRect?.();
  return rect && (rect.width || rect.height) ? rect : null;
}

function handleAssetSuggestKeydown(event) {
  const suggest = state.assetSuggest;
  if (!suggest || suggest.target !== event.target) return false;
  if (event.key === "Escape") {
    closeAssetSuggest();
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    suggest.index = (suggest.index + (event.key === "ArrowDown" ? 1 : -1) + suggest.matches.length) % suggest.matches.length;
    suggest.popup.querySelectorAll("button").forEach((button, index) => button.classList.toggle("active", index === suggest.index));
    event.preventDefault();
    return true;
  }
  if (event.key === "Enter" || event.key === "Tab") {
    const context = assetSuggestContext(suggest.target) || suggest.context;
    const matches = assetSuggestionMatches(context.query);
    applyAssetSuggestion(suggest.target, context, matches[suggest.index] || suggest.matches[suggest.index]);
    event.preventDefault();
    return true;
  }
  return false;
}

function applyAssetSuggestion(target, context, asset) {
  if (!asset) return;
  if (target?.isContentEditable) delete target.dataset.composing;
  if (target.isContentEditable) {
    const text = promptEditorText(target);
    const end = assetSuggestReplacementEnd(text, context.end);
    const next = `${text.slice(0, context.start)}${asset.path}${text.slice(end)}`;
    target.innerHTML = tokenizePromptText(next);
    bindPromptPathTokens(target);
    restorePromptEditorSelection(target, context.start + asset.path.length);
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: asset.path }));
  } else {
    const end = assetSuggestReplacementEnd(context.text, context.end);
    target.value = `${context.text.slice(0, context.start)}${asset.path}${context.text.slice(end)}`;
    target.setSelectionRange(context.start + asset.path.length, context.start + asset.path.length);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }
  closeAssetSuggest();
}

function assetSuggestReplacementEnd(text, end) {
  let cursor = end;
  while (/[\p{L}\p{N}_-]/u.test(text[cursor] || "")) cursor += 1;
  return cursor;
}

function closeAssetSuggest() {
  state.assetSuggest?.popup?.remove();
  state.assetSuggest = null;
}

function bindPromptPathTokens(root = el.promptEdit) {
  root?.querySelectorAll(".prompt-path-token").forEach((token) => {
    token.addEventListener("mouseenter", (event) => showPromptHoverPreview(event, token.dataset.path || ""));
    token.addEventListener("mousemove", (event) => positionPromptHoverPreview(event));
    token.addEventListener("mouseleave", hidePromptHoverPreview);
  });
}

function promptMediaResolution(path) {
  if (!path) return null;
  if (state.promptPreviewUrls.has(path)) return state.promptPreviewUrls.get(path);
  if (state.mediaUrls.has(path)) return { status: "ready", url: state.mediaUrls.get(path), kind: promptMediaKind(path) };
  if (isBrowserSafeMediaPath(path)) return { status: "ready", url: path, kind: promptMediaKind(path) };
  return null;
}

async function resolvePromptMediaPreviews(root = el.promptEdit) {
  const cards = [...(root?.querySelectorAll?.(".prompt-media-card[data-path]:not(.prompt-reference-card)") || [])];
  await Promise.all(cards.map((card) => resolvePromptMediaPath(card.dataset.path || "")));
  cards.forEach((card) => {
    const path = card.dataset.path || "";
    card.outerHTML = promptMediaCardHtml(path, card.classList.contains("compact"));
  });
}

async function resolvePromptReferencePreviews(root = el.promptEdit) {
  const cards = [...(root?.querySelectorAll?.(".prompt-reference-card[data-path]") || [])];
  await Promise.all(cards.map((card) => resolvePromptMediaPath(card.dataset.path || "")));
  cards.forEach((card) => {
    const path = card.dataset.path || "";
    const body = card.querySelector(".prompt-media-thumb, .prompt-media-audio");
    if (body) body.outerHTML = promptMediaCardBodyHtml(path);
    card.classList.toggle("missing", promptMediaResolution(path)?.status === "missing");
  });
}

async function resolvePromptMediaPath(path) {
  if (!path || state.promptPreviewUrls.has(path) || state.mediaUrls.has(path) || isBrowserSafeMediaPath(path)) return promptMediaResolution(path);
  if (!tauriInvoke || !state.projectPath) {
    state.promptPreviewUrls.set(path, { status: "missing", url: "", kind: promptMediaKind(path) });
    return state.promptPreviewUrls.get(path);
  }
  try {
    const opened = normalizeTauriFile(await readPromptMediaFile(path));
    const blob = new Blob([new Uint8Array(opened.bytes || [])], { type: mimeFromPath(path) });
    const url = URL.createObjectURL(blob);
    state.promptPreviewUrls.set(path, { status: "ready", url, kind: promptMediaKind(path) });
    state.mediaPathStatus.set(path, "exists");
  } catch {
    state.promptPreviewUrls.set(path, { status: "missing", url: "", kind: promptMediaKind(path) });
    state.mediaPathStatus.set(path, "missing");
  }
  return state.promptPreviewUrls.get(path);
}

async function readPromptMediaFile(path) {
  let lastError = null;
  for (const candidate of promptMediaReadCandidates(path)) {
    try {
      return await tauriInvoke("read_media_file", {
        projectPath: state.projectPath,
        project_path: state.projectPath,
        mediaPath: candidate,
        media_path: candidate,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("media not found");
}

function promptMediaReadCandidates(path) {
  const candidates = [path];
  const slashPath = String(path || "").replace(/\\/g, "/");
  if (slashPath && slashPath !== path) candidates.push(slashPath);
  return candidates;
}

function isBrowserSafeMediaPath(path) {
  return /^(https?:|blob:|data:)/i.test(path);
}

function promptEditorSelectionOffset(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return promptEditorText(editor).length;
  return promptEditorOffsetForDomPosition(editor, selection.anchorNode, selection.anchorOffset);
}

function restorePromptEditorSelection(editor, offset) {
  const range = document.createRange();
  const point = promptEditorDomPointForOffset(editor, offset);
  range.setStart(point.node, point.offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function promptEditorDomPointForOffset(editor, offset) {
  let remaining = Math.max(0, offset);
  const childIndex = (node) => Array.prototype.indexOf.call(node.parentNode?.childNodes || [], node);
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.nodeValue?.length || 0;
      if (remaining <= length) return { node, offset: remaining };
      remaining -= length;
      return null;
    }
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
      const parent = node.parentNode || editor;
      const index = childIndex(node);
      if (remaining <= 0) return { node: parent, offset: index };
      remaining -= 1;
      if (remaining <= 0) {
        if (node.nextSibling?.nodeType === Node.TEXT_NODE) return { node: node.nextSibling, offset: 0 };
        const textNode = document.createTextNode("");
        parent.insertBefore(textNode, node.nextSibling);
        return { node: textNode, offset: 0 };
      }
      return null;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return null;
    for (const child of node.childNodes) {
      const point = walk(child);
      if (point) return point;
    }
    return null;
  };
  return walk(editor) || { node: editor, offset: editor.childNodes.length };
}

function renderValidation(issues) {
  if (!issues.length) {
    el.validation.innerHTML = `<div class="issue">${iconHtml("fact_check")}<span>No validation issues.</span></div>`;
    return;
  }
  el.validation.innerHTML = `<div class="issues">${issues
    .map((issue) => `<div class="issue ${issue.level}">${iconHtml(issue.level === "error" ? "fact_check" : "image_not_supported")}<span>${escapeHtml(issue.message)}</span></div>`)
    .join("")}</div>`;
}

function togglePanel(panel) {
  if (state.panelCollapsed.has(panel)) state.panelCollapsed.delete(panel);
  else state.panelCollapsed.add(panel);
  renderPanels();
}

function toggleRightPanel() {
  state.rightPanelCollapsed = !state.rightPanelCollapsed;
  renderPanels();
}

function renderPanels() {
  document.querySelector(".app-shell")?.classList.toggle("right-collapsed", state.rightPanelCollapsed);
  document.querySelector("#rightPanelToggle")?.setAttribute("aria-expanded", String(!state.rightPanelCollapsed));
  document.querySelectorAll(".right-section").forEach((section) => {
    const collapsed = state.panelCollapsed.has(section.dataset.panel);
    section.classList.toggle("collapsed", collapsed);
    section.querySelector(".panel-toggle")?.setAttribute("aria-expanded", String(!collapsed));
  });
}

function selectRow(id, event = {}) {
  rememberAddOverlayAnchor(event);
  const rows = filteredRows();
  if (event.shiftKey && state.selectionAnchorId) {
    const anchorIndex = rows.findIndex((row) => row.id === state.selectionAnchorId);
    const targetIndex = rows.findIndex((row) => row.id === id);
    if (anchorIndex >= 0 && targetIndex >= 0) {
      const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
      state.selectedIds = new Set(rows.slice(start, end + 1).map((row) => row.id));
    } else {
      state.selectedIds = new Set([id]);
      state.selectionAnchorId = id;
    }
  } else if (event.ctrlKey || event.metaKey) {
    if (state.selectedIds.has(id)) state.selectedIds.delete(id);
    else state.selectedIds.add(id);
    if (!state.selectionAnchorId) state.selectionAnchorId = id;
  } else {
    state.selectedIds.clear();
    state.selectedIds.add(id);
    state.selectionAnchorId = id;
  }
  state.activeId = id;
  render();
}

function clearSelection() {
  if (!state.activeId && !state.selectedIds.size) return;
  state.activeId = "";
  state.selectedIds.clear();
  state.selectionAnchorId = "";
  state.addOverlayAnchor = null;
  render();
}

function tableSelectionClass(row) {
  const selected = tableVisualSelectedIds();
  if (!selected.has(row.id)) return "";
  const rows = filteredRows();
  const index = rows.findIndex((item) => item.id === row.id);
  const previousSelected = index > 0 && selected.has(rows[index - 1].id);
  const nextSelected = index >= 0 && index < rows.length - 1 && selected.has(rows[index + 1].id);
  const classes = ["selection-range"];
  if (row.id === state.activeId) classes.push("selection-active");
  if (!previousSelected && !nextSelected) classes.push("selection-single");
  else if (!previousSelected) classes.push("selection-start");
  else if (!nextSelected) classes.push("selection-end");
  else classes.push("selection-middle");
  return classes.join(" ");
}

function tableVisualSelectedIds() {
  const ids = new Set(state.selectedIds);
  const active = getRow(state.activeId);
  if (ids.size === 1 && active?.row_type === "multicut" && ids.has(active.id)) {
    state.rows
      .filter((row) => row.row_type === "cut" && row.parent_id === active.id)
      .forEach((cut) => ids.add(cut.id));
  }
  return ids;
}

function toggleCollapse(id) {
  if (state.collapsed.has(id)) state.collapsed.delete(id);
  else state.collapsed.add(id);
  renderTree();
}

function setView(view) {
  const previousView = state.view;
  state.view = view;
  if (previousView !== view) renderCurrentView();
  document.querySelectorAll(".view-btn").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view-pane").forEach((pane) => pane.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  if (view === "timeline" && previousView !== "timeline") {
    requestAnimationFrame(centerTimelineOnPlayhead);
  }
}

function updateRow(id, patch) {
  const row = getRow(id);
  if (!row) return;
  pushHistory();
  invalidateRowMediaPatchStatus(row, patch);
  if (row.row_type === "cut") {
    if (Object.hasOwn(patch, "image")) setActiveGeneratedMedia(row.id, "image", patch.image);
    if (Object.hasOwn(patch, "audio_file")) setActiveGeneratedMedia(row.id, "audio", patch.audio_file);
    if (Object.hasOwn(patch, "video_file")) setActiveGeneratedMedia(row.id, "video", patch.video_file);
  }
  if (Object.hasOwn(patch, "image_prompt")) setActivePrompt(row.id, row.row_type, "image", patch.image_prompt);
  if (Object.hasOwn(patch, "video_prompt")) setActivePrompt(row.id, row.row_type, "video", patch.video_prompt);
  Object.assign(row, patch);
  syncRowsFromJsonState();
  markDirty();
  render();
}

function invalidateRowMediaPatchStatus(row, patch) {
  ["image", "audio_file", "video_file"].forEach((field) => {
    if (!Object.hasOwn(patch, field)) return;
    invalidateMediaPathStatus(row[field]);
    invalidateMediaPathStatus(patch[field]);
  });
}

function addRow(type) {
  pushHistory();
  const id = nextId(type);
  const row = blankRow(type, id);
  const active = getRow(state.activeId);
  if (type === "scene") {
    row.order = String(nextOrder(state.rows.filter((item) => item.row_type === "scene")));
  }
  if (type === "multicut") {
    const scene = active?.row_type === "scene" ? active : getAncestor(active, "scene") || state.rows.find((item) => item.row_type === "scene");
    if (!scene) return alert("scene is required.");
    row.parent_id = scene.id;
    row.order = String(nextOrder(siblingsOf(row)));
  }
  if (type === "cut") {
    const parent = active?.row_type === "scene" || active?.row_type === "multicut" ? active : getRow(active?.parent_id) || state.rows.find((item) => item.row_type === "scene");
    if (!parent) return alert("scene is required.");
    row.parent_id = parent.id;
    row.order = String(nextOrder(siblingsOf(row)));
    row.duration = "3s";
  }
  state.rows.push(row);
  state.activeId = row.id;
  state.selectedIds.clear();
  state.selectedIds.add(row.id);
  state.selectionAnchorId = row.id;
  markDirty();
  render();
}
function addInitialRow(type) {
  pushHistory();
  let selectedRow = null;
  const scene = blankRow("scene", nextId("scene"));
  scene.order = "1";
  if (type === "scene") {
    state.rows.push(scene);
    selectedRow = scene;
  } else if (type === "multicut") {
    const multicut = blankRow("multicut", nextId("multicut"));
    multicut.parent_id = scene.id;
    multicut.order = "1";
    state.rows.push(scene, multicut);
    selectedRow = multicut;
  } else {
    const cut = blankRow("cut", nextId("cut"));
    cut.parent_id = scene.id;
    cut.order = "1";
    cut.duration = "3s";
    state.rows.push(scene, cut);
    selectedRow = cut;
  }
  normalizeOrders();
  state.activeId = selectedRow.id;
  state.selectedIds = new Set([selectedRow.id]);
  state.selectionAnchorId = selectedRow.id;
  markDirty();
  render();
}

function addRowBelow(type) {
  const active = getRow(state.activeId);
  if (!active) return;
  pushHistory();
  const row = blankRow(type, nextId(type));
  let selectedRow = row;

  if (type === "scene") {
    insertSceneAfter(row, active);
  } else if (type === "multicut") {
    insertMulticutAfter(row, active);
  } else if (type === "cut") {
    selectedRow = insertCutAfter(row, active);
  }

  normalizeOrders();
  state.activeId = selectedRow.id;
  state.selectedIds = new Set([selectedRow.id]);
  state.selectionAnchorId = selectedRow.id;
  markDirty();
  render();
}

function insertSceneAfter(row, active) {
  const scene = active.row_type === "scene" ? active : getAncestor(active, "scene");
  const scenes = state.rows.filter((item) => item.row_type === "scene").sort(sortByOrder);
  const index = Math.max(0, scenes.findIndex((item) => item.id === scene?.id)) + 1;
  state.rows.push(row);
  insertIntoOrderedGroup(row, scenes, index);
}

function insertMulticutAfter(row, active) {
  const scene = active.row_type === "scene" ? active : getAncestor(active, "scene");
  if (!scene) return;
  row.parent_id = scene.id;
  const children = sceneChildren(scene.id);
  let index = 0;
  if (active.row_type === "scene") index = children.length;
  if (active.row_type === "multicut") index = children.findIndex((item) => item.id === active.id) + 1;
  if (active.row_type === "cut") {
    const parent = getRow(active.parent_id);
    index = parent?.row_type === "scene"
      ? children.findIndex((item) => item.id === active.id) + 1
      : children.findIndex((item) => item.id === parent?.id) + 1;
  }
  state.rows.push(row);
  insertIntoOrderedGroup(row, children, Math.max(0, index));
}

function insertCutAfter(row, active) {
  const parent = active.row_type === "scene" || active.row_type === "multicut" ? active : getRow(active.parent_id);
  if (!parent || !["scene", "multicut"].includes(parent.row_type)) return row;
  row.parent_id = parent.id;
  row.duration = "3s";
  const siblings = siblingsOf(row).sort(sortByOrder);
  const index = active.row_type === "cut" ? siblings.findIndex((item) => item.id === active.id) + 1 : siblings.length;
  state.rows.push(row);
  insertIntoOrderedGroup(row, siblings, Math.max(0, index));
  return row;
}

function sceneChildren(sceneId) {
  return state.rows
    .filter((item) => {
      const parent = getRow(item.parent_id);
      return parent?.id === sceneId && (item.row_type === "multicut" || item.row_type === "cut");
    })
    .sort(sortByOrder);
}

function insertIntoOrderedGroup(row, group, index) {
  const rows = group.filter((item) => item.id !== row.id);
  rows.splice(Math.max(0, Math.min(index, rows.length)), 0, row);
  rows.forEach((item, order) => {
    item.order = String(order + 1);
  });
}

function blankRow(type, id) {
  const row = Object.fromEntries(COLUMNS.map((column) => [column, ""]));
  row.row_type = type;
  row.id = id;
  row.title = type === "cut" ? "New Cut" : type === "multicut" ? "New Multicut" : "New Scene";
  return row;
}

function selectedRowsOfType(type) {
  return [...state.selectedIds].map(getRow).filter((row) => row?.row_type === type);
}

function selectedRows() {
  const selected = new Set(state.selectedIds);
  return hierarchyRows().filter((row) => selected.has(row.id));
}

function deleteSelectedRows() {
  const rows = selectedRows();
  if (!rows.length) return;
  closeContextMenu();
  pushHistory();
  const ordered = hierarchyRows();
  const firstIndex = ordered.findIndex((row) => row.id === rows[0].id);
  const deleteIds = new Set();
  const selectedIds = new Set(rows.map((row) => row.id));
  rows.forEach((row) => {
    const parent = getRow(row.parent_id);
    if (parent?.row_type === "scene" && selectedIds.has(parent.id)) return;
    if (parent?.row_type === "multicut" && selectedIds.has(parent.id)) return;
    if (row.row_type === "scene") collectDescendantIds(row, deleteIds);
    else if (row.row_type === "multicut") {
      ungroupMulticut(row);
      deleteIds.add(row.id);
    } else {
      deleteIds.add(row.id);
    }
  });
  state.rows = state.rows.filter((row) => !deleteIds.has(row.id));
  normalizeOrders();
  const remaining = hierarchyRows();
  const next = remaining[Math.min(firstIndex, remaining.length - 1)] || null;
  state.activeId = next?.id || "";
  state.selectedIds = next ? new Set([next.id]) : new Set();
  state.selectionAnchorId = state.activeId;
  markDirty();
  render();
}

function ungroupSelectionFromShortcut() {
  const multicuts = selectedRowsOfType("multicut");
  if (!multicuts.length) return;
  closeContextMenu();
  pushHistory();
  const first = multicuts[0];
  multicuts.forEach((multicut) => {
    ungroupMulticut(multicut);
    state.rows = state.rows.filter((row) => row.id !== multicut.id);
  });
  normalizeOrders();
  const next = hierarchyRows().find((row) => row.parent_id === first.parent_id) || getRow(first.parent_id);
  state.activeId = next?.id || "";
  state.selectedIds = next ? new Set([next.id]) : new Set();
  state.selectionAnchorId = state.activeId;
  markDirty();
  render();
}

function ungroupMulticut(multicut) {
  const scene = getRow(multicut.parent_id);
  if (!scene || scene.row_type !== "scene") return;
  const children = state.rows.filter((row) => row.row_type === "cut" && row.parent_id === multicut.id).sort(sortByOrder);
  if (!children.length) return;
  const sceneRows = sceneChildren(scene.id).filter((row) => row.id !== multicut.id);
  const insertAt = Math.max(0, sceneChildren(scene.id).findIndex((row) => row.id === multicut.id));
  children.forEach((cut) => {
    cut.parent_id = scene.id;
  });
  sceneRows.splice(insertAt, 0, ...children);
  sceneRows.forEach((row, index) => {
    row.order = String(index + 1);
  });
}

function collectDescendantIds(row, ids) {
  if (!row || ids.has(row.id)) return;
  ids.add(row.id);
  if (row.row_type === "scene") {
    sceneChildren(row.id).forEach((item) => collectDescendantIds(item, ids));
  }
  if (row.row_type === "multicut") {
    state.rows.filter((item) => item.row_type === "cut" && item.parent_id === row.id).forEach((item) => collectDescendantIds(item, ids));
  }
}

function duplicateSelectedRows() {
  const roots = selectedDuplicateRoots();
  if (!roots.length) return;
  closeContextMenu();
  pushHistory();
  const created = [];
  roots.forEach((row) => duplicateRowTree(row, created));
  normalizeOrders();
  const first = created[0];
  state.activeId = first?.id || "";
  state.selectedIds = new Set(created.map((row) => row.id));
  state.selectionAnchorId = state.activeId;
  markDirty();
  render();
}

function selectedDuplicateRoots() {
  const selected = new Set(state.selectedIds);
  return selectedRows().filter((row) => {
    const parent = getRow(row.parent_id);
    return !parent || !selected.has(parent.id);
  });
}

function duplicateRowTree(row, created, parentOverride = null) {
  const copy = cloneRow(row, parentOverride ?? row.parent_id);
  state.rows.push(copy);
  const group = state.rows.filter((item) => item.row_type === copy.row_type && (item.parent_id || "") === (copy.parent_id || "")).sort(sortByOrder);
  const originalIndex = parentOverride == null ? group.findIndex((item) => item.id === row.id) + 1 : group.length;
  insertIntoOrderedGroup(copy, group, Math.max(0, originalIndex));
  created.push(copy);
  if (row.row_type === "scene") {
    sceneChildren(row.id).forEach((child) => duplicateRowTree(child, created, copy.id));
  }
  if (row.row_type === "multicut") {
    state.rows
      .filter((item) => item.row_type === "cut" && item.parent_id === row.id)
      .sort(sortByOrder)
      .forEach((child) => duplicateRowTree(child, created, copy.id));
  }
  return copy;
}

function cloneRow(row, parentId) {
  const copy = { ...row };
  copy.id = nextId(row.row_type);
  copy.parent_id = parentId || "";
  return copy;
}

function showRowContextMenu(event, row) {
  event.preventDefault();
  event.stopPropagation();
  if (!state.selectedIds.has(row.id)) {
    state.selectedIds = new Set([row.id]);
    state.activeId = row.id;
    state.selectionAnchorId = row.id;
    render();
  }
  const cutCount = selectedRowsOfType("cut").length;
  const multicutCount = selectedRowsOfType("multicut").length;
  const canGroupCuts = row.row_type === "cut" && state.selectedIds.has(row.id) && cutCount >= 2;
  const canGroupMulticuts = row.row_type === "multicut" && state.selectedIds.has(row.id) && multicutCount >= 2;
  const canUngroupMulticut = row.row_type === "multicut" && state.selectedIds.has(row.id);
  closeContextMenu();
  const menu = document.createElement("div");
  menu.className = "table-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  if (canGroupCuts) menu.appendChild(contextMenuButton("Create Multicut", groupCuts, "dynamic_feed"));
  if (canGroupMulticuts) menu.appendChild(contextMenuButton("Create Scene", groupMulticuts, "movie_creation"));
  if (canUngroupMulticut) menu.appendChild(contextMenuButton("Ungroup Multicut", ungroupSelectionFromShortcut, "call_split"));
  menu.appendChild(contextMenuButton("Copy ID", copySelectedIds, "content_copy"));
  menu.appendChild(contextMenuButton("Duplicate", duplicateSelectedRows, "file_copy"));
  menu.appendChild(contextMenuButton("Delete", deleteSelectedRows, "delete"));
  document.body.appendChild(menu);
  state.contextMenu = menu;
}

function contextMenuButton(label, action, icon = "content_copy") {
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `${iconHtml(icon)}<span class="icon-button-label">${escapeHtml(label)}</span>`;
  button.addEventListener("click", (clickEvent) => {
    clickEvent.stopPropagation();
    closeContextMenu();
    action();
  });
  return button;
}

function closeContextMenu() {
  state.contextMenu?.remove();
  state.contextMenu = null;
}

function copySelectedIds() {
  const ids = selectedRows().map((row) => row.id).filter(Boolean);
  navigator.clipboard?.writeText(ids.join("\n"));
}

function groupSelectionFromShortcut() {
  if (!["table", "timeline"].includes(state.view)) return;
  if (selectedRowsOfType("cut").length >= 2) {
    groupCuts();
    return;
  }
  if (selectedRowsOfType("multicut").length >= 2) groupMulticuts();
}

function groupCuts() {
  const cuts = selectedRowsOfType("cut");
  if (cuts.length < 2) return alert("Select at least 2 cuts.");
  const scene = getAncestor(cuts[0], "scene");
  if (!scene || cuts.some((cut) => getAncestor(cut, "scene")?.id !== scene.id)) return alert("Cuts must be in the same scene.");
  pushHistory();
  const mc = blankRow("multicut", nextId("multicut"));
  mc.parent_id = scene.id;
  mc.title = "Grouped Multicut";
  const selectedIds = new Set(cuts.map((cut) => cut.id));
  const children = sceneChildren(scene.id).filter((row) => !selectedIds.has(row.id));
  const firstSceneChildIndex = Math.max(0, Math.min(...cuts.map((cut) => {
    const parent = getRow(cut.parent_id);
    const sceneChild = parent?.row_type === "scene" ? cut : parent;
    return sceneChildren(scene.id).findIndex((row) => row.id === sceneChild?.id);
  }).filter((index) => index >= 0)));
  state.rows.push(mc);
  insertIntoOrderedGroup(mc, children, Number.isFinite(firstSceneChildIndex) ? firstSceneChildIndex : children.length);
  cuts.sort(sortByOrder).forEach((cut, index) => {
    cut.parent_id = mc.id;
    cut.order = String(index + 1);
  });
  normalizeOrders();
  state.activeId = mc.id;
  state.selectedIds = new Set([mc.id]);
  state.selectionAnchorId = mc.id;
  markDirty();
  render();
}

function groupMulticuts() {
  const multicuts = selectedRowsOfType("multicut");
  if (multicuts.length < 2) return alert("Select at least 2 multicuts.");
  pushHistory();
  const scene = blankRow("scene", nextId("scene"));
  scene.title = "Grouped Scene";
  scene.order = String(nextOrder(state.rows.filter((row) => row.row_type === "scene")));
  state.rows.push(scene);
  multicuts.sort(sortByOrder).forEach((multicut, index) => {
    multicut.parent_id = scene.id;
    multicut.order = String(index + 1);
  });
  normalizeOrders();
  state.activeId = scene.id;
  state.selectedIds = new Set([scene.id]);
  state.selectionAnchorId = scene.id;
  markDirty();
  render();
}

function normalizeOrders() {
  normalizeRowOrders(state.rows);
}

function handleDragStart(event, row) {
  state.draggingId = row.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.id);
  }
}

function handleDragOver(event, target) {
  if (hasFilePayload(event.dataTransfer)) {
    clearDropClasses();
    event.preventDefault();
    if (target.row_type === "cut") event.currentTarget.classList.add("media-drop-target");
    return;
  }
  const dragged = getRow(event.dataTransfer?.getData("text/plain") || state.draggingId);
  if (!dragged || dragged.id === target.id) return;
  const mode = dropMode(event, dragged, target);
  clearDropClasses();
  if (!mode) return;
  event.preventDefault();
  event.currentTarget.classList.add(`drop-${mode}`);
}

function handleDrop(event, target) {
  if (hasFilePayload(event.dataTransfer)) {
    event.preventDefault();
    handleMediaDrop(event, target);
    return;
  }
  const dragged = getRow(event.dataTransfer?.getData("text/plain") || state.draggingId);
  const mode = dragged ? dropMode(event, dragged, target) : "";
  const timelineFlip = event.currentTarget?.classList?.contains("timeline-clip") ? captureTimelineFlip() : null;
  const storyboardFlip = event.currentTarget?.closest?.(".storyboard") ? captureStoryboardFlip() : null;
  clearDropClasses();
  if (!dragged || !mode || dragged.id === target.id) return;
  const draggedRows = dragRowsForDrop(dragged, target);
  if (!draggedRows.length) return;
  event.preventDefault();
  pushHistory();
  if (draggedRows.length > 1) moveRows(draggedRows, target, mode);
  else moveRow(dragged, target, mode);
  normalizeOrders();
  state.activeId = draggedRows[0].id;
  state.selectedIds = new Set(draggedRows.map((row) => row.id));
  state.selectionAnchorId = dragged.id;
  markDirty();
  render();
  if (timelineFlip) requestAnimationFrame(() => animateTimelineFlip(timelineFlip, dragged.id));
  if (storyboardFlip) requestAnimationFrame(() => animateStoryboardFlip(storyboardFlip, dragged.id));
}

function dragRowsForDrop(dragged, target) {
  const selectedCuts = selectedRowsOfType("cut");
  if (dragged.row_type === "cut" && state.selectedIds.has(dragged.id) && selectedCuts.length > 1) {
    const targetSelected = target.row_type === "cut" && state.selectedIds.has(target.id);
    if (targetSelected) return [];
    return selectedRows().filter((row) => row.row_type === "cut");
  }
  return [dragged];
}

function hasFilePayload(dataTransfer) {
  if (!dataTransfer) return false;
  if (dataTransfer.files?.length) return true;
  if (Array.from(dataTransfer.items || []).some((item) => item.kind === "file")) return true;
  return Array.from(dataTransfer.types || []).includes("Files");
}

function handleMediaDrop(event, target) {
  clearDropClasses();
  if (target.row_type !== "cut") return;
  const files = [...(event.dataTransfer?.files || [])];
  const image = files.find(isImageFile);
  const audio = files.find(isAudioFile);
  if (!image && !audio) return;
  const patch = {};
  if (image) {
    patch.image = mediaPathFromDroppedFile(image);
    setSessionMediaUrl(patch.image, image);
  }
  if (audio) {
    patch.audio_file = mediaPathFromDroppedFile(audio);
    setSessionMediaUrl(patch.audio_file, audio);
  }
  updateRow(target.id, patch);
  state.activeId = target.id;
  state.selectedIds = new Set([target.id]);
  state.selectionAnchorId = target.id;
  render();
}

function mediaPathFromDroppedFile(file) {
  const rawPath = normalizeAssetPathSeparators(file.path || "");
  return tauriInvoke && rawPath && isAbsoluteAssetPath(rawPath) ? rawPath : file.name;
}

function setSessionMediaUrl(path, file) {
  const previous = state.mediaUrls.get(path);
  if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
  state.mediaUrls.set(path, URL.createObjectURL(file));
  state.mediaPathStatus.set(path, "exists");
}

function isImageFile(file) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
}

function isAudioFile(file) {
  return file.type.startsWith("audio/") || /\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(file.name);
}

function dropMode(event, dragged, target) {
  const beforeAfter = event.currentTarget?.classList?.contains("timeline-clip")
    ? event.offsetX < event.currentTarget.clientWidth / 2
    : event.offsetY < event.currentTarget.clientHeight / 2;
  const shiftDrop = event.shiftKey || state.shiftDown;
  if (dragged.row_type === "scene" && target.row_type === "scene") return beforeAfter ? "before" : "after";
  if (dragged.row_type === "multicut") {
    if (target.row_type === "scene") return "into";
    if (target.row_type === "multicut") return beforeAfter ? "before" : "after";
    if (target.row_type === "cut") return beforeAfter ? "before" : "after";
  }
  if (dragged.row_type === "cut") {
    if (target.row_type === "scene") return "into";
    if (target.row_type === "multicut") return shiftDrop ? (beforeAfter ? "before" : "after") : "into";
    if (target.row_type === "cut") return beforeAfter ? "before" : "after";
  }
  return "";
}

function moveRow(dragged, target, mode) {
  if (mode === "into") {
    dragged.parent_id = target.id;
    dragged.order = String(nextOrder(siblingsOf(dragged)));
    return;
  }
  dragged.parent_id = dropSiblingParentId(dragged, target);
  const siblings = dropSiblingsForTarget(dragged, target).filter((row) => row.id !== dragged.id).sort(sortByOrder);
  const targetIndex = siblings.findIndex((row) => row.id === dropAnchorId(dragged, target));
  const insertAt = mode === "before" ? targetIndex : targetIndex + 1;
  siblings.splice(insertAt, 0, dragged);
  siblings.forEach((row, index) => {
    row.order = String(index + 1);
  });
}

function moveRows(rows, target, mode) {
  const movingIds = new Set(rows.map((row) => row.id));
  const parentId = mode === "into" ? target.id : dropSiblingParentId(rows[0], target);
  rows.forEach((row) => {
    row.parent_id = parentId;
  });
  const siblings = dropSiblingsForTarget(rows[0], target).filter((row) => !movingIds.has(row.id)).sort(sortByOrder);
  let insertAt = siblings.length;
  if (mode !== "into") {
    const targetIndex = siblings.findIndex((row) => row.id === dropAnchorId(rows[0], target));
    insertAt = mode === "before" ? targetIndex : targetIndex + 1;
  }
  siblings.splice(Math.max(0, insertAt), 0, ...rows);
  siblings.forEach((row, index) => {
    row.order = String(index + 1);
  });
}

function dropSiblingParentId(dragged, target) {
  if (dragged.row_type === "multicut" && target.row_type === "cut") {
    const targetParent = getRow(target.parent_id);
    return targetParent?.row_type === "multicut" ? targetParent.parent_id : target.parent_id;
  }
  return target.parent_id;
}

function dropSiblingsForTarget(dragged, target) {
  if (dragged.row_type === "multicut" && target.row_type === "cut") {
    const sceneId = dropSiblingParentId(dragged, target);
    return sceneChildren(sceneId);
  }
  return siblingsOf(dragged);
}

function dropAnchorId(dragged, target) {
  if (dragged.row_type === "multicut" && target.row_type === "cut") {
    const targetParent = getRow(target.parent_id);
    return targetParent?.row_type === "multicut" ? targetParent.id : target.id;
  }
  return target.id;
}

function siblingsOf(row) {
  const key = orderGroupKey(row);
  return state.rows.filter((candidate) => orderGroupKey(candidate) === key);
}

function clearDropClasses() {
  document.querySelectorAll(".drop-before, .drop-after, .drop-into, .media-drop-target").forEach((row) => {
    row.classList.remove("drop-before", "drop-after", "drop-into", "media-drop-target");
  });
}

function clearDragState() {
  state.draggingId = "";
  document.querySelectorAll(".dragging").forEach((item) => item.classList.remove("dragging"));
  clearDropClasses();
}

function captureTimelineFlip() {
  const positions = new Map();
  document.querySelectorAll(".timeline-clip[data-id]").forEach((clip) => {
    positions.set(clip.dataset.id, clip.getBoundingClientRect());
  });
  return positions;
}

function animateTimelineFlip(previous, movedId) {
  document.querySelectorAll(".timeline-clip[data-id]").forEach((clip) => {
    animateFlipElement(clip, previous, movedId);
  });
}

function captureStoryboardFlip() {
  const positions = new Map();
  document.querySelectorAll(".storyboard [data-id]").forEach((item) => {
    positions.set(item.dataset.id, item.getBoundingClientRect());
  });
  return positions;
}

function animateStoryboardFlip(previous, movedId) {
  document.querySelectorAll(".storyboard [data-id]").forEach((item) => {
    animateFlipElement(item, previous, movedId);
  });
}

function animateFlipElement(element, previous, movedId) {
  const before = previous.get(element.dataset.id);
  if (!before) return;
  const after = element.getBoundingClientRect();
  const dx = before.left - after.left;
  const dy = before.top - after.top;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    element.classList.add("flip-animating");
    element.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: 260, easing: "cubic-bezier(.2, .8, .2, 1)" },
    ).addEventListener("finish", () => element.classList.remove("flip-animating"), { once: true });
  }
  if (element.dataset.id === movedId) {
    element.classList.add("moved");
    setTimeout(() => element.classList.remove("moved"), 520);
  }
}

function validate() {
  const issues = state.importWarnings.map((message) => warn(message));
  const ids = new Set();
  state.rows.forEach((row, index) => {
    COLUMNS.slice(0, 4).forEach((column) => {
      if (column !== "parent_id" && !row[column]) issues.push(error(`Row ${index + 2}: required column ${column} is empty.`));
    });
    if (!["scene", "multicut", "cut"].includes(row.row_type)) issues.push(error(`${row.id}: invalid row_type ${row.row_type}.`));
    if (ids.has(row.id)) issues.push(error(`${row.id}: duplicate id.`));
    ids.add(row.id);
  });
  state.rows.forEach((row) => {
    const parent = getRow(row.parent_id);
    if (row.row_type === "scene" && row.parent_id) issues.push(error(`${row.id}: scene parent_id must be empty.`));
    if (row.row_type === "multicut" && (!parent || parent.row_type !== "scene")) issues.push(error(`${row.id}: multicut parent_id must reference scene.`));
    if (row.row_type === "cut" && (!parent || !["scene", "multicut"].includes(parent.row_type))) issues.push(error(`${row.id}: cut parent_id must reference scene or multicut.`));
    if (row.row_type === "cut" && durationSeconds(row.duration) <= 0) issues.push(warn(`${row.id}: invalid duration, default 3s will be used.`));
    if (row.row_type === "cut" && isMissingMediaPath(row.image)) issues.push({ level: "warning", kind: "missing-media", message: `${row.id}: image may be missing (${row.image}).` });
    if (row.row_type === "cut" && isMissingMediaPath(row.audio_file)) issues.push({ level: "warning", kind: "missing-media", message: `${row.id}: audio may be missing (${row.audio_file}).` });
    if (row.row_type === "cut" && isMissingMediaPath(row.video_file)) issues.push({ level: "warning", kind: "missing-media", message: `${row.id}: video may be missing (${row.video_file}).` });
  });
  const assetIds = new Set();
  state.assets.forEach((asset, index) => {
    if (!asset.id) issues.push(error(`Asset ${index + 1}: id is required.`));
    if (asset.id && assetIds.has(asset.id)) issues.push(error(`${asset.id}: duplicate asset id.`));
    if (asset.id) assetIds.add(asset.id);
    if (!asset.path) issues.push(warn(`Asset ${asset.id || index + 1}: path is empty.`));
    if (isMissingMediaPath(asset.path)) issues.push({ level: "warning", kind: "missing-media", message: `Asset ${asset.id || index + 1}: asset may be missing (${asset.path}).` });
  });
  const promptIds = new Set(state.prompts.map((prompt) => prompt.id).filter(Boolean));
  const activeMediaKeys = new Set();
  state.generatedMedia.forEach((item) => {
    if (!getRow(item.cutId)) issues.push(error(`${item.id}: cutId does not exist (${item.cutId}).`));
    if (item.sourcePromptId && !promptIds.has(item.sourcePromptId)) issues.push(error(`${item.id}: sourcePromptId does not exist (${item.sourcePromptId}).`));
    item.referenceAssetIds.forEach((assetId) => {
      if (!assetIds.has(assetId)) issues.push(error(`${item.id}: referenceAssetId does not exist (${assetId}).`));
    });
    if (isMissingMediaPath(item.path)) issues.push({ level: "warning", kind: "missing-media", message: `${item.id}: generated media may be missing (${item.path}).` });
    if (item.isActive) {
      const key = `${item.cutId}:${item.type}`;
      if (activeMediaKeys.has(key)) issues.push(error(`${item.cutId}: multiple active ${item.type} generated media items.`));
      activeMediaKeys.add(key);
    }
  });
  const activePromptKeys = new Set();
  state.prompts.forEach((prompt) => {
    const owner = getRow(prompt.ownerId);
    if (!owner || owner.row_type !== prompt.ownerType) issues.push(error(`${prompt.id}: ownerId does not exist or ownerType is invalid (${prompt.ownerId}).`));
    prompt.linkedAssetIds.forEach((assetId) => {
      if (!assetIds.has(assetId)) issues.push(error(`${prompt.id}: linkedAssetId does not exist (${assetId}).`));
    });
    if (prompt.isActive) {
      const key = `${prompt.ownerId}:${prompt.kind}`;
      if (activePromptKeys.has(key)) issues.push(error(`${prompt.ownerId}: multiple active ${prompt.kind} prompts.`));
      activePromptKeys.add(key);
    }
  });
  return issues;
}

function error(message) {
  return { level: "error", kind: "structure", message };
}

function warn(message) {
  return { level: "warning", kind: "structure", message };
}

function effectivePrompts(row) {
  const chain = row.row_type === "cut" ? [getAncestor(row, "scene"), getAncestor(row, "multicut"), row] : row.row_type === "multicut" ? [getAncestor(row, "scene"), row] : [row];
  return {
    image: chain.map((item) => item ? activePromptText(item.id, "image") || item.image_prompt : "").filter(Boolean).join("\n"),
    video: chain.map((item) => item ? activePromptText(item.id, "video") || item.video_prompt : "").filter(Boolean).join("\n"),
  };
}

function getAncestor(row, type) {
  let current = row;
  while (current?.parent_id) {
    current = getRow(current.parent_id);
    if (current?.row_type === type) return current;
  }
  return null;
}

function getRow(id) {
  return state.rows.find((row) => row.id === id);
}

function nextId(type) {
  const prefix = { scene: "sc", multicut: "mc", cut: "ct" }[type];
  const max = state.rows
    .filter((row) => row.id?.startsWith(prefix))
    .map((row) => Number(row.id.slice(prefix.length)) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function nextOrder(rows) {
  return rows.map((row) => Number(row.order) || 0).reduce((a, b) => Math.max(a, b), 0) + 1;
}

function durationSeconds(value) {
  const text = String(value || "").trim();
  if (!text) return 3;
  const match = text.match(/^(\d+(?:\.\d+)?)\s*s?$/i);
  return match ? Number(match[1]) : 3;
}

function computedDuration(row) {
  if (!row) return 0;
  if (row.row_type === "cut") return durationSeconds(row.duration);
  if (row.row_type === "multicut") {
    return state.rows
      .filter((cut) => cut.row_type === "cut" && cut.parent_id === row.id)
      .reduce((sum, cut) => sum + computedDuration(cut), 0);
  }
  if (row.row_type === "scene") {
    return sceneChildren(row.id).reduce((sum, child) => sum + computedDuration(child), 0);
  }
  return 0;
}

function displayDuration(row) {
  return formatDuration(computedDuration(row));
}

function formatDuration(seconds) {
  const rounded = Math.round((Number(seconds) || 0) * 10) / 10;
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}s`;
}

function isMissingMediaPath(path) {
  if (!path || pathExistsWithoutCheck(path)) return false;
  return state.mediaPathStatus.get(path) === "missing";
}

function pathExistsWithoutCheck(path) {
  return isBrowserSafeMediaPath(path) || isInternalProjectMediaPath(path) || state.mediaUrls.has(path) || state.mediaBlobs.has(path);
}

function shouldCheckMediaPath(path) {
  return Boolean(tauriInvoke && path && !pathExistsWithoutCheck(path));
}

function collectMediaPathsForStatusCheck() {
  const paths = new Set();
  state.rows.forEach((row) => {
    if (row.row_type !== "cut") return;
    [row.image, row.audio_file, row.video_file].forEach((path) => {
      if (shouldCheckMediaPath(path)) paths.add(path);
    });
  });
  state.assets.forEach((asset) => {
    if (shouldCheckMediaPath(asset.path)) paths.add(asset.path);
  });
  state.generatedMedia.forEach((item) => {
    if (shouldCheckMediaPath(item.path)) paths.add(item.path);
  });
  return [...paths];
}

function scheduleMediaPathStatusChecks() {
  if (!tauriInvoke) return;
  const pending = collectMediaPathsForStatusCheck().filter((path) => !state.mediaPathStatus.has(path));
  if (!pending.length) return;
  pending.forEach((path) => state.mediaPathStatus.set(path, "checking"));
  const runId = ++state.mediaPathStatusRunId;
  Promise.all(pending.map(async (path) => {
    try {
      const exists = await tauriInvoke("path_exists", { path });
      return [path, exists ? "exists" : "missing"];
    } catch {
      return [path, "missing"];
    }
  })).then((results) => {
    if (runId < state.mediaPathStatusRunId) return;
    let changed = false;
    results.forEach(([path, status]) => {
      if (state.mediaPathStatus.get(path) !== status) {
        state.mediaPathStatus.set(path, status);
        changed = true;
      }
    });
    if (changed) renderAfterMediaPathStatusUpdate();
  });
}

function renderAfterMediaPathStatusUpdate() {
  const issues = validate();
  renderStatus(issues);
  renderValidation(issues);
  renderMedia();
  if (state.view === "assets") renderAssets();
  if (state.view === "promptEdit") renderPromptEdit();
}

function invalidateMediaPathStatus(path = "") {
  if (path) state.mediaPathStatus.delete(path);
  else clearMediaPathStatus();
}

function clearMediaPathStatus() {
  state.mediaPathStatus = new Map();
  state.mediaPathStatusRunId += 1;
}

function mediaUrl(path) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return state.mediaUrls.get(path) || "";
}

function displayMediaUrl(path) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return state.mediaUrls.get(path) || encodeURI(path);
}

function markDirty() {
  state.dirty = true;
}

function pushHistory() {
  state.undo.push(JSON.stringify(historySnapshot()));
  if (state.undo.length > 100) state.undo.shift();
  state.redo = [];
}

function historySnapshot() {
  return {
    rows: state.rows,
    assets: state.assets,
    generatedMedia: state.generatedMedia,
    prompts: state.prompts,
    agentsText: state.agentsText,
  };
}

function restoreHistorySnapshot(snapshot) {
  const parsed = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
  if (Array.isArray(parsed)) {
    state.rows = parsed;
    return;
  }
  state.rows = parsed.rows || [];
  state.assets = parsed.assets || state.assets;
  state.generatedMedia = parsed.generatedMedia || [];
  state.prompts = parsed.prompts || [];
  state.agentsText = parsed.agentsText ?? state.agentsText;
  syncRowsFromJsonState();
}

function undo() {
  const snapshot = state.undo.pop();
  if (!snapshot) return;
  state.redo.push(JSON.stringify(historySnapshot()));
  restoreHistorySnapshot(snapshot);
  markDirty();
  render();
}

function redo() {
  const snapshot = state.redo.pop();
  if (!snapshot) return;
  state.undo.push(JSON.stringify(historySnapshot()));
  restoreHistorySnapshot(snapshot);
  markDirty();
  render();
}

function exportTsv() {
  const name = `${safeName(state.manifest.projectName)}_cutlist.tsv`;
  const content = serializeTsv();
  if (tauriInvoke) return exportFile(name, content, "tsv");
  downloadText(name, content, "text/tab-separated-values;charset=utf-8");
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

function exportLlmTsv() {
  const name = `${safeName(state.manifest.projectName)}_llm.tsv`;
  const content = serializeLlmTsv();
  if (tauriInvoke) return exportFile(name, content, "llm");
  downloadText(name, content, "text/tab-separated-values;charset=utf-8");
}

async function exportProject() {
  const bytes = await projectArchiveBytes();
  downloadBlob(`${safeName(state.manifest.projectName)}.lctproj`, new Blob([bytes], { type: "application/zip" }));
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

async function saveProject() {
  if (!tauriInvoke || !state.projectPath) return saveProjectAs();
  const bytes = await projectArchiveBytes();
  const saved = await tauriInvoke("save_project", { path: state.projectPath, bytes: [...bytes] });
  if (!saved) return;
  const savedFile = normalizeTauriFile(saved);
  rememberRecentProject(savedFile.fileName || state.projectFileName, savedFile.path || state.projectPath);
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

async function saveProjectAs() {
  if (!tauriInvoke) return exportProject();
  const bytes = await projectArchiveBytes();
  const saved = await tauriInvoke("save_project_as", {
    defaultName: `${safeName(state.manifest.projectName)}.lctproj`,
    bytes: [...bytes],
  });
  if (!saved) return;
  const savedFile = normalizeTauriFile(saved);
  state.projectPath = savedFile.path || state.projectPath;
  state.projectFileName = savedFile.fileName || state.projectFileName;
  rememberRecentProject(state.projectFileName, state.projectPath);
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

async function exportFile(defaultName, content, kind) {
  const saved = await tauriInvoke("export_file", { defaultName, content, kind });
  if (!saved) return;
  if (kind === "tsv") {
    state.dirty = false;
    state.lastSaved = new Date().toLocaleTimeString();
  }
  render();
}

async function createProjectBackup(reason = "manual", options = {}) {
  if (!tauriInvoke || !state.projectPath) {
    if (!options.silent) alert("Open or save a .lctproj project before creating a backup.");
    return null;
  }
  const stamp = backupTimestamp();
  const backupName = `${safeName(state.manifest.projectName || state.projectFileName || "Project")}_${stamp}_${reason}.lctproj`;
  const bytes = await projectArchiveBytes();
  const saved = await tauriInvoke("save_project_backup", {
    projectPath: state.projectPath,
    project_path: state.projectPath,
    backupName,
    backup_name: backupName,
    bytes: [...bytes],
    maxBackups: MAX_PROJECT_BACKUPS,
    max_backups: MAX_PROJECT_BACKUPS,
  });
  const fileName = normalizeTauriFile(saved).fileName || backupName;
  if (options.notify === "toast") showToast(`${t("toast.autoBackup")}: ${fileName}`);
  else if (!options.silent) alert(`Backup created: ${fileName}`);
  return saved;
}

function showToast(message, options = {}) {
  const duration = options.duration ?? 5000;
  let toast = document.querySelector(".app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  clearTimeout(showToast.timer);
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("visible"));
  showToast.timer = setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      if (!toast.classList.contains("visible")) toast.hidden = true;
    }, 180);
  }, duration);
}

async function checkForAppUpdate(options = {}) {
  if (!tauriUpdater?.check || updateCheckStarted) return;
  updateCheckStarted = true;
  try {
    const update = await tauriUpdater.check();
    if (!update) {
      if (options.notify) showToast(t("toast.updateNotAvailable"));
      return;
    }
    const version = update.version || update.currentVersion || "";
    const message = t("update.available").replace("{version}", version || "new");
    if (!confirm(message)) return;
    if (typeof update.downloadAndInstall === "function") await update.downloadAndInstall();
    else if (typeof update.download === "function" && typeof update.install === "function") {
      await update.download();
      await update.install();
    } else {
      throw new Error("Updater API does not expose an install method.");
    }
    showToast(t("toast.updateInstalled"));
    if (tauriProcess?.relaunch) await tauriProcess.relaunch();
  } catch (error) {
    console.warn("Update check failed", error);
    if (options.notify) alert(error?.message ? `${t("update.failed")}\n${error.message}` : t("update.failed"));
  } finally {
    updateCheckStarted = false;
  }
}

async function restoreProjectBackup() {
  if (!tauriInvoke || !state.projectPath) {
    alert("Open or save a .lctproj project before restoring a backup.");
    return;
  }
  const backups = await tauriInvoke("list_project_backups", { projectPath: state.projectPath, project_path: state.projectPath });
  if (!backups?.length) {
    alert("No backups found.");
    return;
  }
  const list = backups.map((backup, index) => `${index + 1}. ${backup.name || backup.file_name}`).join("\n");
  const choice = prompt(`Select backup number to restore:\n\n${list}`, "1");
  const index = Number(choice) - 1;
  const backup = backups[index];
  if (!backup) return;
  if (!confirm(`Restore ${backup.name || backup.file_name}? Current project state will be backed up first.`)) return;
  await createProjectBackup("before-restore", { silent: true });
  const opened = normalizeTauriFile(await tauriInvoke("read_project_backup", {
    projectPath: state.projectPath,
    project_path: state.projectPath,
    backupName: backup.name || backup.file_name,
    backup_name: backup.name || backup.file_name,
  }));
  await loadProjectFromBytes(new Uint8Array(opened.bytes || []), state.projectFileName || opened.fileName, state.projectPath);
  state.dirty = true;
  render();
}

async function repairFileLinks() {
  if (!tauriInvoke || !state.projectPath) {
    alert("Open a saved .lctproj project to repair file links.");
    return;
  }
  const missing = await collectMissingFileLinks();
  if (!missing.length) {
    alert("No broken file links found.");
    return;
  }
  const root = normalizeTauriFile(await tauriInvoke("pick_repair_root"));
  if (!root?.path) return;
  const names = [...new Set(missing.map((item) => fileNameFromPath(item.path)).filter(Boolean))];
  const found = await tauriInvoke("find_files_by_names", { root: root.path, names });
  const replacements = new Map();
  (found || []).forEach((item) => {
    const paths = item.paths || [];
    if (paths.length) replacements.set(String(item.name || "").toLowerCase(), normalizeAssetPathSeparators(paths[0]));
  });
  if (!missing.some((item) => replacements.has(fileNameFromPath(item.path).toLowerCase()))) {
    alert(`No matching files were found under:\n${root.path}`);
    return;
  }
  await createProjectBackup("before-repair-links", { silent: true });
  const applied = applyFileLinkRepairs(missing, replacements);
  if (!applied) {
    alert(`No matching files were found under:\n${root.path}`);
    return;
  }
  markDirty();
  syncRowsFromJsonState();
  render();
  alert(`Repaired ${applied} file link${applied === 1 ? "" : "s"}.`);
}

async function collectMissingFileLinks() {
  const candidates = collectFileLinkReferences();
  const missing = [];
  for (const item of candidates) {
    if (shouldSkipFileLinkRepair(item.path)) continue;
    try {
      const exists = await tauriInvoke("path_exists", { path: item.path });
      if (!exists) missing.push(item);
    } catch {
      missing.push(item);
    }
  }
  return missing;
}

function collectFileLinkReferences() {
  const refs = [];
  state.rows.forEach((row) => {
    ["image", "audio_file", "video_file"].forEach((field) => {
      if (row[field]) refs.push({ kind: "row", row, field, path: row[field] });
    });
  });
  state.assets.forEach((asset) => {
    if (asset.path) refs.push({ kind: "asset", asset, path: asset.path });
  });
  state.generatedMedia.forEach((item) => {
    if (item.path) refs.push({ kind: "generated", item, path: item.path });
  });
  return refs;
}

function shouldSkipFileLinkRepair(path) {
  if (!path || isBrowserSafeMediaPath(path)) return true;
  return isInternalProjectMediaPath(path);
}

function isInternalProjectMediaPath(path) {
  const normalized = normalizeAssetPathSeparators(path);
  return normalized.startsWith("media/");
}

function applyFileLinkRepairs(missing, replacements) {
  const appliedPaths = new Set();
  missing.forEach((ref) => {
    const name = fileNameFromPath(ref.path).toLowerCase();
    const replacement = replacements.get(name);
    if (!replacement || replacement === ref.path) return;
    invalidateMediaPathStatus(ref.path);
    invalidateMediaPathStatus(replacement);
    if (ref.kind === "row") ref.row[ref.field] = replacement;
    if (ref.kind === "asset") {
      ref.asset.path = replacement;
      ref.asset.type = assetTypeFromPath(replacement);
    }
    if (ref.kind === "generated") {
      ref.item.path = replacement;
      ref.item.type = mediaTypeFromPath(replacement);
    }
    appliedPaths.add(ref.path);
  });
  return appliedPaths.size;
}

async function repairCurrentTsv() {
  await createProjectBackup("before-repair", { silent: true });
  await repairTsvTextIntoState(serializeTsv(), state.manifest.projectName || "Repaired TSV", "Repair Current TSV");
}

function repairTsvFile() {
  state.pendingRepairTsvFile = true;
  el.input.accept = ".tsv,.txt";
  el.input.click();
  el.input.accept = ".lctproj,.tsv,.txt";
}

async function repairTsvTextIntoState(text, name, label) {
  await createProjectBackup("before-repair", { silent: true });
  const repaired = repairTsvText(text);
  pushHistory();
  state.rows = repaired.rows;
  state.importWarnings = repaired.warnings;
  state.manifest = {
    ...state.manifest,
    projectName: state.projectPath ? state.manifest.projectName : name || state.manifest.projectName,
  };
  preserveSelectionAfterRowsRefresh();
  state.dirty = true;
  renderAfterRowsRefresh();
  alert(`${label}: repaired ${state.rows.length} rows with ${repaired.warnings.length} warning(s).`);
}

function backupTimestamp(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}${String(date.getMilliseconds()).padStart(3, "0")}`;
}

async function projectArchiveBytes(options = {}) {
  const sourceManifest = options.manifest || state.manifest;
  const sourceRows = options.rows || state.rows;
  const sourceAssets = options.assets || state.assets;
  const sourceGeneratedMedia = options.generatedMedia || state.generatedMedia;
  const sourcePrompts = options.prompts || state.prompts;
  const sourceAgentsText = options.agentsText ?? state.agentsText ?? PROJECT_AGENTS_MD;
  const sourceMediaBlobs = options.mediaBlobs || state.mediaBlobs;
  const collapsed = options.collapsed || [...state.collapsed];
  const activeId = options.activeId ?? state.activeId;
  const view = options.view || state.view;
  syncRowsFromJsonState(sourceRows);
  const cutlist = sourceRows.length ? serializeTsv(sourceRows) : emptyProjectTsv();
  const manifest = {
    ...sourceManifest,
    projectName: sourceManifest.projectName || "Untitled Project",
    mainCutlist: "cutlist.tsv",
    timeline: "timeline.json",
    settings: "settings.json",
    assets: "assets.json",
    generate: "generate.json",
    prompts: "prompts.json",
  };
  const files = new Map([
    ["manifest.json", JSON.stringify(manifest, null, 2)],
    ["cutlist.tsv", cutlist],
    ["AGENTS.md", sourceAgentsText],
    ["timeline.json", JSON.stringify({ collapsed, activeId }, null, 2)],
    ["settings.json", JSON.stringify({ view }, null, 2)],
    ["assets.json", JSON.stringify({ format: "LocalCutBoardAssets", formatVersion: "1.0.0", assets: normalizeAssets(sourceAssets) }, null, 2)],
    ["generate.json", JSON.stringify({ format: "LocalCutBoardGeneratedMedia", formatVersion: "1.0.0", items: normalizeGeneratedMedia(sourceGeneratedMedia) }, null, 2)],
    ["prompts.json", JSON.stringify({ format: "LocalCutBoardPrompts", formatVersion: "1.0.0", prompts: normalizePrompts(sourcePrompts) }, null, 2)],
    ["media_index.json", JSON.stringify({ media: sourceRows.filter((row) => row.row_type === "cut").map((row) => ({ id: row.id, image: row.image, audio_file: row.audio_file, video_file: row.video_file })) }, null, 2)],
  ]);
  for (const [path, mediaBlob] of sourceMediaBlobs.entries()) {
    files.set(path, new Uint8Array(await mediaBlob.arrayBuffer()));
  }
  return createZip(files);
}

function exportPremiereXml() {
  const xml = buildPremiereXml();
  const name = `${safeName(state.manifest.projectName)}_premiere.xml`;
  if (tauriInvoke) return exportFile(name, xml, "xml");
  downloadText(name, xml, "application/xml;charset=utf-8");
}

function buildPremiereXml() {
  const fps = Number(state.manifest.sequence?.frameRate || 30);
  const cuts = state.rows.filter((row) => row.row_type === "cut").sort(sortByGlobalTimeline);
  let frame = 0;
  const clips = [];
  const markers = [];
  state.rows.filter((row) => row.row_type !== "cut").forEach((row) => {
    const promptRow = rowWithJsonValues(row);
    markers.push(`<marker><name>${xmlEscape(row.title || row.id)}</name><comment>${xmlEscape([promptRow.image_prompt, promptRow.video_prompt, row.note].filter(Boolean).join("\n"))}</comment><in>${frame}</in><out>${frame}</out></marker>`);
  });
  cuts.forEach((cut, index) => {
    const duration = Math.round(durationSeconds(cut.duration) * fps);
    const start = frame;
    const end = frame + duration;
    const name = xmlEscape(rowLabel(cut));
    if (cut.image) {
      clips.push(`<clipitem id="image-${index + 1}"><name>${name}</name><start>${start}</start><end>${end}</end><in>0</in><out>${duration}</out><file id="file-image-${index + 1}"><name>${xmlEscape(cut.image)}</name><pathurl>${xmlEscape(pathToFileUrl(cut.image))}</pathurl></file></clipitem>`);
    } else {
      markers.push(`<marker><name>${name}</name><comment>${xmlEscape(effectivePrompts(cut).image || effectivePrompts(cut).video)}</comment><in>${start}</in><out>${end}</out></marker>`);
    }
    if (cut.audio_file) {
      clips.push(`<clipitem id="audio-${index + 1}"><name>${name} audio</name><start>${start}</start><end>${end}</end><in>0</in><out>${duration}</out><file id="file-audio-${index + 1}"><name>${xmlEscape(cut.audio_file)}</name><pathurl>${xmlEscape(pathToFileUrl(cut.audio_file))}</pathurl></file></clipitem>`);
    }
    frame = end;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>${xmlEscape(state.manifest.projectName || "Prepro Project")}</name>
    <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
    <duration>${frame}</duration>
    ${markers.join("\n    ")}
    <media>
      <video><track>${clips.filter((clip) => clip.includes("image-")).join("\n        ")}</track></video>
      <audio><track>${clips.filter((clip) => clip.includes("audio-")).join("\n        ")}</track></audio>
    </media>
  </sequence>
</xmeml>`;
}

function pathToFileUrl(path) {
  if (/^file:|^https?:/.test(path)) return path;
  return `file:///${path.replace(/\\/g, "/")}`;
}

function downloadText(name, content, type) {
  downloadBlob(name, new Blob([content], { type }));
}

function downloadBlob(name, blob) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(name) {
  return String(name || "prepro-project").replace(/[\\/:*?"<>|]+/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function xmlEscape(value) {
  return escapeHtml(value);
}

function formatRecentTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function currentPlaybackTime() {
  if (!state.playing) return state.playOffset;
  return state.playOffset + (performance.now() - state.playStartedAt) / 1000;
}

function togglePlayback() {
  if (state.playing) {
    stopPlayback(currentPlaybackTime());
  } else {
    const total = timelineModel().total;
    if (state.playOffset >= total) state.playOffset = 0;
    state.playing = true;
    state.playStartedAt = performance.now();
    schedulePlaybackFrame();
  }
  updateTimelinePlaybackUi();
}

function schedulePlaybackFrame() {
  cancelAnimationFrame(state.raf);
  const tick = () => {
    if (!state.playing) return;
    const total = timelineModel().total;
    if (currentPlaybackTime() >= total) {
      stopPlayback(0);
      updateTimelinePlaybackUi();
      return;
    }
    updateTimelinePlaybackUi();
    state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
}

function stopPlayback(offset = state.playOffset) {
  state.playOffset = Math.max(0, offset);
  state.playing = false;
  cancelAnimationFrame(state.raf);
  document.querySelector("#timelineAudio")?.pause();
}

function setPlaybackOffset(offset) {
  const total = timelineModel().total;
  state.playOffset = clamp(offset, 0, total);
  if (state.playing) state.playStartedAt = performance.now();
  updateTimelinePlaybackUi();
}

function syncTimelineAudio(cut, offset) {
  const audio = document.querySelector("#timelineAudio");
  if (!audio || !cut || !state.playing) {
    if (audio) audio.pause();
    state.timelinePreviewCutId = cut?.id || "";
    return;
  }
  if (state.timelinePreviewCutId !== cut.id || Math.abs(audio.currentTime - offset) > 0.35) {
    audio.currentTime = Math.max(0, offset);
  }
  state.timelinePreviewCutId = cut.id;
  audio.play().catch(() => {});
}

function isTextEntryTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return ["input", "textarea", "select"].includes(tag) || target?.isContentEditable;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((content, name) => {
    const fileName = encoder.encode(name);
    const data = content instanceof Uint8Array ? content : typeof content === "string" ? encoder.encode(content) : new Uint8Array();
    const crc = crc32(data);
    const local = new Uint8Array(30 + fileName.length + data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(8, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, fileName.length, true);
    local.set(fileName, 30);
    local.set(data, 30 + fileName.length);
    chunks.push(local);
    const entry = new Uint8Array(46 + fileName.length);
    const entryView = new DataView(entry.buffer);
    entryView.setUint32(0, 0x02014b50, true);
    entryView.setUint16(4, 20, true);
    entryView.setUint16(6, 20, true);
    entryView.setUint32(16, crc, true);
    entryView.setUint32(20, data.length, true);
    entryView.setUint32(24, data.length, true);
    entryView.setUint16(28, fileName.length, true);
    entryView.setUint32(42, offset, true);
    entry.set(fileName, 46);
    central.push(entry);
    offset += local.length;
  });
  const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.size, true);
  endView.setUint16(10, files.size, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return concatUint8([...chunks, ...central, end]);
}

async function readZipEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const entries = new Map();
  const endOffset = findEndOfCentralDirectory(view);
  if (endOffset < 0) throw new Error("ZIP central directory was not found.");
  const diskNumber = view.getUint16(endOffset + 4, true);
  const centralDisk = view.getUint16(endOffset + 6, true);
  if (diskNumber || centralDisk) throw new Error("Multi-disk ZIP files are not supported.");
  const entryCount = view.getUint16(endOffset + 10, true);
  if (entryCount === 0xffff) throw new Error("Zip64 projects are not supported.");
  const centralSize = view.getUint32(endOffset + 12, true);
  let offset = view.getUint32(endOffset + 16, true);
  if (centralSize === 0xffffffff || offset === 0xffffffff) throw new Error("Zip64 projects are not supported.");
  if (offset + centralSize > bytes.length) throw new Error("ZIP central directory is out of bounds.");
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new Error("ZIP central directory is broken.");
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    if (compressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error("Zip64 projects are not supported.");
    if (flags & 1) throw new Error("Encrypted ZIP entries are not supported.");
    const nameStart = offset + 46;
    const name = normalizeZipPath(new TextDecoder().decode(bytes.slice(nameStart, nameStart + fileNameLength)));
    if (!name.endsWith("/")) {
      if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("ZIP local file header is broken.");
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      if (dataStart + compressedSize > bytes.length) throw new Error("ZIP entry data is out of bounds.");
      const data = bytes.slice(dataStart, dataStart + compressedSize);
      const inflated = await unzipData(data, method);
      entries.set(name, {
        data: inflated,
        method,
        compressedSize,
        uncompressedSize: inflated.byteLength,
      });
    }
    offset = nameStart + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function findEndOfCentralDirectory(view) {
  const minOffset = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) !== 0x06054b50) continue;
    const commentLength = view.getUint16(offset + 20, true);
    if (offset + 22 + commentLength === view.byteLength) return offset;
  }
  return -1;
}

async function unzipData(data, method) {
  if (method === 0) return data;
  if (method === 8 && "DecompressionStream" in window) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  throw new Error(`ZIP compression method ${method} is not supported.`);
}

function decodeZipText(entry) {
  return entry ? new TextDecoder().decode(entry.data) : "";
}

function decodeTsvBytes(bytes) {
  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      encoding: "utf-8",
    };
  } catch {
    return {
      text: new TextDecoder("shift_jis").decode(bytes),
      encoding: "shift_jis",
    };
  }
}

function seedSampleMedia() {
  [
    ["media/images/cut001.jpg", "#d7ff57", "MICRO"],
    ["media/images/cut002.jpg", "#6fd2ff", "EYES"],
    ["media/images/cut003.jpg", "#ff6b5f", "ALERT"],
  ].forEach(([path, color, label]) => {
    const blob = new Blob([sampleSvg(color, label)], { type: "image/svg+xml" });
    state.mediaBlobs.set(path, blob);
    state.mediaUrls.set(path, URL.createObjectURL(blob));
  });
  ["media/audio/cut001.wav", "media/audio/cut003.wav"].forEach((path) => {
    const blob = sampleWavBlob();
    state.mediaBlobs.set(path, blob);
    state.mediaUrls.set(path, URL.createObjectURL(blob));
  });
}

function revokeMediaUrls() {
  state.mediaUrls.forEach((url) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  });
  state.promptPreviewUrls.forEach((item) => {
    if (item?.url?.startsWith("blob:")) URL.revokeObjectURL(item.url);
  });
  state.promptPreviewUrls.clear();
}

function sampleSvg(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#111310"/>
  <rect x="36" y="36" width="888" height="468" fill="#181b17" stroke="${color}" stroke-width="6"/>
  <circle cx="230" cy="270" r="138" fill="${color}" opacity=".16"/>
  <path d="M112 398 C248 122 432 438 592 172 S778 408 868 148" fill="none" stroke="${color}" stroke-width="10"/>
  <text x="88" y="130" fill="${color}" font-family="Segoe UI, sans-serif" font-size="42" font-weight="800">${label}</text>
  <text x="88" y="444" fill="#eef1e8" font-family="Segoe UI, sans-serif" font-size="24">Prepro sample media</text>
</svg>`;
}

function sampleWavBlob() {
  const sampleRate = 8000;
  const seconds = 0.4;
  const samples = sampleRate * seconds;
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < samples; i += 1) {
    const value = Math.sin((i / sampleRate) * Math.PI * 2 * 440) * 0.18;
    view.setInt16(44 + i * 2, value * 32767, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

function mimeFromPath(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  return "application/octet-stream";
}

function concatUint8(arrays) {
  const total = arrays.reduce((sum, item) => sum + item.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((item) => {
    out.set(item, offset);
    offset += item.length;
  });
  return out;
}

function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function startApp() {
  if (tauriInvoke) {
    state.manifest = structuredClone(DEFAULT_MANIFEST);
    state.rows = [];
    state.projectFileName = "";
    state.projectPath = "";
    state.selectedIds.clear();
    state.activeId = "";
    state.selectionAnchorId = "";
    state.search = "";
    state.dirty = false;
    state.lastSaved = "";
    state.recentProjects = loadRecentProjects();
    state.isWelcomeVisible = true;
    render();
    checkForAppUpdate().catch((error) => console.warn("Update check failed", error));
    return;
  }
  loadTsv(SAMPLE_TSV, "Sample Project");
}

startApp();
