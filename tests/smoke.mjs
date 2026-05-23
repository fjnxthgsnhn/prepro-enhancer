import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

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
await expectCount(".clip", 3);
await expectText(".timeline", "顕微鏡の寄り");
await page.click("#playBtn");
await page.waitForTimeout(250);
await expectText("#playBtn", "Stop");
await page.click("#playBtn");

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

await page.click('[data-toggle-panel="detail"]');
await page.waitForFunction(() => document.querySelector('[data-panel="detail"]')?.classList.contains("collapsed"));
await page.click('[data-toggle-panel="detail"]');
await page.waitForFunction(() => !document.querySelector('[data-panel="detail"]')?.classList.contains("collapsed"));

await page.click("#rightPanelToggle");
await page.waitForFunction(() => document.querySelector(".app-shell")?.classList.contains("right-collapsed"));
await page.click("#rightPanelToggle");
await page.waitForFunction(() => !document.querySelector(".app-shell")?.classList.contains("right-collapsed") && [...document.querySelectorAll("#detailPanel label")].some((label) => label.textContent === "title"));

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

async function expectText(selector, text) {
  await page.waitForFunction(
    ({ selector, text }) => document.querySelector(selector)?.textContent?.includes(text),
    { selector, text },
  );
}

async function expectCount(selector, count) {
  await page.waitForFunction(
    ({ selector, count }) => document.querySelectorAll(selector).length === count,
    { selector, count },
  );
}
