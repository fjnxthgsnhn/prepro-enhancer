const COLUMNS = [
  "row_type",
  "id",
  "parent_id",
  "order",
  "title",
  "duration",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "dialogue",
  "image",
  "audio_file",
  "image_prompt",
  "video_prompt",
  "note",
];

const EDITABLE_COLUMNS = new Set([
  "title",
  "duration",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "dialogue",
  "image",
  "audio_file",
  "image_prompt",
  "video_prompt",
  "note",
]);

const DISPLAY_COLUMNS = [
  "title",
  "duration",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "dialogue",
  "image",
  "audio_file",
  "image_prompt",
  "video_prompt",
  "note",
];

const LLM_TSV_COLUMNS = [
  "row_type",
  "id",
  "parent_id",
  "order",
  "title",
  "duration",
  "scene",
  "subject",
  "composition",
  "action",
  "camera",
  "dialogue",
  "image",
  "audio_file",
  "image_prompt",
  "video_prompt",
  "note",
];

const DEFAULT_MANIFEST = {
  format: "LocalCutBoardProject",
  formatVersion: "1.0.0",
  appVersion: "0.1.0",
  projectName: "Untitled Project",
  mainCutlist: "cutlist.tsv",
  timeline: "timeline.json",
  settings: "settings.json",
  pathMode: "relative",
  mediaRoots: {
    project: ".",
    media: "media",
    images: "media/images",
    audio: "media/audio",
  },
  sequence: {
    frameRate: 30,
    width: 1920,
    height: 1080,
    audioSampleRate: 48000,
  },
};

const SAMPLE_TSV = `row_type\tid\tparent_id\torder\ttitle\tduration\tscene\tsubject\tcomposition\taction\tcamera\tdialogue\timage\taudio_file\timage_prompt\tvideo_prompt\tnote
scene\tsc001\t\t1\t研究室の異変\t\t研究室\t\t全体\t異変の前兆\tスローな移動\t\t\t\t白い研究室、薄明かり、緊張感のある映画的な画作り\t研究室全体をゆっくり見せる導入シーン\tシーン全体の方向性
multicut\tmc001\tsc001\t1\t顕微鏡シークエンス\t\t研究室\t山本\t寄り中心\t観察する\tドリーイン\t\t\t\t顕微鏡、研究員の手元、浅い被写界深度\t顕微鏡を覗く動作から表情変化までを数カットで見せる\t導入マルチカット
cut\tct001\tmc001\t1\t顕微鏡の寄り\t3s\t研究室\t顕微鏡\t超寄り\tレンズが光る\tゆっくりドリーイン\t低い機械音\tmedia/images/cut001.jpg\tmedia/audio/cut001.wav\t顕微鏡レンズの超クローズアップ、白い研究室照明、浅い被写界深度\t顕微鏡レンズへゆっくりドリーイン、微細な反射が揺れる\t導入カット
cut\tct002\tmc001\t2\t山本の目元\t3s\t研究室\t山本\t目元アップ\t違和感に気づく\t微細なプッシュイン\t息を呑む音\tmedia/images/cut002.jpg\t\t研究員の目元アップ、真剣な表情、白い壁面\t山本が顕微鏡を覗き込み、わずかに眉を寄せる\t表情重要
multicut\tmc002\tsc001\t2\t警告ランプ\t\t研究室\t警告灯\t切り返し\t警報が始まる\t固定とパン\t警告音\t\t\t赤い警告ランプ、反射するガラス、硬質な影\t警告ランプの点滅と室内の反応\t
cut\tct003\tmc002\t1\t警告灯の点滅\t2s\t研究室\t警告灯\tクローズアップ\t点滅する\t固定\t警告音\tmedia/images/cut003.jpg\tmedia/audio/cut003.wav\t赤い警告灯のクローズアップ、暗い反射、強いコントラスト\t警告灯が点滅し、画面に赤い反射が走る\t`;

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
  mediaUrls: new Map(),
  mediaBlobs: new Map(),
  collapsed: new Set(),
  panelCollapsed: new Set(),
  rightPanelCollapsed: false,
  undo: [],
  redo: [],
  playing: false,
  timer: null,
  playStartedAt: 0,
  playOffset: 0,
  draggingId: "",
  contextMenu: null,
  addOverlayAnchor: null,
};

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
  detail: document.querySelector("#detailPanel"),
  prompt: document.querySelector("#promptPanel"),
  media: document.querySelector("#mediaPanel"),
  validation: document.querySelector("#validationPanel"),
  search: document.querySelector("#searchInput"),
};

document.querySelector("#openProjectBtn").addEventListener("click", () => el.input.click());
document.querySelector("#loadSampleBtn").addEventListener("click", () => loadTsv(SAMPLE_TSV, "Sample Project"));
document.querySelector("#saveTsvBtn").addEventListener("click", exportTsv);
document.querySelector("#exportLlmTsvBtn").addEventListener("click", exportLlmTsv);
document.querySelector("#exportProjectBtn").addEventListener("click", exportProject);
document.querySelector("#exportXmlBtn").addEventListener("click", exportPremiereXml);
document.querySelectorAll("[data-toggle-panel]").forEach((button) => {
  button.addEventListener("click", () => togglePanel(button.dataset.togglePanel));
});

document.querySelector("#rightPanelToggle").addEventListener("click", toggleRightPanel);

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
  if (file.name.endsWith(".lctproj")) {
    await loadProject(file);
  } else {
    loadTsv(await file.text(), file.name.replace(/\.[^.]+$/, ""));
  }
  el.input.value = "";
});

el.search.addEventListener("input", () => {
  state.search = el.search.value.trim().toLowerCase();
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === "s") {
    event.preventDefault();
    exportTsv();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "o") {
    event.preventDefault();
    el.input.click();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "f") {
    event.preventDefault();
    el.search.focus();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "g") {
    event.preventDefault();
    groupSelectionFromShortcut();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  }
  if (event.ctrlKey && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  }
  if (event.altKey && ["1", "2", "3"].includes(event.key)) {
    event.preventDefault();
    setView(["table", "storyboard", "timeline"][Number(event.key) - 1]);
  }
  if (event.key === "Escape") closeContextMenu();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest?.(".table-context-menu")) closeContextMenu();
});

function loadTsv(text, name) {
  state.manifest = {
    ...structuredClone(DEFAULT_MANIFEST),
    projectName: name || "TSV Project",
  };
  state.rows = parseTsv(text);
  state.mediaUrls = new Map();
  state.mediaBlobs = new Map();
  if (text === SAMPLE_TSV) seedSampleMedia();
  state.projectFileName = name || "";
  state.selectedIds.clear();
  state.activeId = state.rows[0]?.id || "";
  if (state.activeId) state.selectedIds.add(state.activeId);
  state.selectionAnchorId = state.activeId;
  state.dirty = false;
  state.undo = [];
  state.redo = [];
  render();
}

async function loadProject(file) {
  revokeMediaUrls();
  const entries = await readZipEntries(await file.arrayBuffer());
  const manifestText = decodeZipText(entries.get("manifest.json"));
  const cutlistText = decodeZipText(entries.get("cutlist.tsv"));
  if (!manifestText || !cutlistText) {
    alert("manifest.json または cutlist.tsv が見つかりません。");
    return;
  }
  state.manifest = { ...structuredClone(DEFAULT_MANIFEST), ...JSON.parse(manifestText) };
  state.rows = parseTsv(cutlistText);
  state.mediaUrls = new Map();
  state.mediaBlobs = new Map();
  entries.forEach((entry, name) => {
    if (!name.startsWith("media/")) return;
    const blob = new Blob([entry.data], { type: mimeFromPath(name) });
    state.mediaBlobs.set(name, blob);
    state.mediaUrls.set(name, URL.createObjectURL(blob));
  });
  state.projectFileName = file.name;
  state.selectedIds.clear();
  state.activeId = state.rows[0]?.id || "";
  if (state.activeId) state.selectedIds.add(state.activeId);
  state.dirty = false;
  state.undo = [];
  state.redo = [];
  render();
}

function parseTsv(text) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = splitTsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = splitTsvLine(line);
    const row = {};
    COLUMNS.forEach((column) => {
      const headerIndex = headers.indexOf(column);
      row[column] = headerIndex >= 0 ? decodeCell(values[headerIndex] || "") : "";
    });
    row.row_type = row.row_type || "cut";
    row.id = row.id || nextId(row.row_type);
    row.order = row.order || String(index + 1);
    return row;
  });
}

function splitTsvLine(line) {
  return line.split("\t");
}

function encodeCell(value) {
  return String(value ?? "").replace(/\r?\n/g, "\\n").replace(/\t/g, " ");
}

function decodeCell(value) {
  return String(value ?? "").replace(/\\n/g, "\n");
}

function serializeTsv(rows = state.rows) {
  return [COLUMNS.join("\t"), ...rows.map((row) => COLUMNS.map((column) => encodeCell(row[column])).join("\t"))].join("\n");
}

function serializeLlmTsv(rows = state.rows) {
  return [LLM_TSV_COLUMNS.join("\t"), ...rows.map((row) => LLM_TSV_COLUMNS.map((column) => encodeCell(row[column])).join("\t"))].join("\n");
}

function buildTree() {
  const scenes = state.rows.filter((row) => row.row_type === "scene").sort(sortByOrder);
  const multicuts = state.rows.filter((row) => row.row_type === "multicut").sort(sortByOrder);
  const cuts = state.rows.filter((row) => row.row_type === "cut").sort(sortByOrder);
  return scenes.map((scene) => ({
    row: scene,
    multicuts: multicuts
      .filter((multicut) => multicut.parent_id === scene.id)
      .map((multicut) => ({
        row: multicut,
        cuts: cuts.filter((cut) => cut.parent_id === multicut.id),
      })),
  }));
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
    ...scene.multicuts.flatMap((multicut) => [multicut.row, ...multicut.cuts]),
  ]);
}

function rowLabel(row) {
  return row?.title || row?.id || "";
}

function render() {
  const issues = validate();
  renderStatus(issues);
  renderTree();
  renderTable();
  renderStoryboard();
  renderTimeline();
  renderDetail();
  renderPrompt();
  renderMedia();
  renderValidation(issues);
  renderPanels();
}

function renderStatus(issues) {
  const counts = countRows();
  el.projectName.textContent = state.manifest.projectName || "Untitled Project";
  el.projectPath.textContent = state.projectFileName || "Browser workspace";
  el.counts.textContent = `scene ${counts.scene} / multicut ${counts.multicut} / cut ${counts.cut}`;
  el.missingCount.textContent = `Missing ${issues.filter((issue) => issue.kind === "missing-media").length}`;
  el.saveState.textContent = state.dirty ? "Unsaved" : "Saved";
  el.lastSaved.textContent = state.lastSaved ? `Saved ${state.lastSaved}` : "Never";
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
    el.tree.innerHTML = `<div class="empty-state">Open a TSV or load the sample.</div>`;
    return;
  }
  tree.forEach((scene) => {
    el.tree.appendChild(treeNode(scene.row, 0));
    if (!state.collapsed.has(scene.row.id)) {
      scene.multicuts.forEach((multicut) => {
        el.tree.appendChild(treeNode(multicut.row, 1));
        if (!state.collapsed.has(multicut.row.id)) {
          multicut.cuts.forEach((cut) => el.tree.appendChild(treeNode(cut, 2)));
        }
      });
    }
  });
}

function treeNode(row, level) {
  const node = document.createElement("div");
  node.className = `tree-node level-${level}${state.activeId === row.id ? " selected" : ""}`;
  node.innerHTML = `<span class="badge">${row.row_type}</span><span>${escapeHtml(rowLabel(row))}</span>`;
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
  if (!rows.length) {
    el.table.innerHTML = `<div class="empty-state">No rows match the current search.</div>`;
    return;
  }
  closeContextMenu();
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `<thead><tr>${DISPLAY_COLUMNS.map((column) => `<th>${column}</th>`).join("")}</tr></thead>`;
  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = [row.row_type, state.selectedIds.has(row.id) ? "selected" : "", tableSelectionClass(row)].filter(Boolean).join(" ");
    tr.draggable = true;
    tr.dataset.id = row.id;
    tr.dataset.type = row.row_type;
    tr.addEventListener("click", (event) => selectRow(row.id, event));
    tr.addEventListener("dragstart", (event) => handleDragStart(event, row));
    tr.addEventListener("dragover", (event) => handleDragOver(event, row));
    tr.addEventListener("dragleave", clearDropClasses);
    tr.addEventListener("drop", (event) => handleDrop(event, row));
    tr.addEventListener("dragend", clearDragState);
    tr.addEventListener("contextmenu", (event) => showGroupMenu(event, row));
    DISPLAY_COLUMNS.forEach((column) => {
      const td = document.createElement("td");
      td.dataset.column = column;
      td.textContent = String(row[column] || "");
      if (EDITABLE_COLUMNS.has(column)) {
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
  table.appendChild(tbody);
  el.table.replaceChildren(table);
  renderAddOverlay();
}

function renderAddOverlay() {
  const activeRow = el.table.querySelector(`tr[data-id="${CSS.escape(state.activeId)}"]`);
  if (!activeRow) return;
  const overlay = document.createElement("div");
  overlay.className = "add-row-overlay";
  overlay.innerHTML = `
    <div class="add-row-actions" aria-label="Add row below selection">
      <button class="add-row-btn scene" type="button" data-add-type="scene" title="Add Scene">+</button>
      <button class="add-row-btn multicut" type="button" data-add-type="multicut" title="Add Multicut">+</button>
      <button class="add-row-btn cut" type="button" data-add-type="cut" title="Add Cut">+</button>
    </div>`;
  const tableRect = el.table.getBoundingClientRect();
  const rowRect = activeRow.getBoundingClientRect();
  const overlayWidth = 124;
  const overlayHeight = 42;
  const margin = 10;
  const anchorX = state.addOverlayAnchor?.x ?? Math.min(rowRect.right - overlayWidth - margin, tableRect.right - overlayWidth - margin);
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
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
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
    sceneEl.className = "scene-section";
    sceneEl.innerHTML = `<div class="scene-header"><h2>${escapeHtml(scene.row.title || scene.row.id)}</h2><span>${scene.multicuts.length} multicuts</span></div>`;
    scene.multicuts.forEach((multicut) => {
      const mc = document.createElement("section");
      mc.className = "multicut-section";
      mc.innerHTML = `<div class="multicut-header"><h3>${escapeHtml(multicut.row.title || multicut.row.id)}</h3><span>${multicut.cuts.length} cuts</span></div>`;
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

function cutCard(cut) {
  const card = document.createElement("article");
  card.className = `cut-card${state.activeId === cut.id ? " selected" : ""}`;
  card.addEventListener("click", (event) => selectRow(cut.id, event));
  const media = displayMediaUrl(cut.image);
  card.innerHTML = `
    <div class="thumb">${media ? `<img src="${media}" alt="">` : `<span>${cut.image ? "Missing image" : "No image"}</span>`}</div>
    <div class="card-body">
      <div class="card-title">${escapeHtml(rowLabel(cut))}</div>
      <div class="card-meta"><span>${escapeHtml(cut.duration || "default")}</span><span>${escapeHtml(cut.id)}</span></div>
    </div>`;
  return card;
}

function renderTimeline() {
  const cuts = state.rows.filter((row) => row.row_type === "cut").sort(sortByGlobalTimeline);
  const total = cuts.reduce((sum, cut) => sum + durationSeconds(cut.duration), 0);
  const playPercent = total ? Math.min(100, (currentPlaybackTime() / total) * 100) : 0;
  const root = document.createElement("div");
  root.className = "timeline";
  root.addEventListener("click", (event) => {
    if (event.target === root) clearSelection();
  });
  root.innerHTML = `
    <div class="timeline-controls">
      <button id="playBtn">${state.playing ? "Stop" : "Play"}</button>
      <span>${formatTime(currentPlaybackTime())} / ${formatTime(total)}</span>
    </div>
    <div class="marker-row">${state.rows
      .filter((row) => row.row_type !== "cut")
      .map((row) => `<span class="marker">${escapeHtml(row.row_type)} ${escapeHtml(row.title || row.id)}</span>`)
      .join("")}</div>
    <div class="timeline-stage">
      <div class="playhead" style="width:${playPercent}%"></div>
      <div class="track"></div>
    </div>`;
  const track = root.querySelector(".track");
  cuts.forEach((cut) => {
    const seconds = durationSeconds(cut.duration);
    const clip = document.createElement("div");
    clip.className = `clip${state.activeId === cut.id ? " selected" : ""}`;
    clip.style.width = `${Math.max(92, seconds * 54)}px`;
    clip.innerHTML = `<strong>${escapeHtml(rowLabel(cut))}</strong><span>${escapeHtml(cut.id)}</span><span>${seconds}s</span>`;
    clip.addEventListener("click", (event) => selectRow(cut.id, event));
    track.appendChild(clip);
  });
  root.querySelector("#playBtn").addEventListener("click", togglePlayback);
  el.timeline.replaceChildren(root);
}

function sortByGlobalTimeline(a, b) {
  const parentA = getRow(a.parent_id);
  const parentB = getRow(b.parent_id);
  const sceneA = parentA ? getRow(parentA.parent_id) : null;
  const sceneB = parentB ? getRow(parentB.parent_id) : null;
  return (
    Number(sceneA?.order || 0) - Number(sceneB?.order || 0) ||
    Number(parentA?.order || 0) - Number(parentB?.order || 0) ||
    Number(a.order || 0) - Number(b.order || 0)
  );
}

function renderDetail() {
  const row = getRow(state.activeId);
  if (!row) {
    el.detail.innerHTML = `<div class="empty-state">Select a row.</div>`;
    return;
  }
  const form = document.createElement("div");
  form.className = "form-grid";
  const fields = ["title", "duration", "scene", "subject", "composition", "action", "camera", "dialogue", "image", "audio_file", "image_prompt", "video_prompt", "note"];
  fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const readOnly = !EDITABLE_COLUMNS.has(field) && !["parent_id", "order"].includes(field);
    const tag = ["image_prompt", "video_prompt", "note"].includes(field) ? "textarea" : "input";
    wrapper.innerHTML = `<label>${field}</label><${tag} ${readOnly ? "readonly" : ""}>${tag === "textarea" ? escapeHtml(row[field] || "") : ""}</${tag}>`;
    const input = wrapper.querySelector(tag);
    if (tag === "input") input.value = row[field] || "";
    input.addEventListener("change", () => updateRow(row.id, { [field]: input.value }));
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
    <button id="copyPromptBtn">Copy Effective Prompts</button>`;
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

function renderValidation(issues) {
  if (!issues.length) {
    el.validation.innerHTML = `<div class="issue">No validation issues.</div>`;
    return;
  }
  el.validation.innerHTML = `<div class="issues">${issues
    .map((issue) => `<div class="issue ${issue.level}">${escapeHtml(issue.message)}</div>`)
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
  if (!state.selectedIds.has(row.id)) return "";
  const rows = filteredRows();
  const index = rows.findIndex((item) => item.id === row.id);
  const previousSelected = index > 0 && state.selectedIds.has(rows[index - 1].id);
  const nextSelected = index >= 0 && index < rows.length - 1 && state.selectedIds.has(rows[index + 1].id);
  const classes = ["selection-range"];
  if (row.id === state.activeId) classes.push("selection-active");
  if (!previousSelected && !nextSelected) classes.push("selection-single");
  else if (!previousSelected) classes.push("selection-start");
  else if (!nextSelected) classes.push("selection-end");
  else classes.push("selection-middle");
  return classes.join(" ");
}

function toggleCollapse(id) {
  if (state.collapsed.has(id)) state.collapsed.delete(id);
  else state.collapsed.add(id);
  renderTree();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view-btn").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view-pane").forEach((pane) => pane.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
}

function updateRow(id, patch) {
  const row = getRow(id);
  if (!row) return;
  pushHistory();
  Object.assign(row, patch);
  markDirty();
  render();
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
    if (!scene) return alert("scene が必要です。");
    row.parent_id = scene.id;
    row.order = String(nextOrder(state.rows.filter((item) => item.row_type === "multicut" && item.parent_id === scene.id)));
  }
  if (type === "cut") {
    const multicut = active?.row_type === "multicut" ? active : getAncestor(active, "multicut") || state.rows.find((item) => item.row_type === "multicut");
    if (!multicut) return alert("multicut が必要です。");
    row.parent_id = multicut.id;
    row.order = String(nextOrder(state.rows.filter((item) => item.row_type === "cut" && item.parent_id === multicut.id)));
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
  const multicuts = state.rows.filter((item) => item.row_type === "multicut" && item.parent_id === scene.id).sort(sortByOrder);
  let index = 0;
  if (active.row_type === "multicut") index = multicuts.findIndex((item) => item.id === active.id) + 1;
  if (active.row_type === "cut") {
    const parent = getRow(active.parent_id);
    index = multicuts.findIndex((item) => item.id === parent?.id) + 1;
  }
  state.rows.push(row);
  insertIntoOrderedGroup(row, multicuts, Math.max(0, index));
}

function insertCutAfter(row, active) {
  let multicut = active.row_type === "multicut" ? active : getAncestor(active, "multicut");
  if (!multicut && active.row_type === "scene") {
    multicut = state.rows
      .filter((item) => item.row_type === "multicut" && item.parent_id === active.id)
      .sort(sortByOrder)[0];
    if (!multicut) {
      multicut = blankRow("multicut", nextId("multicut"));
      multicut.parent_id = active.id;
      state.rows.push(multicut);
      insertIntoOrderedGroup(multicut, [], 0);
    }
  }
  if (!multicut) return row;
  row.parent_id = multicut.id;
  row.duration = "3s";
  const cuts = state.rows.filter((item) => item.row_type === "cut" && item.parent_id === multicut.id).sort(sortByOrder);
  const index = active.row_type === "cut" ? cuts.findIndex((item) => item.id === active.id) + 1 : cuts.length;
  state.rows.push(row);
  insertIntoOrderedGroup(row, cuts, Math.max(0, index));
  return row;
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

function showGroupMenu(event, row) {
  const cutCount = selectedRowsOfType("cut").length;
  const multicutCount = selectedRowsOfType("multicut").length;
  const canGroupCuts = row.row_type === "cut" && state.selectedIds.has(row.id) && cutCount >= 2;
  const canGroupMulticuts = row.row_type === "multicut" && state.selectedIds.has(row.id) && multicutCount >= 2;
  if (!canGroupCuts && !canGroupMulticuts) return;
  event.preventDefault();
  event.stopPropagation();
  closeContextMenu();
  const menu = document.createElement("div");
  menu.className = "table-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = canGroupCuts ? "Create Multicut" : "Create Scene";
  button.addEventListener("click", (clickEvent) => {
    clickEvent.stopPropagation();
    closeContextMenu();
    if (canGroupCuts) groupCuts();
    else groupMulticuts();
  });
  menu.appendChild(button);
  document.body.appendChild(menu);
  state.contextMenu = menu;
}

function closeContextMenu() {
  state.contextMenu?.remove();
  state.contextMenu = null;
}

function groupSelectionFromShortcut() {
  if (state.view !== "table") return;
  if (selectedRowsOfType("cut").length >= 2) {
    groupCuts();
    return;
  }
  if (selectedRowsOfType("multicut").length >= 2) groupMulticuts();
}

function groupCuts() {
  const cuts = selectedRowsOfType("cut");
  if (cuts.length < 2) return alert("2つ以上のcutを選択してください。");
  const parent = getRow(cuts[0].parent_id);
  if (!parent) return;
  pushHistory();
  const mc = blankRow("multicut", nextId("multicut"));
  mc.parent_id = parent.parent_id;
  mc.title = "Grouped Multicut";
  mc.order = String(nextOrder(state.rows.filter((row) => row.row_type === "multicut" && row.parent_id === mc.parent_id)));
  state.rows.push(mc);
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
  if (multicuts.length < 2) return alert("2つ以上のmulticutを選択してください。");
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
  const groups = new Map();
  state.rows.forEach((row) => {
    const key = `${row.row_type}:${row.parent_id || "root"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  groups.forEach((rows) => rows.sort(sortByOrder).forEach((row, index) => (row.order = String(index + 1))));
}

function handleDragStart(event, row) {
  state.draggingId = row.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", row.id);
}

function handleDragOver(event, target) {
  const dragged = getRow(event.dataTransfer.getData("text/plain") || state.draggingId);
  if (!dragged || dragged.id === target.id) return;
  const mode = dropMode(event, dragged, target);
  clearDropClasses();
  if (!mode) return;
  event.preventDefault();
  event.currentTarget.classList.add(`drop-${mode}`);
}

function handleDrop(event, target) {
  const dragged = getRow(event.dataTransfer.getData("text/plain") || state.draggingId);
  const mode = dragged ? dropMode(event, dragged, target) : "";
  clearDropClasses();
  if (!dragged || !mode || dragged.id === target.id) return;
  event.preventDefault();
  pushHistory();
  moveRow(dragged, target, mode);
  normalizeOrders();
  state.activeId = dragged.id;
  state.selectedIds = new Set([dragged.id]);
  state.selectionAnchorId = dragged.id;
  markDirty();
  render();
}

function dropMode(event, dragged, target) {
  if (dragged.row_type === "scene" && target.row_type === "scene") return event.offsetY < event.currentTarget.clientHeight / 2 ? "before" : "after";
  if (dragged.row_type === "multicut") {
    if (target.row_type === "scene") return "into";
    if (target.row_type === "multicut") return event.offsetY < event.currentTarget.clientHeight / 2 ? "before" : "after";
  }
  if (dragged.row_type === "cut") {
    if (target.row_type === "multicut") return "into";
    if (target.row_type === "cut") return event.offsetY < event.currentTarget.clientHeight / 2 ? "before" : "after";
  }
  return "";
}

function moveRow(dragged, target, mode) {
  if (mode === "into") {
    dragged.parent_id = target.id;
    dragged.order = String(nextOrder(siblingsOf(dragged)));
    return;
  }
  dragged.parent_id = target.parent_id;
  const siblings = siblingsOf(dragged).filter((row) => row.id !== dragged.id).sort(sortByOrder);
  const targetIndex = siblings.findIndex((row) => row.id === target.id);
  const insertAt = mode === "before" ? targetIndex : targetIndex + 1;
  siblings.splice(insertAt, 0, dragged);
  siblings.forEach((row, index) => {
    row.order = String(index + 1);
  });
}

function siblingsOf(row) {
  return state.rows.filter((candidate) => candidate.row_type === row.row_type && (candidate.parent_id || "") === (row.parent_id || ""));
}

function clearDropClasses() {
  document.querySelectorAll(".drop-before, .drop-after, .drop-into").forEach((row) => {
    row.classList.remove("drop-before", "drop-after", "drop-into");
  });
}

function clearDragState() {
  state.draggingId = "";
  clearDropClasses();
}

function validate() {
  const issues = [];
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
    if (row.row_type === "cut" && (!parent || parent.row_type !== "multicut")) issues.push(error(`${row.id}: cut parent_id must reference multicut.`));
    if (row.row_type === "cut" && durationSeconds(row.duration) <= 0) issues.push(warn(`${row.id}: invalid duration, default 3s will be used.`));
    if (row.row_type === "cut" && row.image && !mediaUrl(row.image)) issues.push({ level: "warning", kind: "missing-media", message: `${row.id}: image may be missing (${row.image}).` });
    if (row.row_type === "cut" && row.audio_file && !mediaUrl(row.audio_file)) issues.push({ level: "warning", kind: "missing-media", message: `${row.id}: audio may be missing (${row.audio_file}).` });
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
    image: chain.map((item) => item?.image_prompt).filter(Boolean).join("\n"),
    video: chain.map((item) => item?.video_prompt).filter(Boolean).join("\n"),
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
  state.undo.push(JSON.stringify(state.rows));
  if (state.undo.length > 100) state.undo.shift();
  state.redo = [];
}

function undo() {
  const snapshot = state.undo.pop();
  if (!snapshot) return;
  state.redo.push(JSON.stringify(state.rows));
  state.rows = JSON.parse(snapshot);
  markDirty();
  render();
}

function redo() {
  const snapshot = state.redo.pop();
  if (!snapshot) return;
  state.undo.push(JSON.stringify(state.rows));
  state.rows = JSON.parse(snapshot);
  markDirty();
  render();
}

function exportTsv() {
  downloadText(`${safeName(state.manifest.projectName)}_cutlist.tsv`, serializeTsv(), "text/tab-separated-values;charset=utf-8");
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

function exportLlmTsv() {
  downloadText(`${safeName(state.manifest.projectName)}_llm.tsv`, serializeLlmTsv(), "text/tab-separated-values;charset=utf-8");
}

async function exportProject() {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const manifest = {
    ...state.manifest,
    projectName: state.manifest.projectName || "Previz Project",
    mainCutlist: "cutlist.tsv",
    timeline: "timeline.json",
    settings: "settings.json",
  };
  const files = new Map([
    ["manifest.json", JSON.stringify(manifest, null, 2)],
    ["cutlist.tsv", serializeTsv()],
    ["timeline.json", JSON.stringify({ collapsed: [...state.collapsed], activeId: state.activeId }, null, 2)],
    ["settings.json", JSON.stringify({ view: state.view }, null, 2)],
    ["media_index.json", JSON.stringify({ media: state.rows.filter((row) => row.row_type === "cut").map((row) => ({ id: row.id, image: row.image, audio_file: row.audio_file })) }, null, 2)],
    [`.backups/${stamp}/manifest.json`, JSON.stringify(manifest, null, 2)],
    [`.backups/${stamp}/cutlist.tsv`, serializeTsv()],
    [`.backups/${stamp}/timeline.json`, JSON.stringify({ collapsed: [...state.collapsed], activeId: state.activeId }, null, 2)],
    [`.backups/${stamp}/settings.json`, JSON.stringify({ view: state.view }, null, 2)],
  ]);
  for (const [path, mediaBlob] of state.mediaBlobs.entries()) {
    files.set(path, new Uint8Array(await mediaBlob.arrayBuffer()));
  }
  const blob = new Blob([createZip(files)], { type: "application/zip" });
  downloadBlob(`${safeName(manifest.projectName)}.lctproj`, blob);
  state.dirty = false;
  state.lastSaved = new Date().toLocaleTimeString();
  render();
}

function exportPremiereXml() {
  const xml = buildPremiereXml();
  downloadText(`${safeName(state.manifest.projectName)}_premiere.xml`, xml, "application/xml;charset=utf-8");
}

function buildPremiereXml() {
  const fps = Number(state.manifest.sequence?.frameRate || 30);
  const cuts = state.rows.filter((row) => row.row_type === "cut").sort(sortByGlobalTimeline);
  let frame = 0;
  const clips = [];
  const markers = [];
  state.rows.filter((row) => row.row_type !== "cut").forEach((row) => {
    markers.push(`<marker><name>${xmlEscape(row.title || row.id)}</name><comment>${xmlEscape([row.image_prompt, row.video_prompt, row.note].filter(Boolean).join("\n"))}</comment><in>${frame}</in><out>${frame}</out></marker>`);
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
    <name>${xmlEscape(state.manifest.projectName || "Previz Project")}</name>
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
  return String(name || "previz-project").replace(/[\\/:*?"<>|]+/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function xmlEscape(value) {
  return escapeHtml(value);
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
    state.playOffset = currentPlaybackTime();
    state.playing = false;
    clearInterval(state.timer);
  } else {
    const total = state.rows.filter((row) => row.row_type === "cut").reduce((sum, cut) => sum + durationSeconds(cut.duration), 0);
    if (state.playOffset >= total) state.playOffset = 0;
    state.playing = true;
    state.playStartedAt = performance.now();
    state.timer = setInterval(() => {
      if (currentPlaybackTime() >= total) {
        state.playing = false;
        state.playOffset = 0;
        clearInterval(state.timer);
      }
      renderTimeline();
    }, 100);
  }
  renderTimeline();
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
  let offset = 0;
  while (offset < bytes.length - 30) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + fileNameLength));
    const data = bytes.slice(dataStart, dataStart + compressedSize);
    if (method === 0) {
      entries.set(name, { data });
    } else if (method === 8 && "DecompressionStream" in window) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      entries.set(name, { data: new Uint8Array(await new Response(stream).arrayBuffer()) });
    }
    offset = dataStart + compressedSize;
  }
  return entries;
}

function decodeZipText(entry) {
  return entry ? new TextDecoder().decode(entry.data) : "";
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
}

function sampleSvg(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#111310"/>
  <rect x="36" y="36" width="888" height="468" fill="#181b17" stroke="${color}" stroke-width="6"/>
  <circle cx="230" cy="270" r="138" fill="${color}" opacity=".16"/>
  <path d="M112 398 C248 122 432 438 592 172 S778 408 868 148" fill="none" stroke="${color}" stroke-width="10"/>
  <text x="88" y="130" fill="${color}" font-family="Segoe UI, sans-serif" font-size="42" font-weight="800">${label}</text>
  <text x="88" y="444" fill="#eef1e8" font-family="Segoe UI, sans-serif" font-size="24">Previz sample media</text>
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

loadTsv(SAMPLE_TSV, "Sample Project");
