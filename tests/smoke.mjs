import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { deflateRawSync } from "node:zlib";

const browser = await chromium.launch();
const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });

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
await expectText("#counts", "scene 1 / multicut 1 / cut 1");
await expectCount(".data-table tbody tr[data-id]", 3);
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
await expectText("#counts", "scene 1 / multicut 1 / cut 1");
await expectText(".data-table", "Imported Scene");
await expectText(".data-table", "Imported Multicut");
await expectText('tbody tr[data-id="ct920"] td[data-column="title"]', "Orphan Cut");
await expectText("#validationPanel", "Imported Multicut");
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
await expectText(".storyboard", "顕微鏡の寄り");

await page.click('[data-view="timeline"]');
await expectCount(".timeline-preview", 1);
await expectCount(".timeline-seek", 1);
await expectCount(".timeline-clip.scene", 1);
await expectCount(".timeline-clip.multicut", 2);
await expectCount(".timeline-clip.cut", 3);
await expectCount(".timeline-clip.cut .clip-resize-handle", 3);
await expectCount(".timeline-clip.scene .clip-resize-handle", 0);
await expectCount(".timeline-clip.multicut .clip-resize-handle", 0);
await expectText(".timeline", "顕微鏡の寄り");
await page.waitForFunction(() => {
  const preview = document.querySelector(".timeline-preview");
  return preview && Math.abs(preview.getBoundingClientRect().width / preview.getBoundingClientRect().height - 16 / 9) < 0.03;
});
await page.click("#playBtn");
await page.waitForTimeout(250);
await expectText("#playBtn", "Stop");
await expectCount(".timeline-clip.scene", 1);
await expectCount(".timeline-clip.multicut", 2);
await expectCount(".timeline-clip.cut", 3);
await page.keyboard.press("Space");
await expectText("#playBtn", "Play");
await page.locator(".timeline-seek").fill("4");
await page.waitForFunction(() => Number(document.querySelector(".timeline-seek")?.value || 0) >= 4);
await expectCount(".playhead-handle", 1);
await page.locator(".playhead-handle").dragTo(page.locator(".timeline-stage"), {
  sourcePosition: { x: 6, y: 6 },
  targetPosition: { x: 320, y: 50 },
});
await page.waitForFunction(() => Number(document.querySelector(".timeline-seek")?.value || 0) > 0.5);
await page.click('[data-view="table"]');
await clearTableCell("ct001", "image");
await clearTableCell("ct002", "image");
await clearTableCell("ct003", "image");
await page.click('[data-view="timeline"]');
await page.locator(".timeline-seek").fill("1");
await page.waitForFunction(() => {
  const preview = document.querySelector(".timeline-preview");
  const text = document.querySelector(".timeline-text-preview");
  return preview && text && !preview.querySelector("img") && text.textContent.includes("title");
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
if ((await page.locator('td[data-column="title"] input').count()) !== 0) {
  throw new Error("First editable cell click should select the row without opening an input");
}
await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
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

await browser.close();

async function clickFileAction(action) {
  await page.click("#fileMenuBtn");
  if (action.startsWith("export")) await page.hover(".submenu");
  await page.click(`[data-file-action="${action}"]`);
}

async function dropFiles(selector, files) {
  await page.locator(selector).evaluate((target, files) => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => {
      dataTransfer.items.add(new File(["drop-test"], file.name, { type: file.type }));
    });
    target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
  }, files);
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
  if (!content.includes("scene > multicut > cut")) throw new Error(`${label} AGENTS.md should document hierarchy rules`);
  if (!content.includes("100文字で17秒")) throw new Error(`${label} AGENTS.md should document dialogue duration rule`);
}

async function expectTableHeaders() {
  const headers = await page.$$eval(".data-table th", (nodes) => nodes.map((node) => node.textContent));
  const expected = expectedHeaders().filter((name) => !["row_type", "id", "parent_id", "order"].includes(name));
  if (headers.join("\t") !== expected.join("\t")) throw new Error(`Table headers mismatch: ${headers.join(",")}`);
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
