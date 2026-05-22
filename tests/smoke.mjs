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
await expectCount(".data-table tbody tr", 6);
await expectCount(".tree-node", 6);
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
await expectText(".cut-card", "顕微鏡の寄り");

await page.click('[data-view="timeline"]');
await expectCount(".clip", 3);
await expectText(".clip", "顕微鏡の寄り");
await page.click("#playBtn");
await page.waitForTimeout(250);
await expectText("#playBtn", "Stop");
await page.click("#playBtn");

await page.click('[data-view="table"]');
await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.click('tbody tr[data-id="sc001"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelectorAll(".data-table tr.selection-range").length === 6);
await page.click('tbody tr[data-id="mc001"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelectorAll(".data-table tr.selection-range").length === 3);
await page.click('tbody tr[data-id="ct002"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="ct002"]')?.classList.contains("selection-single"));
await page.click("#tableView", { position: { x: 12, y: 780 } });
await page.waitForFunction(() => !document.querySelector(".data-table tr.selected") && document.querySelector("#detailPanel")?.textContent?.includes("Select a row"));

await page.click('tbody tr[data-id="ct001"] td[data-column="title"]');
await page.waitForFunction(() => document.querySelector('tbody tr[data-id="ct001"]')?.classList.contains("selected"));
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

await page.dragAndDrop('tbody tr[data-id="ct001"]', 'tbody tr[data-id="mc002"]');
await page.waitForFunction(() => {
  const rows = [...document.querySelectorAll(".data-table tbody tr")].map((row) => row.dataset.id);
  return rows.indexOf("ct001") > rows.indexOf("mc002");
});

const [tsvDownload] = await Promise.all([page.waitForEvent("download"), page.click("#saveTsvBtn")]);
if (!tsvDownload.suggestedFilename().endsWith("_cutlist.tsv")) throw new Error("TSV download filename mismatch");

const [llmDownload] = await Promise.all([page.waitForEvent("download"), page.click("#exportLlmTsvBtn")]);
if (!llmDownload.suggestedFilename().endsWith("_llm.tsv")) throw new Error("LLM TSV download filename mismatch");

const [projectDownload] = await Promise.all([page.waitForEvent("download"), page.click("#exportProjectBtn")]);
if (!projectDownload.suggestedFilename().endsWith(".lctproj")) throw new Error("Project download filename mismatch");

const [xmlDownload] = await Promise.all([page.waitForEvent("download"), page.click("#exportXmlBtn")]);
if (!xmlDownload.suggestedFilename().endsWith("_premiere.xml")) throw new Error("XML download filename mismatch");

await browser.close();

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
