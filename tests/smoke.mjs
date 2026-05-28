import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { deflateRawSync } from "node:zlib";

const browser = await chromium.launch();
const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
await page.addInitScript(() => {
  const clipboard = {
    value: "",
    writeText(text) {
      this.value = String(text);
      return Promise.resolve();
    },
    readText() {
      return Promise.resolve(this.value);
    },
  };
  Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
});

await page.goto(pathToFileURL(resolve("index.html")).href);

await expectText("#projectName", "Sample Project");
await expectText("#counts", "scene 1 / multicut 2 / cut 3");
await expectText("#missingCount", "Missing 0");
await expectCount(".data-table tbody tr[data-id]", 6);
await expectCount(".tree-node", 6);
for (const removedButton of ["openProjectBtn", "loadSampleBtn", "saveTsvBtn", "exportLlmTsvBtn", "exportProjectBtn", "exportXmlBtn"]) {
  if (await page.locator(`#${removedButton}`).count()) throw new Error(`${removedButton} should be moved into the File menu`);
}
await page.click("#fileMenuBtn");
for (const menuItem of ["NewProject", "OpenProject", "Save", "Save as", "Export"]) {
  await expectText("#fileMenu", menuItem);
}
await page.keyboard.press("Escape");
await page.waitForFunction(() => document.querySelector("#fileMenu")?.hidden);
const [newProjectDownload] = await Promise.all([page.waitForEvent("download"), clickFileAction("new")]);
if (!newProjectDownload.suggestedFilename().endsWith(".lctproj")) throw new Error("NewProject should download an lctproj in web fallback");
const newProjectBytes = await readFile(await newProjectDownload.path());
const newProjectEntries = readZipEntries(newProjectBytes);
const newCutlist = newProjectEntries.get("cutlist.tsv") || "";
if (newCutlist.trim() !== expectedHeaders().join("\t")) throw new Error(`NewProject cutlist should contain only headers: ${newCutlist}`);
const newAssets = JSON.parse(newProjectEntries.get("assets.json") || "{}");
if (!Array.isArray(newAssets.assets) || newAssets.assets.length !== 0) throw new Error("NewProject should include an empty assets.json");
expectAgentsMd(newProjectEntries.get("AGENTS.md"), "NewProject");
await expectText("#counts", "scene 0 / multicut 0 / cut 0");
await expectCount(".data-table tbody tr[data-id]", 0);
await expectTableHeaders();
await expectCount(".empty-table-row", 1);
await page.click('.empty-table-row .add-row-btn.scene');
await expectText("#counts", "scene 1 / multicut 0 / cut 0");
await expectCount(".data-table tbody tr[data-id]", 1);
await clickFileAction("new");
await expectText("#counts", "scene 0 / multicut 0 / cut 0");
await expectTableHeaders();
await page.click('.empty-table-row .add-row-btn.cut');
await expectText("#counts", "scene 1 / multicut 0 / cut 1");
await expectCount(".data-table tbody tr[data-id]", 2);
await expectCount(".tree-node", 2);
await expectText('tbody tr[data-id="ct001"] td[data-column="title"]', "New Cut");
await page.click('[data-view="storyboard"]');
await expectCount(".cut-card[data-id='ct001']", 1);
await page.click('[data-view="timeline"]');
await expectCount(".timeline-clip.cut[data-id='ct001']", 1);
await page.click('[data-view="table"]');
await clickFileAction("new");
await expectText("#counts", "scene 0 / multicut 0 / cut 0");
await expectCount(".tree-node", 0);
await expectText("#saveState", "Saved");
await expectText("#detailPanel", "Select a row");
await page.reload();
await expectText("#projectName", "Sample Project");
const nestedProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Nested TSV Project", mainCutlist: "data/cutlist.tsv" })],
    ["data/cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc900\t\t1\tNested Scene\t\t\t\t\t\t\t\t\t\t\t\t`],
  ]),
);
await loadProjectFile("nested-maincutlist.lctproj", nestedProject);
await expectText("#projectName", "Nested TSV Project");
await expectText("#counts", "scene 1 / multicut 0 / cut 0");
await page.reload();
await expectText("#projectName", "Sample Project");
const wrappedProject = makeStoredZip(
  new Map([
    ["project/manifest.json", JSON.stringify({ projectName: "Wrapped Project", mainCutlist: "cutlist.tsv" })],
    ["project/cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc901\t\t1\tWrapped Scene\t\t\t\t\t\t\t\t\t\t\t\t`],
  ]),
);
await loadProjectFile("wrapped-project.lctproj", wrappedProject);
await expectText("#projectName", "Wrapped Project");
await expectText("#counts", "scene 1 / multicut 0 / cut 0");
await page.reload();
await expectText("#projectName", "Sample Project");
const quotedProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Quoted TSV Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc930\t\t1\tQuoted Scene\t\t\t\t\t\t\t\t\t\t\t\t\nmulticut\tmc930\tsc930\t1\tQuoted MC\t\t\t\t\t\t\t\t\t\t\t\ncut\tct930\tmc930\t1\t\"Quoted\tCut\"\t2s\t\t\t\t\t\t\t\t\t\t\t\"line1\nline2\"`],
  ]),
);
await loadProjectFile("quoted-project.lctproj", quotedProject);
await expectText("#projectName", "Quoted TSV Project");
await expectText("#counts", "scene 1 / multicut 1 / cut 1");
await expectText('tbody tr[data-id="ct930"] td[data-column="title"]', "Quoted\tCut");
await expectText('tbody tr[data-id="ct930"] td[data-column="note"]', "line2");
await page.reload();
await expectText("#projectName", "Sample Project");
const sjisTsv = Buffer.concat([
  Buffer.from(`${expectedHeaders().join("\t")}\nscene\tsc940\t\t1\t`, "ascii"),
  Buffer.from([0x82, 0xa0]),
  Buffer.from("\t\t\t\t\t\t\t\t\t\t\t\t", "ascii"),
]);
const sjisProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "SJIS TSV Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", sjisTsv],
  ]),
);
await loadProjectFile("sjis-project.lctproj", sjisProject);
await expectText("#projectName", "SJIS TSV Project");
await expectText('tbody tr[data-id="sc940"] td[data-column="title"]', "あ");
await page.reload();
await expectText("#projectName", "Sample Project");
const deflateProject = makeZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Deflate Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc950\t\t1\tDeflate Scene\t\t\t\t\t\t\t\t\t\t\t\t`],
  ]),
  8,
);
await loadProjectFile("deflate-project.lctproj", deflateProject);
await expectText("#projectName", "Deflate Project");
await expectText("#counts", "scene 1 / multicut 0 / cut 0");
await page.reload();
await expectText("#projectName", "Sample Project");
const legacyProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Legacy TSV Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", " row_type \tid\tparent_id\torder\tcut\ttitle\tduration\tstatus\taudio\nscene\tsc900\t\t1\t\tLegacy Scene\t\t\t\nmulticut\tmc900\tsc900\t1\t\tLegacy MC\t\t\t\ncut\tct900\tmc900\t1\t1\tLegacy Cut\t2s\tdraft\tLegacy Dialogue"],
  ]),
);
await loadProjectFile("legacy-project.lctproj", legacyProject);
await expectText("#projectName", "Legacy TSV Project");
await expectText("#counts", "scene 1 / multicut 1 / cut 1");
await expectText('tbody tr[data-id="ct900"] td[data-column="dialogue"]', "Legacy Dialogue");
await page.reload();
await expectText("#projectName", "Sample Project");
await page.fill("#searchInput", "not-in-next-project");
const uppercaseProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Uppercase Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc902\t\t1\tUppercase Scene\t\t\t\t\t\t\t\t\t\t\t\t`],
  ]),
);
await loadProjectFile("UPPERCASE.LCTPROJ", uppercaseProject);
await expectText("#projectName", "Uppercase Project");
await expectText("#counts", "scene 1 / multicut 0 / cut 0");
if (await page.inputValue("#searchInput")) throw new Error("Project load should clear search input");
await expectCount(".data-table tbody tr[data-id]", 1);
await page.reload();
await expectText("#projectName", "Sample Project");
const aliasHeaderProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Alias Header Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", "row type\tid\tparent id\torder\ttitle\tduration\taudio file\taudio\nScene \tsc910\t\t1\tAlias Scene\t\t\t\nmulti cut\tmc910\tsc910\t1\tAlias MC\t\t\t\nCT\tct910\tmc910\t1\tAlias Cut\t2s\talias.wav\tAlias Dialogue"],
  ]),
);
await loadProjectFile("alias-header.lctproj", aliasHeaderProject);
await expectText("#projectName", "Alias Header Project");
await expectText("#counts", "scene 1 / multicut 1 / cut 1");
await expectText('tbody tr[data-id="ct910"] td[data-column="audio_file"]', "alias.wav");
await expectText('tbody tr[data-id="ct910"] td[data-column="dialogue"]', "Alias Dialogue");
await page.reload();
await expectText("#projectName", "Sample Project");
const orphanCutProject = makeStoredZip(
  new Map([
    ["manifest.json", JSON.stringify({ projectName: "Orphan Cut Project", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", `${expectedHeaders().join("\t")}\ncut\tct920\tmissing-parent\t1\tOrphan Cut\t2s\t\t\t\t\t\t\t\t\t\t\t`],
  ]),
);
await loadProjectFile("orphan-cut.lctproj", orphanCutProject);
await expectText("#projectName", "Orphan Cut Project");
await expectText("#counts", "scene 1 / multicut 0 / cut 1");
await expectText(".data-table", "Imported Scene");
await expectText('tbody tr[data-id="ct920"] td[data-column="title"]', "Orphan Cut");
await expectText("#validationPanel", "Imported Scene");
await page.reload();
await expectText("#projectName", "Sample Project");
const invalidZipDialog = page.waitForEvent("dialog");
await loadProjectFile("invalid.lctproj", Buffer.from("not a zip"));
const dialog = await invalidZipDialog;
const sawInvalidZipAlert = /ZIP|manifest|cutlist/.test(dialog.message());
await dialog.dismiss();
if (!sawInvalidZipAlert) throw new Error("Invalid project should show a load error");
await expectText("#projectName", "Sample Project");
await expectText("#counts", "scene 1 / multicut 2 / cut 3");
const duplicateAssetIdProject = makeStoredZip(new Map([
  ["manifest.json", JSON.stringify({ projectName: "Duplicate Asset IDs", mainCutlist: "cutlist.tsv", assets: "assets.json" })],
  ["cutlist.tsv", expectedHeaders().join("\t")],
  ["assets.json", JSON.stringify({ version: 1, assets: [
    { id: "asset-dup", alias: "rui", path: "assets/rui.png", type: "image", title: "Rui" },
    { id: "asset-dup", alias: "kou", path: "assets/kou.png", type: "image", title: "Kou" },
  ] })],
]));
await loadProjectFile("duplicate-asset-ids.lctproj", duplicateAssetIdProject);
await page.click('[data-view="assets"]');
await expectCount(".asset-card", 2);
const loadedAssetIds = await page.$$eval(".asset-card", (cards) => cards.map((card) => card.dataset.assetId));
if (new Set(loadedAssetIds).size !== loadedAssetIds.length) throw new Error("Loaded asset IDs should be made unique");
await page.locator(".asset-card").nth(1).locator(".asset-thumb").click();
await page.waitForFunction(() => document.querySelector('.asset-modal [data-asset-field="alias"]')?.value === "kou");
await page.locator('.asset-modal [data-asset-action="close"]').click();
await page.reload();
await expectText("#projectName", "Sample Project");
await expectText("#counts", "scene 1 / multicut 2 / cut 3");
for (const removedButton of ["addSceneBtn", "addMulticutBtn", "addCutBtn", "groupCutsBtn", "groupMulticutsBtn"]) {
  if (await page.locator(`#${removedButton}`).count()) throw new Error(`${removedButton} should be removed from the toolbar`);
}
const headers = await page.$$eval(".data-table th", (nodes) => nodes.map((node) => node.textContent));
for (const hidden of ["row_type", "id", "parent_id", "order", "cut", "status"]) {
  if (headers.includes(hidden)) throw new Error(`${hidden} should be hidden in Table View`);
}
for (const visible of ["composition", "action", "camera", "dialogue"]) {
  if (!headers.includes(visible)) throw new Error(`${visible} should be visible in Table View`);
}
const expectedTail = ["dialogue", "image", "audio_file", "image_prompt", "video_prompt", "note"];
const tailStart = headers.indexOf("dialogue");
if (tailStart < 0 || expectedTail.some((name, index) => headers[tailStart + index] !== name)) {
  throw new Error(`media columns should be adjacent to dialogue on the right: ${headers.join(",")}`);
}
const cssText = await readFile(resolve("src/styles.css"), "utf8");
if (!cssText.includes("prefers-reduced-motion")) throw new Error("CSS should include reduced motion handling");
const appText = await readFile(resolve("src/app.js"), "utf8");
if ((appText.match(/async function loadProjectFromBytes/g) || []).length !== 1) throw new Error("Only one loadProjectFromBytes implementation should remain");

await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.click('tbody tr[data-id="mc001"] td[data-column="title"]');
await page.waitForFunction(() => {
  const selected = [...document.querySelectorAll(".data-table tr.selected")].map((row) => row.dataset.id);
  return selected.includes("mc001") && selected.includes("ct001") && selected.includes("ct002") &&
    document.querySelector('tbody tr[data-id="mc001"]')?.classList.contains("selection-start") &&
    document.querySelector('tbody tr[data-id="ct002"]')?.classList.contains("selection-end");
});
await page.click('tbody tr[data-id="mc001"]', { button: "right" });
await expectText(".table-context-menu", "Copy ID");
await expectText(".table-context-menu", "Ungroup Multicut");
await page.locator(".table-context-menu button", { hasText: "Copy ID" }).click();
await page.waitForFunction(async () => (await navigator.clipboard.readText()) === "mc001");
await page.keyboard.press("Control+Shift+G");
await page.waitForFunction(() => !document.querySelector('tbody tr[data-id="mc001"]') &&
  document.querySelector('tbody tr[data-id="ct001"]') &&
  document.querySelector('tbody tr[data-id="ct002"]'));
await expectText("#counts", "scene 1 / multicut 1 / cut 3");
await page.reload();
await expectText("#projectName", "Sample Project");

await page.click("#tableView", { position: { x: 12, y: 780 } });
await ctrlSelectRows(["ct001", "ct002"]);
await page.click('tbody tr[data-id="ct001"]', { button: "right" });
await page.locator(".table-context-menu button", { hasText: "Copy ID" }).click();
await page.waitForFunction(async () => (await navigator.clipboard.readText()) === "ct001\nct002");
await page.locator('tbody tr[data-id="ct001"]').dragTo(page.locator('tbody tr[data-id="mc002"]'), {
  sourcePosition: { x: 24, y: 12 },
  targetPosition: { x: 24, y: 12 },
});
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr[data-id]")].map((row) => row.dataset.id);
  return rows.indexOf("ct001") > rows.indexOf("mc002") && rows.indexOf("ct002") > rows.indexOf("mc002");
});
await page.reload();
await expectText("#projectName", "Sample Project");

await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.click('tbody tr[data-id="mc001"] td[data-column="title"]', { force: true });
await page.keyboard.press("Control+Shift+G");
await page.waitForFunction(() => !document.querySelector('tbody tr[data-id="mc001"]'));
await ctrlSelectRows(["ct001", "ct002"]);
await page.click('tbody tr[data-id="ct001"]', { button: "right" });
await page.locator(".table-context-menu button", { hasText: "Create Multicut" }).click();
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr[data-id]")].map((row) => row.dataset.id);
  const mc = rows.find((id) => id?.startsWith("mc") && !["mc001", "mc002"].includes(id));
  return mc && rows.indexOf(mc) < rows.indexOf("ct001") && rows.indexOf("ct001") < rows.indexOf("ct002");
});
await page.reload();
await expectText("#projectName", "Sample Project");

await page.click('[data-view="storyboard"]');
await expectCount(".cut-card", 3);
await expectText(".scene-header", "8s");
await expectText(".multicut-header", "6s");
await page.dragAndDrop('.cut-card[data-id="ct001"]', '.multicut-section[data-id="mc002"]');
await page.click('[data-view="table"]');
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("ct001") > rows.indexOf("mc002");
});
await expectText('tbody tr[data-id="mc002"] td[data-column="duration"]', "5s");
await expectText('tbody tr[data-id="sc001"] td[data-column="duration"]', "8s");
await page.click('[data-view="storyboard"]');
await page.click('.scene-header');
await page.waitForFunction(() => {
  const fields = [...document.querySelectorAll("#detailPanel .field")];
  return fields.find((field) => field.querySelector("label")?.textContent === "duration")?.querySelector("input")?.value === "8s";
});
await page.locator('.multicut-section[data-id="mc002"]').dragTo(page.locator('.multicut-section[data-id="mc001"]'), {
  sourcePosition: { x: 20, y: 15 },
  targetPosition: { x: 20, y: 15 },
});
await page.waitForFunction(() => document.querySelector('.multicut-section[data-id="mc002"]')?.classList.contains("selected"));
await expectText(".storyboard", "Microscope Close");

await page.click('[data-view="timeline"]');
await expectCount(".timeline-preview", 1);
await expectCount(".timeline-seek", 1);
await expectCount(".timeline-clip.scene", 1);
await expectCount(".timeline-clip.multicut", 2);
await expectCount(".timeline-clip.cut", 3);
await expectCount(".timeline-clip.cut .clip-resize-handle", 3);
await expectCount(".timeline-clip.scene .clip-resize-handle", 0);
await expectCount(".timeline-clip.multicut .clip-resize-handle", 0);
await expectCount(".timeline-ruler", 1);
await expectCount(".timeline-tick.major", 2);
await expectText(".timeline", "Microscope Close");
await page.waitForFunction(() => {
  const preview = document.querySelector(".timeline-preview");
  return preview && Math.abs(preview.getBoundingClientRect().width / preview.getBoundingClientRect().height - 16 / 9) < 0.03;
});
await page.evaluate(() => {
  document.querySelector(".nested-track").style.width = "1800px";
  const stage = document.querySelector(".timeline-stage");
  stage.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 320 }));
});
await page.waitForFunction(() => document.querySelector(".timeline-stage")?.scrollLeft > 0);
const scrolledBeforePlay = await page.locator(".timeline-stage").evaluate((node) => node.scrollLeft);
await page.click("#playBtn");
await page.waitForTimeout(250);
await expectText("#playBtn", "Stop");
await page.waitForFunction((left) => Math.abs(document.querySelector(".timeline-stage")?.scrollLeft - left) < 2, scrolledBeforePlay);
await expectCount(".timeline-clip.scene", 1);
await expectCount(".timeline-clip.multicut", 2);
await expectCount(".timeline-clip.cut", 3);
await page.keyboard.press("Space");
await expectText("#playBtn", "Play");
await page.locator(".timeline-seek").evaluate((input) => {
  input.value = "4";
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.waitForFunction(() => Number(document.querySelector(".timeline-seek")?.value || 0) >= 4);
await page.waitForFunction(() => document.querySelector(".timeline-preview")?.dataset.cutId);
await expectCount(".playhead-handle", 1);
const scrubClick = await page.locator(".timeline-stage").evaluate((stage) => {
  const rect = stage.getBoundingClientRect();
  return { x: rect.left + 250, y: rect.top + 28 };
});
await page.mouse.click(scrubClick.x, scrubClick.y);
await page.waitForFunction(() => Number(document.querySelector(".timeline-seek")?.value || 0) > 0.5);
await page.waitForFunction((x) => {
  const track = document.querySelector(".nested-track");
  const playhead = document.querySelector(".playhead");
  const viewportX = track.getBoundingClientRect().left + Number.parseFloat(playhead.style.left || "0");
  return Math.abs(viewportX - x) < 4;
}, scrubClick.x);
await page.locator(".playhead-handle").dragTo(page.locator(".timeline-stage"), {
  sourcePosition: { x: 6, y: 6 },
  targetPosition: { x: 260, y: 28 },
});
await page.waitForFunction(() => Number(document.querySelector(".timeline-seek")?.value || 0) > 1);
await page.waitForFunction(() => {
  const stage = document.querySelector(".timeline-stage");
  const track = document.querySelector(".nested-track");
  const playhead = document.querySelector(".playhead");
  const viewportX = track.getBoundingClientRect().left + Number.parseFloat(playhead.style.left || "0");
  return Math.abs(viewportX - (stage.getBoundingClientRect().left + 260)) < 8 && stage.scrollLeft > 0;
});
await page.click('[data-view="table"]');
await clearTableCell("ct001", "image");
await clearTableCell("ct002", "image");
await clearTableCell("ct003", "image");
await page.click('[data-view="timeline"]');
await page.locator(".timeline-seek").evaluate((input) => {
  input.value = "1";
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.waitForFunction(() => {
  const preview = document.querySelector(".timeline-preview");
  const text = document.querySelector(".timeline-text-preview");
  return preview?.dataset.cutId && text && !preview.querySelector("img") && text.textContent.includes("title");
});
await dragResizeHandle('.timeline-clip.cut[data-id="ct002"] .clip-resize-handle', 80);
await page.click('[data-view="table"]');
await page.waitForFunction(() => parseFloat(document.querySelector('tbody tr[data-id="ct002"] td[data-column="duration"]')?.textContent || "0") > 3);
await page.waitForFunction(() => parseFloat(document.querySelector('tbody tr[data-id="sc001"] td[data-column="duration"]')?.textContent || "0") > 8);
await page.click('[data-view="timeline"]');
await page.locator('.timeline-clip.cut[data-id="ct001"]').dragTo(page.locator('.timeline-clip.multicut[data-id="mc001"]'), {
  sourcePosition: { x: 20, y: 20 },
  targetPosition: { x: 20, y: 20 },
});
await page.waitForFunction(() => {
  const clip = document.querySelector('.timeline-clip.cut[data-id="ct001"]');
  return clip?.classList.contains("selected") && (clip.classList.contains("moved") || clip.classList.contains("flip-animating"));
});

await page.click('[data-view="table"]');
await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.click('tbody tr[data-id="sc001"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="sc001"]')?.classList.contains("selected"));
await page.click('tbody tr[data-id="ct002"] td[data-column="title"]', { modifiers: ["Shift"] });
await page.waitForFunction(() => {
  const selected = [...document.querySelectorAll(".data-table tr.selected")].map((row) => row.dataset.id);
  return selected.includes("sc001") && selected.includes("ct002") && selected.length >= 3 &&
    document.querySelector('tbody tr[data-id="sc001"]')?.classList.contains("selection-start") &&
    document.querySelector('tbody tr[data-id="ct002"]')?.classList.contains("selection-end");
});
await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
await page.click('tbody tr[data-id="mc002"] td[data-column="title"]', { modifiers: ["Control"] });
await page.waitForFunction(() => {
  const selected = [...document.querySelectorAll(".data-table tr.selected")].map((row) => row.dataset.id);
  return selected.includes("ct001") && selected.includes("mc002") && !selected.includes("ct002");
});
const rowCountBeforeAddOverlay = await page.locator(".data-table tbody tr[data-id]").count();
await page.waitForFunction(() => document.querySelectorAll(".add-row-btn").length === 3);
await page.waitForFunction(() => {
  const table = document.querySelector("#tableView");
  const overlay = document.querySelector(".add-row-overlay");
  if (!table || !overlay) return false;
  const tableRect = table.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  return overlayRect.left >= tableRect.left && overlayRect.right <= tableRect.right;
});
await page.evaluate(() => {
  document.querySelector("#tableView").scrollLeft = 900;
});
await page.click('tbody tr[data-id="mc002"] td[data-column="note"]', { modifiers: ["Control"] });
await page.waitForFunction(() => {
  const table = document.querySelector("#tableView");
  const overlay = document.querySelector(".add-row-overlay");
  if (!table || !overlay) return false;
  const tableRect = table.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  return overlayRect.left >= tableRect.left && overlayRect.right <= tableRect.right;
});
if (await page.locator(".add-row-controls").count()) throw new Error("Add buttons should render as an overlay, not a table row");
if ((await page.locator(".data-table tbody tr[data-id]").count()) !== rowCountBeforeAddOverlay) {
  throw new Error("Showing Add buttons should not change the data row count");
}
await page.click('.add-row-btn.cut');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="ct004"]')?.classList.contains("selected"));
await expectText("#saveState", "Unsaved");
await page.click('tbody tr[data-id="ct002"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="ct002"]')?.classList.contains("selection-single"));
await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.waitForFunction(() => !document.querySelector(".data-table tr.selected") && document.querySelector("#detailPanel")?.textContent?.includes("Select a row"));

await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="ct001"]')?.classList.contains("selected"));
const detailLabels = await page.$$eval("#detailPanel label", (nodes) => nodes.map((node) => node.textContent));
for (const hiddenDetail of ["row_type", "id", "parent_id", "order"]) {
  if (detailLabels.includes(hiddenDetail)) throw new Error(`${hiddenDetail} should be hidden in Detail panel`);
}
await page.click('[data-view="promptEdit"]');
await expectCount(".prompt-edit-column", 2);
await expectText('.prompt-edit-column[data-field="image_prompt"] .prompt-token-editor', "extreme close-up");
await expectText('.prompt-edit-column[data-field="video_prompt"] .prompt-token-editor', "slow dolly");
if (await page.locator(".prompt-media-card").count()) throw new Error("PromptEdit should preview only paths written in the editor, not image/audio_file columns");
const imeEditor = page.locator('.prompt-edit-column[data-field="image_prompt"] .prompt-token-editor');
await imeEditor.evaluate((editor) => {
  editor.focus();
  editor.innerText = "";
  editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
  editor.innerText = "テスト";
  editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "テスト", isComposing: true }));
  editor.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "テスト" }));
});
await page.waitForTimeout(250);
const imeText = await imeEditor.evaluate((editor) => editor.innerText.trim());
if (imeText !== "テスト") throw new Error(`IME composition text should not duplicate: ${imeText}`);
await expectText("#saveState", "Unsaved");
await page.click('[data-view="table"]');
await expectText('tbody tr[data-id="ct001"] td[data-column="image_prompt"]', "テスト");
await page.click('[data-view="promptEdit"]');
await page.locator('.prompt-edit-column[data-field="image_prompt"] .prompt-token-editor').fill("media/images/cut001.jpg\nstill prompt revised");
await page.waitForFunction(() => document.querySelector('[data-preview-field="image_prompt"] .prompt-media-card[data-kind="image"]'));
await page.waitForFunction(() => document.querySelector('.prompt-path-token[data-path="media/images/cut001.jpg"]'));
await page.locator('.prompt-edit-column[data-field="video_prompt"] .prompt-token-editor').fill("media/audio/cut001.wav\nvideo prompt revised");
await page.waitForFunction(() => document.querySelector('[data-preview-field="video_prompt"] .prompt-media-card[data-kind="audio"]'));
await page.click('[data-view="table"]');
await expectText('tbody tr[data-id="ct001"] td[data-column="image_prompt"]', "still prompt revised");
await expectText('tbody tr[data-id="ct001"] td[data-column="video_prompt"]', "video prompt revised");
await page.click('[data-view="promptEdit"]');
await page.locator('.prompt-path-token[data-path="media/images/cut001.jpg"]').hover();
await page.waitForFunction(() => !document.querySelector(".prompt-hover-preview")?.hidden);

await page.click('[data-view="assets"]');
await expectText("#assetsView", "Drop asset files here");
if (await page.locator("#addAssetBtn").count()) throw new Error("Assets view should not expose Add Asset");
await dropFiles("#assetsView", [
  { name: "rui.png", type: "image/png" },
  { name: "voice.wav", type: "audio/wav" },
  { name: "ルイ.png", type: "image/png" },
]);
await expectCount(".asset-card", 3);
await page.waitForFunction(() => document.querySelector('.asset-card input[data-asset-field="alias"]')?.value === "rui");
const droppedAssetIds = await page.$$eval(".asset-card", (cards) => cards.map((card) => card.dataset.assetId));
if (new Set(droppedAssetIds).size !== droppedAssetIds.length) throw new Error("Dropped asset card IDs should be unique");
const droppedAssetPaths = await page.$$eval(".asset-card .prompt-media-card[data-path]", (cards) => cards.map((card) => card.dataset.path));
for (const expectedPath of ["assets/rui.png", "assets/voice.wav", "assets/ルイ.png"]) {
  if (!droppedAssetPaths.includes(expectedPath)) throw new Error(`Dropped asset should use assets/ path: ${expectedPath}`);
}
await page.locator('.asset-card').first().click({ position: { x: 20, y: 150 } });
await page.waitForFunction(() => document.querySelectorAll(".asset-card.selected").length === 1);
await page.locator('.asset-card').nth(1).click({ modifiers: process.platform === "darwin" ? ["Meta"] : ["Control"], position: { x: 20, y: 150 } });
await page.waitForFunction(() => document.querySelectorAll(".asset-card.selected").length === 2);
await page.locator('.asset-card').nth(2).click({ modifiers: ["Shift"], position: { x: 20, y: 150 } });
await page.waitForFunction(() => document.querySelectorAll(".asset-card.selected").length === 3);
await page.locator(".asset-card").nth(2).locator(".asset-thumb").click();
await page.waitForFunction(() => document.querySelector('.asset-modal [data-asset-field="path"]')?.value === "assets/ルイ.png");
await page.locator('.asset-modal [data-asset-action="close"]').click();
await page.keyboard.press("Delete");
await expectCount(".asset-card", 0);
await dropFiles("#assetsView", [{ name: "rui.png", type: "image/png" }]);
await expectCount(".asset-card", 1);
await page.locator('.asset-card [data-asset-field="alias"]').fill("rui");
await page.locator('.asset-card [data-asset-field="alias"]').press("Tab");
await page.locator('.asset-card [data-asset-field="title"]').fill("Rui");
await page.locator('.asset-card [data-asset-field="title"]').press("Tab");
await page.click('[data-view="assets"]');
await page.locator(".asset-card .asset-thumb").click();
await expectText(".asset-modal", "Asset");
await page.locator('.asset-modal [data-asset-field="path"]').fill("media/images/cut001.jpg");
await page.locator('.asset-modal [data-asset-field="path"]').press("Tab");
await page.locator('.asset-modal [data-asset-field="note"]').fill("Reusable Rui asset");
await page.locator('.asset-modal [data-asset-field="note"]').press("Tab");
await page.locator('.asset-modal [data-asset-action="close"]').click();
await page.waitForFunction(() => document.querySelector('#assetsView .prompt-media-card[data-kind="image"]'));
await dropFiles("#assetsView", [{ name: "rui-duplicate.png", type: "image/png" }]);
await expectCount(".asset-card", 2);
await page.locator('.asset-card').nth(1).locator('[data-asset-field="alias"]').fill("rui");
await page.locator('.asset-card').nth(1).locator('[data-asset-field="alias"]').press("Tab");
await expectText("#assetsView", "Duplicate aliases");
if (await page.locator('[data-asset-action="duplicate"]').count()) throw new Error("Assets view should not expose Duplicate");
await page.locator(".asset-card").nth(1).click();
await page.keyboard.press("Backspace");
await expectCount(".asset-card", 1);
await page.click('[data-view="promptEdit"]');
const imagePromptEditor = '.prompt-edit-column[data-field="image_prompt"] .prompt-token-editor';
const videoPromptEditor = '.prompt-edit-column[data-field="video_prompt"] .prompt-token-editor';
await clearPromptEditor(imagePromptEditor);
await page.locator(imagePromptEditor).pressSequentially("@rui");
await page.waitForFunction(() => document.querySelector(".asset-suggest")?.textContent?.includes("@rui"));
await page.keyboard.press("Tab");
if ((await promptEditorText(imagePromptEditor)) !== "media/images/cut001.jpg") throw new Error("PromptEdit @ suggestion should replace on line 1");
await clearPromptEditor(imagePromptEditor);
await page.locator(imagePromptEditor).pressSequentially("A");
await page.keyboard.press("Enter");
await page.locator(imagePromptEditor).pressSequentially("@rui");
await page.waitForFunction(() => document.querySelector(".asset-suggest")?.textContent?.includes("@rui"));
await page.keyboard.press("Tab");
if ((await promptEditorText(imagePromptEditor)) !== "A\nmedia/images/cut001.jpg") throw new Error("PromptEdit @ suggestion should replace on line 2 without extra spaces");
await clearPromptEditor(imagePromptEditor);
await page.locator(imagePromptEditor).pressSequentially("A");
await page.keyboard.press("Enter");
await page.locator(imagePromptEditor).pressSequentially("B");
await page.keyboard.press("Enter");
await page.locator(imagePromptEditor).pressSequentially("@rui");
await page.waitForFunction(() => document.querySelector(".asset-suggest")?.textContent?.includes("@rui"));
await page.keyboard.press("Tab");
if ((await promptEditorText(imagePromptEditor)) !== "A\nB\nmedia/images/cut001.jpg") throw new Error("PromptEdit @ suggestion should replace on line 3 without extra spaces");
await page.waitForFunction(() => document.querySelector('[data-preview-field="image_prompt"] .prompt-media-card[data-kind="image"]'));
await clearPromptEditor(videoPromptEditor);
await page.locator(videoPromptEditor).pressSequentially("参照:");
await page.keyboard.press("Enter");
await page.locator(videoPromptEditor).pressSequentially("@rui");
await page.waitForFunction(() => document.querySelector(".asset-suggest")?.textContent?.includes("@rui"));
await page.locator(".asset-suggest button").first().click();
if ((await promptEditorText(videoPromptEditor)) !== "参照:\nmedia/images/cut001.jpg") throw new Error("PromptEdit @ suggestion should replace by mouse click after newline");
await page.click('[data-view="table"]');
await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
const detailImagePrompt = page.locator("#detailPanel textarea").nth(0);
await detailImagePrompt.fill("@rui");
await page.waitForFunction(() => (
  document.querySelector(".asset-suggest")?.textContent?.includes("@rui") ||
  document.querySelectorAll("#detailPanel textarea")[0]?.value.includes("media/images/cut001.jpg")
));
if (await page.locator(".asset-suggest").count()) await page.keyboard.press("Tab");
await page.waitForFunction(() => document.querySelectorAll("#detailPanel textarea")[0]?.value.includes("media/images/cut001.jpg"));
await page.click('[data-view="table"]');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="ct002"]'));
await page.locator("#tableView").evaluate((node) => {
  node.scrollLeft = node.scrollWidth;
});
const tableImagePromptCell = page.locator('tbody tr[data-id="ct002"] td[data-column="image_prompt"]');
await tableImagePromptCell.evaluate((node) => node.scrollIntoView({ block: "center", inline: "center" }));
await tableImagePromptCell.click();
if ((await page.locator('td[data-column="image_prompt"] input').count()) === 0) {
  await tableImagePromptCell.click();
}
await page.locator('td[data-column="image_prompt"] input').click();
await page.keyboard.press("Control+A");
await page.keyboard.press("Backspace");
await page.locator('td[data-column="image_prompt"] input').pressSequentially("@rui");
await page.waitForFunction(() => document.querySelector(".asset-suggest")?.textContent?.includes("@rui"));
await page.keyboard.press("Tab");
await page.keyboard.press("Enter");
await expectText('tbody tr[data-id="ct002"] td[data-column="image_prompt"]', "media/images/cut001.jpg");
const [assetsProjectDownload] = await Promise.all([page.waitForEvent("download"), clickFileAction("save")]);
const assetsProjectEntries = readZipEntries(await readFile(await assetsProjectDownload.path()));
const savedAssets = JSON.parse(assetsProjectEntries.get("assets.json") || "{}");
if (savedAssets.assets?.[0]?.alias !== "rui" || savedAssets.assets?.[0]?.path !== "media/images/cut001.jpg") {
  throw new Error("assets.json should persist registered assets");
}
await page.click('[data-view="table"]');
if ((await page.locator('td[data-column="title"] input').count()) !== 0) {
  throw new Error("First editable cell click should select the row without opening an input");
}
await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
if ((await page.locator('td[data-column="title"] input').count()) === 0) {
  await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
}
await page.locator('td[data-column="title"] input').fill("Edited Smoke Cut");
await page.keyboard.press("Enter");
await expectText('tbody tr[data-id="ct001"] td[data-column="title"]', "Edited Smoke Cut");
await expectText("#saveState", "Unsaved");
await dropFiles('tbody tr[data-id="ct001"]', [{ name: "table-drop.png", type: "image/png" }]);
await expectText('tbody tr[data-id="ct001"] td[data-column="image"]', "table-drop.png");
await dropFiles('tbody tr[data-id="ct001"]', [{ name: "table-drop.wav", type: "audio/wav" }]);
await expectText('tbody tr[data-id="ct001"] td[data-column="audio_file"]', "table-drop.wav");
await page.click('[data-view="storyboard"]');
await dropFiles('.scene-section[data-id="sc001"]', [{ name: "ignored-scene.png", type: "image/png" }]);
await dropFiles('.cut-card[data-id="ct002"]', [
  { name: "story-drop.jpg", type: "image/jpeg" },
  { name: "story-drop.mp3", type: "audio/mpeg" },
]);
await page.click('[data-view="table"]');
await expectText('tbody tr[data-id="ct002"] td[data-column="image"]', "story-drop.jpg");
await expectText('tbody tr[data-id="ct002"] td[data-column="audio_file"]', "story-drop.mp3");
if ((await page.locator('tbody tr[data-id="sc001"] td[data-column="image"]').textContent()).includes("ignored-scene.png")) {
  throw new Error("scene file drop should be ignored");
}
await page.click('[data-view="storyboard"]');
await page.click('.cut-card[data-id="ct003"]', { button: "right" });
await expectText(".table-context-menu", "Duplicate");
await expectText(".table-context-menu", "Delete");
await page.keyboard.press("Escape");
await page.click('[data-view="timeline"]');
await page.click('.timeline-clip.cut[data-id="ct003"]', { button: "right" });
await expectText(".table-context-menu", "Duplicate");
await page.keyboard.press("Escape");
await page.click('[data-view="table"]');

await page.click('[data-toggle-panel="detail"]');
await page.waitForFunction(() => document.querySelector('[data-panel="detail"]')?.classList.contains("collapsed"));
await page.click('[data-toggle-panel="detail"]');
await page.waitForFunction(() => !document.querySelector('[data-panel="detail"]')?.classList.contains("collapsed"));

await page.click("#rightPanelToggle");
await page.waitForFunction(() => document.querySelector(".app-shell")?.classList.contains("right-collapsed"));
await page.click("#rightPanelToggle");
await page.waitForFunction(() => !document.querySelector(".app-shell")?.classList.contains("right-collapsed") && [...document.querySelectorAll("#detailPanel label")].some((label) => label.textContent === "title"));

const rowsBeforeDuplicate = await page.locator(".data-table tbody tr[data-id]").count();
await page.click('tbody tr[data-id="ct004"]', { button: "right" });
await expectText(".table-context-menu", "Duplicate");
await expectText(".table-context-menu", "Delete");
await page.locator(".table-context-menu button", { hasText: "Duplicate" }).click();
await page.waitForFunction((count) => document.querySelectorAll(".data-table tbody tr[data-id]").length === count + 1, rowsBeforeDuplicate);
await page.keyboard.press("Delete");
await page.waitForFunction((count) => document.querySelectorAll(".data-table tbody tr[data-id]").length === count, rowsBeforeDuplicate);

await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
await page.click('tbody tr[data-id="ct002"] td[data-column="title"]', { modifiers: ["Control"] });
await page.click('tbody tr[data-id="ct002"]', { button: "right" });
await expectText(".table-context-menu", "Create Multicut");
await page.click(".table-context-menu button");
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="mc003"]')?.classList.contains("selected"));

await page.click('tbody tr[data-id="mc001"] td[data-column="title"]');
await page.click('tbody tr[data-id="mc002"] td[data-column="title"]', { modifiers: ["Control"] });
await page.keyboard.press("Control+G");
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="sc002"]')?.classList.contains("selected"));

await page.dragAndDrop('tbody tr[data-id="ct001"]', 'tbody tr[data-id="mc002"]');
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("ct001") > rows.indexOf("mc002");
});

const dragProjectRows = [
  expectedHeaders().join("\t"),
  "scene\tsc700\t\t1\tDrag Scene\t\t\t\t\t\t\t\t\t\t\t\t",
  "multicut\tmc701\tsc700\t1\tFirst Multicut\t\t\t\t\t\t\t\t\t\t\t\t",
  "cut\tct701\tmc701\t1\tNested One\t3s\t\t\t\t\t\t\t\t\t\t\t",
  "multicut\tmc702\tsc700\t2\tSecond Multicut\t\t\t\t\t\t\t\t\t\t\t\t",
  "cut\tct702\tmc702\t1\tNested Two\t3s\t\t\t\t\t\t\t\t\t\t\t",
  "cut\tct703\tsc700\t3\tDirect One\t3s\t\t\t\t\t\t\t\t\t\t\t",
  "cut\tct704\tsc700\t4\tDirect Two\t3s\t\t\t\t\t\t\t\t\t\t\t",
].join("\n");
await loadProjectFile("drag-behavior.lctproj", makeStoredZip(new Map([
  ["manifest.json", JSON.stringify({ projectName: "Drag Behavior", mainCutlist: "cutlist.tsv" })],
  ["cutlist.tsv", dragProjectRows],
])));
await expectText("#projectName", "Drag Behavior");
await page.click('[data-view="table"]');
await page.dragAndDrop('tbody tr[data-id="ct704"]', 'tbody tr[data-id="mc701"]');
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("ct704") === rows.indexOf("ct701") + 1;
});
await dispatchDragDrop('tbody tr[data-id="ct704"]', 'tbody tr[data-id="mc702"]', { shiftKey: true, offsetY: 4 });
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("ct704") === rows.indexOf("mc702") - 1 &&
    document.querySelector('tbody tr[data-id="ct704"]')?.classList.contains("direct-cut");
});
await page.locator('tbody tr[data-id="mc702"]').dragTo(page.locator('tbody tr[data-id="ct704"]'), {
  sourcePosition: { x: 20, y: 12 },
  targetPosition: { x: 20, y: 22 },
});
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("mc702") === rows.indexOf("ct704") + 1;
});
await page.click('[data-view="timeline"]');
await dispatchDragDrop('.timeline-clip.cut[data-id="ct703"]', '.timeline-clip.multicut[data-id="mc701"]', { shiftKey: true, offsetX: 8 });
await page.click('[data-view="table"]');
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("ct703") === rows.indexOf("mc701") - 1 &&
    document.querySelector('tbody tr[data-id="ct703"]')?.classList.contains("direct-cut");
});
await page.click('[data-view="storyboard"]');
await page.click('.cut-card[data-id="ct703"]');
await page.click('.cut-card[data-id="ct704"]', { modifiers: ["Control"] });
await page.waitForFunction(() => (
  document.querySelector('.cut-card[data-id="ct703"]')?.classList.contains("selected") &&
  document.querySelector('.cut-card[data-id="ct704"]')?.classList.contains("selected")
));
await page.locator('.cut-card[data-id="ct704"]').dragTo(page.locator('.cut-card[data-id="ct701"]'), {
  sourcePosition: { x: 20, y: 20 },
  targetPosition: { x: 20, y: 8 },
});
await page.waitForFunction(() => {
  const card = document.querySelector('.cut-card[data-id="ct704"]');
  return card?.classList.contains("moved") || card?.classList.contains("flip-animating");
});

const timelineProjectRows = [
  expectedHeaders().join("\t"),
  "scene\tsc500\t\t1\tTimeline Scene\t\t\t\t\t\t\t\t\t\t\t\t",
  ...Array.from({ length: 8 }, (_, index) => {
    const id = `ct50${index + 1}`;
    return `cut\t${id}\tsc500\t${index + 1}\tTimeline Cut ${index + 1}\t5s\t\t\t\t\t\t\t\t\t\t\t`;
  }),
].join("\n");
await loadProjectFile("timeline-selection.lctproj", makeStoredZip(new Map([
  ["manifest.json", JSON.stringify({ projectName: "Timeline Selection", mainCutlist: "cutlist.tsv" })],
  ["cutlist.tsv", timelineProjectRows],
])));
await expectText("#projectName", "Timeline Selection");
await page.click('[data-view="timeline"]');
await page.click('.timeline-clip.cut[data-id="ct501"]');
await page.click('.timeline-clip.cut[data-id="ct503"]', { modifiers: ["Shift"] });
await page.waitForFunction(() => (
  document.querySelector('.timeline-clip.cut[data-id="ct501"]')?.classList.contains("selected") &&
  document.querySelector('.timeline-clip.cut[data-id="ct502"]')?.classList.contains("selected") &&
  document.querySelector('.timeline-clip.cut[data-id="ct503"]')?.classList.contains("selected")
));
await page.keyboard.press("Control+G");
await page.waitForFunction(() => document.querySelector('.timeline-clip.multicut[data-id="mc001"]')?.classList.contains("selected"));
await page.locator(".timeline-seek").evaluate((input) => {
  input.value = "20";
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.click('[data-view="table"]');
await page.click('[data-view="timeline"]');
await page.waitForFunction(() => {
  const stage = document.querySelector(".timeline-stage");
  const track = document.querySelector(".nested-track");
  const playhead = document.querySelector(".playhead");
  if (!stage || !track || !playhead || stage.scrollLeft <= 0) return false;
  const playheadX = track.getBoundingClientRect().left + Number.parseFloat(playhead.style.left || "0");
  const centerX = stage.getBoundingClientRect().left + stage.clientWidth / 2;
  return Math.abs(playheadX - centerX) < 8;
});

const [projectDownload] = await Promise.all([page.waitForEvent("download"), clickFileAction("save")]);
if (!projectDownload.suggestedFilename().endsWith(".lctproj")) throw new Error("Project download filename mismatch");
const projectBytes = await readFile(await projectDownload.path());
expectAgentsMd(readZipEntries(projectBytes).get("AGENTS.md"), "Save");

const [tsvDownload] = await Promise.all([page.waitForEvent("download"), clickFileAction("exportTsv")]);
if (!tsvDownload.suggestedFilename().endsWith("_cutlist.tsv")) throw new Error("TSV download filename mismatch");

const [llmDownload] = await Promise.all([page.waitForEvent("download"), clickFileAction("exportLlmTsv")]);
if (!llmDownload.suggestedFilename().endsWith("_llm.tsv")) throw new Error("LLM TSV download filename mismatch");

const [xmlDownload] = await Promise.all([page.waitForEvent("download"), clickFileAction("exportXml")]);
if (!xmlDownload.suggestedFilename().endsWith("_premiere.xml")) throw new Error("XML download filename mismatch");

await clickFileAction("new");
await expectText("#projectName", "Untitled Project");
await expectCount(".data-table tbody tr[data-id]", 0);

await runTauriWelcomeSmoke(browser);

await browser.close();

async function clickFileAction(action) {
  await page.click("#fileMenuBtn");
  if (action.startsWith("export")) await page.locator(".submenu", { hasText: "Export" }).hover();
  await page.click(`[data-file-action="${action}"]`);
}

async function dropFiles(selector, files) {
  await dropFilesOnPage(page, selector, files);
}

async function dropFilesOnPage(targetPage, selector, files) {
  await targetPage.locator(selector).evaluate((target, files) => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => {
      const droppedFile = new File(["drop-test"], file.name, { type: file.type });
      if (file.path) Object.defineProperty(droppedFile, "path", { value: file.path });
      if (file.webkitRelativePath) Object.defineProperty(droppedFile, "webkitRelativePath", { value: file.webkitRelativePath });
      dataTransfer.items.add(droppedFile);
    });
    target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
  }, files);
}

async function dispatchDragDrop(sourceSelector, targetSelector, options = {}) {
  await page.evaluate(
    ({ sourceSelector, targetSelector, options }) => {
      const source = document.querySelector(sourceSelector);
      const target = document.querySelector(targetSelector);
      if (!source || !target) throw new Error(`missing drag target: ${sourceSelector} -> ${targetSelector}`);
      const dataTransfer = new DataTransfer();
      const makeEvent = (type, node) => {
        const rect = node.getBoundingClientRect();
        const event = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientX: rect.left + (options.offsetX ?? Math.max(1, rect.width / 2)),
          clientY: rect.top + (options.offsetY ?? Math.max(1, rect.height / 2)),
          shiftKey: Boolean(options.shiftKey),
        });
        Object.defineProperty(event, "offsetX", { value: options.offsetX ?? Math.max(1, rect.width / 2) });
        Object.defineProperty(event, "offsetY", { value: options.offsetY ?? Math.max(1, rect.height / 2) });
        return event;
      };
      source.dispatchEvent(makeEvent("dragstart", source));
      target.dispatchEvent(makeEvent("dragover", target));
      target.dispatchEvent(makeEvent("drop", target));
      source.dispatchEvent(makeEvent("dragend", source));
    },
    { sourceSelector, targetSelector, options },
  );
}

async function clearTableCell(rowId, column) {
  const selector = `tbody tr[data-id="${rowId}"] td[data-column="${column}"]`;
  await page.click(selector);
  await page.click(selector);
  await page.locator(`${selector} input`).fill("");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    ({ selector }) => document.querySelector(selector)?.textContent?.trim() === "",
    { selector },
  );
}

async function dragResizeHandle(selector, deltaX) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`resize handle not found: ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + deltaX, y, { steps: 8 });
  await page.mouse.up();
}

async function expectText(selector, text) {
  await page.waitForFunction(
    ({ selector, text }) => document.querySelector(selector)?.textContent?.includes(text),
    { selector, text },
  );
}

async function clearPromptEditor(selector) {
  await page.locator(selector).click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
}

async function promptEditorText(selector) {
  return page.locator(selector).evaluate((editor) => {
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
      node.childNodes.forEach(walk);
    };
    editor.childNodes.forEach(walk);
    return text.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
  });
}

function expectedHeaders() {
  return [
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
}

function expectAgentsMd(content, label) {
  if (!content) throw new Error(`${label} archive should include AGENTS.md`);
  if (!content.includes("# Prepro Enhancer Project Agent Instructions")) throw new Error(`${label} AGENTS.md title mismatch`);
  if (!content.includes(expectedHeaders().join("\t"))) throw new Error(`${label} AGENTS.md should document current cutlist columns`);
  if (!content.includes("scene > cut")) throw new Error(`${label} AGENTS.md should document direct cut hierarchy rules`);
  if (!content.includes("multicut` is optional")) throw new Error(`${label} AGENTS.md should document optional multicut rules`);
  if (!content.includes("100 Japanese characters = 17 seconds")) throw new Error(`${label} AGENTS.md should document dialogue duration rule`);
  if (!content.includes("`.lctproj` is a ZIP archive")) throw new Error(`${label} AGENTS.md should document lctproj zip archive format`);
  if (!content.includes("At the ZIP root, at minimum `manifest.json` and `cutlist.tsv`")) throw new Error(`${label} AGENTS.md should document required zip root files`);
  if (!content.includes("Compress-Archive")) throw new Error(`${label} AGENTS.md should include a PowerShell rearchive example`);
  if (!content.includes("zip -r ../EditedProject.lctproj .")) throw new Error(`${label} AGENTS.md should include a macOS/Linux rearchive example`);
}
async function expectTableHeaders() {
  const headers = await page.$$eval(".data-table th", (nodes) => nodes.map((node) => node.textContent));
  const expected = expectedHeaders().filter((name) => !["row_type", "id", "parent_id", "order"].includes(name));
  if (headers.join("\t") !== expected.join("\t")) throw new Error(`Table headers mismatch: ${headers.join(",")}`);
}

async function ctrlSelectRows(ids) {
  await page.evaluate((rowIds) => {
    rowIds.forEach((id, index) => {
      document
        .querySelector(`tbody tr[data-id="${id}"] td[data-column="title"]`)
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: index > 0 }));
    });
  }, ids);
}

async function runTauriWelcomeSmoke(browser) {
  const recentPath = "C:\\Projects\\Recent Project.lctproj";
  const recentProject = makeStoredZip(
    new Map([
      ["manifest.json", JSON.stringify({ projectName: "Recent Project", mainCutlist: "cutlist.tsv" })],
      ["cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc777\t\t1\tRecent Scene\t\t\t\t\t\t\t\t\t\t\t\t`],
    ]),
  );
  const tauriPage = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
  await installTauriMock(tauriPage, {
    files: [[recentPath, Array.from(recentProject)]],
    mediaFiles: [
      ["C:\\Projects\\media\\absolute-preview.svg", Array.from(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect width="100" height="60" fill="#6fd2ff"/></svg>`))],
      ["C:\\Projects\\media\\relative-preview.svg", Array.from(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect width="100" height="60" fill="#d7ff57"/></svg>`))],
      ["C:\\project\\narushisuto-DK\\assets\\ルイ.png", Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64"))],
    ],
    recent: [{ fileName: "Recent Project.lctproj", path: recentPath, timestamp: "2026-05-24T00:00:00.000Z" }],
  });
  await tauriPage.goto(pathToFileURL(resolve("index.html")).href);
  await tauriPage.locator("#welcomeView").waitFor({ state: "visible" });
  await expectPageText(tauriPage, "#welcomeView", "プロジェクト新規作成");
  await expectPageText(tauriPage, "#welcomeView", "プロジェクトを読み込む");
  await expectPageText(tauriPage, "#recentProjectsList", "Recent Project.lctproj");
  if (await tauriPage.locator(".data-table tbody tr[data-id]").count()) throw new Error("Tauri startup should not load Sample Project rows");
  await tauriPage.click(".recent-project-row");
  await tauriPage.waitForFunction(() => document.querySelector("#welcomeView")?.hidden);
  await expectPageText(tauriPage, "#projectName", "Recent Project");
  await expectPageText(tauriPage, "#counts", "scene 1 / multicut 0 / cut 0");
  await expectPageText(tauriPage, 'tbody tr[data-id="sc777"] td[data-column="title"]', "Recent Scene");
  await tauriPage.evaluate((path) => {
    const updated = window.__makeStoredZip(new Map([
      ["manifest.json", JSON.stringify({ projectName: "Recent Project Changed", mainCutlist: "cutlist.tsv" })],
      ["cutlist.tsv", `${window.__expectedHeaders().join("\t")}\nscene\tsc777\t\t1\tLLM Updated Scene\t\t\t\t\t\t\t\t\t\t\t\t\ncut\tct778\tsc777\t1\tLLM Added Cut\t2s\t\t\t\t\t\t\t\t\t\t\t`],
    ]));
    window.__tauriMockFiles.set(path, Array.from(updated));
  }, recentPath);
  await tauriPage.click("#refreshTsvBtn");
  await expectPageText(tauriPage, "#projectName", "Recent Project");
  await expectPageText(tauriPage, "#counts", "scene 1 / multicut 0 / cut 1");
  await expectPageText(tauriPage, 'tbody tr[data-id="sc777"] td[data-column="title"]', "LLM Updated Scene");
  await tauriPage.click('tbody tr[data-id="sc777"] td[data-column="title"]');
  await tauriPage.click('tbody tr[data-id="sc777"] td[data-column="title"]');
  await tauriPage.locator('tbody tr[data-id="sc777"] td[data-column="title"] input').fill("Unsaved Local Scene");
  await tauriPage.keyboard.press("Enter");
  tauriPage.once("dialog", async (dialog) => {
    if (dialog.type() !== "confirm") throw new Error("Refresh dirty state should ask for confirmation");
    await dialog.dismiss();
  });
  await tauriPage.click("#refreshTsvBtn");
  await expectPageText(tauriPage, 'tbody tr[data-id="sc777"] td[data-column="title"]', "Unsaved Local Scene");
  tauriPage.once("dialog", async (dialog) => {
    if (dialog.type() !== "confirm") throw new Error("Refresh dirty state should ask for confirmation");
    await dialog.accept();
  });
  await tauriPage.click("#refreshTsvBtn");
  await expectPageText(tauriPage, 'tbody tr[data-id="sc777"] td[data-column="title"]', "LLM Updated Scene");
  await tauriPage.evaluate(() => document.querySelector('tbody tr[data-id="ct778"] td[data-column="title"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await tauriPage.click('[data-view="promptEdit"]');
  await tauriPage.locator('.prompt-edit-column[data-field="image_prompt"] .prompt-token-editor').fill("C:\\Projects\\media\\absolute-preview.svg\nmedia/relative-preview.svg\n`project/narushisuto-DK/assets/ルイ.png`");
  await tauriPage.waitForFunction(() => document.querySelectorAll('[data-preview-field="image_prompt"] .prompt-media-card[data-kind="image"] img').length === 3);
  await tauriPage.waitForFunction(() => document.querySelector('.prompt-path-token[data-path="project/narushisuto-DK/assets/ルイ.png"]'));
  await tauriPage.locator('.prompt-path-token[data-path="project/narushisuto-DK/assets/ルイ.png"]').hover();
  await tauriPage.waitForFunction(() => document.querySelector(".prompt-hover-preview img"));
  await tauriPage.click('[data-view="assets"]');
  await dropFilesOnPage(tauriPage, "#assetsView", [
    { name: "local-rui.png", type: "image/png", path: "C:\\Projects\\assets\\local-rui.png" },
    { name: "external-rui.png", type: "image/png", path: "D:\\External\\external-rui.png" },
    { name: "fallback-rui.png", type: "image/png" },
  ]);
  await tauriPage.waitForFunction(() => document.querySelectorAll(".asset-card").length === 3);
  const tauriAssetPaths = await tauriPage.$$eval(".asset-card .prompt-media-card[data-path]", (cards) => cards.map((card) => card.dataset.path));
  for (const expectedPath of ["assets/local-rui.png", "D:/External/external-rui.png", "assets/fallback-rui.png"]) {
    if (!tauriAssetPaths.includes(expectedPath)) throw new Error(`Dropped asset path should preserve project-relative/external policy: ${expectedPath}`);
  }
  await tauriPage.evaluate(() => {
    const target = document.querySelector("#assetsView");
    const rect = target.getBoundingClientRect();
    window.__emitTauriAssetDrop({
      paths: [
        "C:\\Projects\\assets\\episode_001\\BG_恒一_ルイ.png",
        "C:\\Users\\huge2\\Downloads\\ChatGPT Image 2026年5月27日 00_31_09.png",
      ],
      position: { x: rect.left + 20, y: rect.top + 20 },
    });
  });
  await tauriPage.waitForFunction(() => document.querySelectorAll(".asset-card").length === 5);
  const nativeDropAssetPaths = await tauriPage.$$eval(".asset-card .prompt-media-card[data-path]", (cards) => cards.map((card) => card.dataset.path));
  for (const expectedPath of [
    "assets/episode_001/BG_恒一_ルイ.png",
    "C:/Users/huge2/Downloads/ChatGPT Image 2026年5月27日 00_31_09.png",
  ]) {
    if (!nativeDropAssetPaths.includes(expectedPath)) throw new Error(`Native Tauri drop should preserve full path: ${expectedPath}`);
  }
  await tauriPage.evaluate(() => {
    window.__emitTauriAssetDrop({
      paths: ["C:\\Projects\\assets\\ignored.png"],
      position: { x: 2, y: 2 },
    });
  });
  await tauriPage.waitForTimeout(120);
  if ((await tauriPage.locator(".asset-card").count()) !== 5) throw new Error("Native drop outside Assets view should be ignored");
  await tauriPage.locator(".asset-card").nth(1).locator(".asset-thumb").click();
  await tauriPage.waitForFunction(() => document.querySelector('.asset-modal [data-asset-field="path"]')?.value === "D:/External/external-rui.png");
  await tauriPage.locator('.asset-modal [data-asset-action="close"]').click();
  await tauriPage.click('[data-view="table"]');
  let autoBackupDialogSeen = false;
  const autoBackupDialogHandler = (dialog) => {
    autoBackupDialogSeen = true;
    dialog.dismiss();
  };
  tauriPage.on("dialog", autoBackupDialogHandler);
  await tauriPage.evaluate(() => window.createProjectBackup("auto", { notify: "toast" }));
  await tauriPage.waitForFunction(() => document.querySelector(".app-toast.visible")?.textContent?.includes("Auto backup saved"));
  if (autoBackupDialogSeen) throw new Error("Auto backup should use toast instead of browser dialog");
  await tauriPage.waitForFunction(() => document.querySelector(".app-toast")?.hidden, null, { timeout: 6500 });
  tauriPage.off("dialog", autoBackupDialogHandler);
  await tauriPage.evaluate(() => window.createProjectBackup("before-repair", { silent: true }));
  if (await tauriPage.locator(".app-toast.visible").count()) throw new Error("Silent backup should not show a toast");
  for (let index = 0; index < 11; index += 1) {
    tauriPage.once("dialog", (dialog) => dialog.accept());
    await tauriPage.evaluate(() => document.querySelector('[data-file-action="createBackup"]')?.click());
  }
  const backupPaths = await tauriPage.evaluate(() => [...window.__tauriMockFiles.keys()].filter((path) => path.includes("\\.prepro-backups\\Recent Project\\")));
  if (backupPaths.length !== 10) throw new Error(`External backup rotation should keep 10 backups, saw ${backupPaths.length}`);
  const backupEntries = readZipEntries(Buffer.from(await tauriPage.evaluate((path) => window.__tauriMockFiles.get(path), backupPaths[0])));
  if (!backupEntries.has("cutlist.tsv") || [...backupEntries.keys()].some((name) => name.startsWith(".backups/"))) throw new Error("External backup should store a full lctproj without internal .backups");
  await tauriPage.click('tbody tr[data-id="sc777"] td[data-column="title"]');
  await tauriPage.click('tbody tr[data-id="sc777"] td[data-column="title"]');
  await tauriPage.locator('tbody tr[data-id="sc777"] td[data-column="title"] input').fill("Backup Restore Source");
  await tauriPage.keyboard.press("Enter");
  tauriPage.once("dialog", (dialog) => dialog.accept());
  await tauriPage.evaluate(() => document.querySelector('[data-file-action="createBackup"]')?.click());
  await tauriPage.click('tbody tr[data-id="sc777"] td[data-column="title"]');
  await tauriPage.click('tbody tr[data-id="sc777"] td[data-column="title"]');
  await tauriPage.locator('tbody tr[data-id="sc777"] td[data-column="title"] input').fill("After Backup Edit");
  await tauriPage.keyboard.press("Enter");
  tauriPage.once("dialog", (dialog) => dialog.accept());
  await tauriPage.evaluate(() => {
    window.prompt = () => "1";
    document.querySelector('[data-file-action="restoreBackup"]')?.click();
  });
  await expectPageText(tauriPage, 'tbody tr[data-id="sc777"] td[data-column="title"]', "Backup Restore Source");
  await expectPageText(tauriPage, "#saveState", "Unsaved");
  await tauriPage.evaluate(() => {
    const repaired = window.__makeStoredZip(new Map([
      ["manifest.json", JSON.stringify({ projectName: "Broken Project", mainCutlist: "cutlist.tsv" })],
      ["cutlist.tsv", `row_type\tid\tparent_id\torder\ttitle\n\"weird\tdup\tmissing\t\tBroken Row\ncut\tdup\tmissing\t\tDuplicate Row`],
    ]));
    window.__tauriMockFiles.set("C:\\Projects\\Recent Project.lctproj", Array.from(repaired));
  });
  let repairDialogCount = 0;
  const repairDialogHandler = async (dialog) => {
    repairDialogCount += 1;
    await dialog.accept();
    if (repairDialogCount >= 2) tauriPage.off("dialog", repairDialogHandler);
  };
  tauriPage.on("dialog", repairDialogHandler);
  await tauriPage.click("#refreshTsvBtn");
  await expectPageText(tauriPage, "#validationPanel", "duplicate id");
  await tauriPage.close();

  const newPage = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
  await installTauriMock(newPage);
  await newPage.goto(pathToFileURL(resolve("index.html")).href);
  await newPage.locator("#welcomeView").waitFor({ state: "visible" });
  await newPage.click("#welcomeNewProjectBtn");
  await newPage.waitForFunction(() => document.querySelector("#welcomeView")?.hidden);
  const newRecent = await newPage.evaluate(() => JSON.parse(localStorage.getItem("preproEnhancer.recentProjects.v1") || "[]"));
  if (newRecent[0]?.fileName !== "Untitled Project.lctproj") throw new Error("NewProject should add the saved project to recent history");
  if (!newRecent[0]?.path || !newRecent[0]?.timestamp) throw new Error("Recent history should include path and timestamp");
  await newPage.close();

  const missingPage = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
  await installTauriMock(missingPage, {
    recent: [{ fileName: "Missing Project.lctproj", path: "C:\\Missing\\Project.lctproj", timestamp: "2026-05-24T00:00:00.000Z" }],
  });
  missingPage.on("dialog", (dialog) => dialog.accept());
  await missingPage.goto(pathToFileURL(resolve("index.html")).href);
  await missingPage.locator(".recent-project-row").click();
  await missingPage.waitForFunction(() => !document.querySelector(".recent-project-row"));
  await missingPage.close();
}

async function installTauriMock(targetPage, options = {}) {
  await targetPage.addInitScript((config) => {
    window.__expectedHeaders = () => [
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
    window.__makeStoredZip = (files) => {
      const chunks = [];
      const central = [];
      let offset = 0;
      files.forEach((content, name) => {
        const fileName = new TextEncoder().encode(name);
        const raw = typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);
        const local = new Uint8Array(30 + fileName.length + raw.length);
        const view = new DataView(local.buffer);
        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint32(18, raw.length, true);
        view.setUint32(22, raw.length, true);
        view.setUint16(26, fileName.length, true);
        local.set(fileName, 30);
        local.set(raw, 30 + fileName.length);
        chunks.push(local);
        const entry = new Uint8Array(46 + fileName.length);
        const entryView = new DataView(entry.buffer);
        entryView.setUint32(0, 0x02014b50, true);
        entryView.setUint16(4, 20, true);
        entryView.setUint16(6, 20, true);
        entryView.setUint32(20, raw.length, true);
        entryView.setUint32(24, raw.length, true);
        entryView.setUint16(28, fileName.length, true);
        entryView.setUint32(42, offset, true);
        entry.set(fileName, 46);
        central.push(entry);
        offset += local.length;
      });
      const centralSize = central.reduce((sum, item) => sum + item.length, 0);
      const end = new Uint8Array(22);
      const endView = new DataView(end.buffer);
      endView.setUint32(0, 0x06054b50, true);
      endView.setUint16(8, files.size, true);
      endView.setUint16(10, files.size, true);
      endView.setUint32(12, centralSize, true);
      endView.setUint32(16, offset, true);
      const output = new Uint8Array(offset + centralSize + end.length);
      let cursor = 0;
      [...chunks, ...central, end].forEach((chunk) => {
        output.set(chunk, cursor);
        cursor += chunk.length;
      });
      return output;
    };
    const key = "preproEnhancer.recentProjects.v1";
    localStorage.setItem(key, JSON.stringify(config.recent || []));
    const files = new Map((config.files || []).map(([path, bytes]) => [path, bytes]));
    const mediaFiles = new Map((config.mediaFiles || []).map(([path, bytes]) => [path, bytes]));
    window.__tauriMockFiles = files;
    window.__tauriMockMediaFiles = mediaFiles;
    const eventHandlers = new Map();
    window.__emitTauriAssetDrop = (payload) => {
      (eventHandlers.get("asset-file-drop") || []).forEach((handler) => handler({ payload }));
    };
    window.__TAURI__ = {
      event: {
        listen: async (eventName, handler) => {
          const handlers = eventHandlers.get(eventName) || [];
          handlers.push(handler);
          eventHandlers.set(eventName, handlers);
          return () => {
            const index = handlers.indexOf(handler);
            if (index >= 0) handlers.splice(index, 1);
          };
        },
      },
      core: {
        invoke: async (command, args = {}) => {
          if (command === "save_project_as") {
            const path = `C:\\Projects\\${args.defaultName || "Untitled Project.lctproj"}`;
            files.set(path, args.bytes || []);
            return { path, file_name: path.split("\\").pop() };
          }
          if (command === "save_project") {
            files.set(args.path, args.bytes || []);
            return { path: args.path, file_name: args.path.split("\\").pop() };
          }
          if (command === "read_project_file") {
            if (!files.has(args.path)) throw new Error("file not found");
            return { path: args.path, file_name: args.path.split("\\").pop(), bytes: files.get(args.path) };
          }
          if (command === "read_media_file") {
            const projectPath = args.projectPath || args.project_path;
            const mediaPath = args.mediaPath || args.media_path;
            const normalized = mediaPath.replace(/\//g, "\\");
            const base = projectPath.replace(/[\\/][^\\/]+$/, "");
            const candidates = [/^[A-Za-z]:[\\/]/.test(mediaPath) || mediaPath.startsWith("/") ? [mediaPath] : [
              `${base}\\${normalized}`,
              `C:\\${normalized}`,
              mediaPath,
            ]].flat();
            const resolved = candidates.find((path) => mediaFiles.has(path));
            if (!resolved) throw new Error("media not found");
            const bytes = mediaFiles.get(resolved);
            return { path: resolved, file_name: resolved.split(/[\\/]/).pop(), bytes };
          }
          if (command === "pick_asset_file") {
            const path = config.pickAssetPath || "C:\\Projects\\media\\picked-asset.png";
            const bytes = mediaFiles.get(path) || new Uint8Array([137, 80, 78, 71]);
            return { path: "media/picked-asset.png", file_name: path.split(/[\\/]/).pop(), bytes };
          }
          if (command === "save_project_backup") {
            const projectPath = args.projectPath || args.project_path;
            const backupName = args.backupName || args.backup_name;
            const projectName = projectPath.split("\\").pop().replace(/\.lctproj$/i, "");
            const backupPath = projectPath.replace(/\\[^\\]+$/, `\\.prepro-backups\\${projectName}\\${backupName}`);
            files.set(backupPath, args.bytes || []);
            const backupPrefix = projectPath.replace(/\\[^\\]+$/, `\\.prepro-backups\\${projectName}\\`);
            const maxBackups = args.maxBackups || args.max_backups || 10;
            const names = [...files.keys()].filter((path) => path.startsWith(backupPrefix)).sort().reverse();
            names.slice(maxBackups).forEach((path) => files.delete(path));
            return { path: backupPath, file_name: backupName };
          }
          if (command === "list_project_backups") {
            const projectPath = args.projectPath || args.project_path;
            const projectName = projectPath.split("\\").pop().replace(/\.lctproj$/i, "");
            const backupPrefix = projectPath.replace(/\\[^\\]+$/, `\\.prepro-backups\\${projectName}\\`);
            return [...files.keys()]
              .filter((path) => path.startsWith(backupPrefix))
              .sort()
              .reverse()
              .map((path, index) => ({ name: path.split("\\").pop(), path, timestamp: Date.now() - index }));
          }
          if (command === "read_project_backup") {
            const projectPath = args.projectPath || args.project_path;
            const backupName = args.backupName || args.backup_name;
            const projectName = projectPath.split("\\").pop().replace(/\.lctproj$/i, "");
            const backupPath = projectPath.replace(/\\[^\\]+$/, `\\.prepro-backups\\${projectName}\\${backupName}`);
            if (!files.has(backupPath)) throw new Error("backup not found");
            return { path: backupPath, file_name: backupName, bytes: files.get(backupPath) };
          }
          if (command === "open_project") return null;
          if (command === "export_file") return null;
          throw new Error(`unexpected command: ${command}`);
        },
      },
    };
  }, options);
}

async function expectPageText(targetPage, selector, text) {
  await targetPage.waitForFunction(
    ({ selector, text }) => document.querySelector(selector)?.textContent?.includes(text),
    { selector, text },
  );
}

function readZipEntries(bytes) {
  const entries = new Map();
  const endOffset = findEocd(bytes);
  if (endOffset < 0) return entries;
  const count = bytes.readUInt16LE(endOffset + 10);
  let offset = bytes.readUInt32LE(endOffset + 16);
  for (let index = 0; index < count; index += 1) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) break;
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const fileNameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = bytes.subarray(nameStart, nameStart + fileNameLength).toString("utf8").replace(/\\/g, "/").replace(/^\.\//, "");
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    if (method === 0) entries.set(name, bytes.subarray(dataStart, dataStart + compressedSize).toString("utf8"));
    offset = nameStart + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function findEocd(bytes) {
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function makeStoredZip(files) {
  return makeZip(files, 0);
}

function makeZip(files, method) {
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((content, name) => {
    const fileName = Buffer.from(name);
    const raw = Buffer.from(content);
    const data = method === 8 ? deflateRawSync(raw) : raw;
    const local = Buffer.alloc(30 + fileName.length + data.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    fileName.copy(local, 30);
    data.copy(local, 30 + fileName.length);
    chunks.push(local);
    const entry = Buffer.alloc(46 + fileName.length);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(fileName.length, 28);
    entry.writeUInt32LE(offset, 42);
    fileName.copy(entry, 46);
    central.push(entry);
    offset += local.length;
  });
  const centralSize = central.reduce((sum, item) => sum + item.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
}

async function loadProjectFile(name, bytes) {
  await page.locator("#projectInput").setInputFiles({
    name,
    mimeType: "application/zip",
    buffer: bytes,
  });
}

async function expectCount(selector, count) {
  await page.waitForFunction(
    ({ selector, count }) => document.querySelectorAll(selector).length === count,
    { selector, count },
  );
}
