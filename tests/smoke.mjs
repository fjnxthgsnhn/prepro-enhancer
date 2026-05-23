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

async function expectCount(selector, count) {
  await page.waitForFunction(
    ({ selector, count }) => document.querySelectorAll(selector).length === count,
    { selector, count },
  );
}
