import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Buffer } from "node:buffer";

const results = [];
const browser = await chromium.launch();

await experiment("baseline app reaches steady state", async () => {
  const page = await newAppPage();
  await expectText(page, "#projectName", "Sample Project");
  await expectText(page, "#counts", "scene 1 / multicut 2 / cut 3");
  await page.close();
});

await experiment("broken lctproj keeps current project state", async () => {
  const page = await newAppPage();
  const dialogMessage = await loadProjectExpectDialog(page, "broken.lctproj", Buffer.from("not a zip"));
  if (!/ZIP|manifest|cutlist/i.test(dialogMessage)) throw new Error(`unexpected alert: ${dialogMessage}`);
  await expectText(page, "#projectName", "Sample Project");
  await expectText(page, "#counts", "scene 1 / multicut 2 / cut 3");
  await page.close();
});

await experiment("missing manifest and cutlist fail without state corruption", async () => {
  const page = await newAppPage();
  await loadProjectExpectDialog(page, "no-manifest.lctproj", makeStoredZip(new Map([["cutlist.tsv", emptyTsv()]])));
  await expectText(page, "#projectName", "Sample Project");
  await loadProjectExpectDialog(page, "no-cutlist.lctproj", makeStoredZip(new Map([["manifest.json", JSON.stringify({ projectName: "No Cutlist" })]])));
  await expectText(page, "#projectName", "Sample Project");
  await page.close();
});

await experiment("wrapped, header-only, orphan, quoted, and sjis cutlists load", async () => {
  const page = await newAppPage();
  await loadProjectFile(page, "wrapped.lctproj", makeStoredZip(new Map([
    ["project/manifest.json", JSON.stringify({ projectName: "Wrapped Chaos", mainCutlist: "cutlist.tsv" })],
    ["project/cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc991\t\t1\tWrapped Scene\t\t\t\t\t\t\t\t\t\t\t\t`],
  ])));
  await expectText(page, "#projectName", "Wrapped Chaos");
  await expectText(page, "#counts", "scene 1 / multicut 0 / cut 0");

  await loadProjectFile(page, "empty.lctproj", makeStoredZip(new Map([
    ["manifest.json", JSON.stringify({ projectName: "Empty Chaos", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", emptyTsv()],
  ])));
  await expectText(page, "#counts", "scene 0 / multicut 0 / cut 0");

  await loadProjectFile(page, "orphan.lctproj", makeStoredZip(new Map([
    ["manifest.json", JSON.stringify({ projectName: "Orphan Chaos", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", `${expectedHeaders().join("\t")}\ncut\tct991\tmissing\t1\tOrphan\t2s\t\t\t\t\t\t\t\t\t\t\t`],
  ])));
  await expectText(page, "#counts", "scene 1 / multicut 0 / cut 1");
  await expectText(page, ".validation-panel", "Imported");

  await loadProjectFile(page, "quoted.lctproj", makeStoredZip(new Map([
    ["manifest.json", JSON.stringify({ projectName: "Quoted Chaos", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", `${expectedHeaders().join("\t")}\nscene\tsc992\t\t1\tQuoted Scene\t\t\t\t\t\t\t\t\t\t\t\t\ncut\tct992\tsc992\t1\t\"Quoted\tCut\"\t2s\t\t\t\t\t\t\t\t\t\t\t\"line1\nline2\"`],
  ])));
  await expectText(page, 'tbody tr[data-id="ct992"] td[data-column="title"]', "Quoted\tCut");

  const sjisTsv = Buffer.concat([
    Buffer.from(`${expectedHeaders().join("\t")}\nscene\tsc993\t\t1\t`, "ascii"),
    Buffer.from([0x82, 0xa0]),
    Buffer.from("\t\t\t\t\t\t\t\t\t\t\t\t", "ascii"),
  ]);
  await loadProjectFile(page, "sjis.lctproj", makeStoredZip(new Map([
    ["manifest.json", JSON.stringify({ projectName: "SJIS Chaos", mainCutlist: "cutlist.tsv" })],
    ["cutlist.tsv", sjisTsv],
  ])));
  await expectText(page, "#projectName", "SJIS Chaos");
  await page.close();
});

await experiment("direct TSV import clears search and restores visible table", async () => {
  const page = await newAppPage();
  await page.fill("#searchInput", "no-match-query");
  await loadPlainTsv(page, "direct.tsv", `${expectedHeaders().join("\t")}\nscene\tsc994\t\t1\tDirect Scene\t\t\t\t\t\t\t\t\t\t\t\t`);
  await expectText(page, "#projectName", "direct");
  await expectText(page, "#counts", "scene 1 / multicut 0 / cut 0");
  const search = await page.locator("#searchInput").inputValue();
  if (search !== "") throw new Error("search should be cleared after TSV import");
  await page.close();
});

await experiment("timeline scroll scrub and preview stay synchronized", async () => {
  const page = await newAppPage();
  await page.click('[data-view="timeline"]');
  await page.evaluate(() => {
    document.querySelector(".nested-track").style.width = "1800px";
    const stage = document.querySelector(".timeline-stage");
    stage.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 360 }));
  });
  await page.waitForFunction(() => document.querySelector(".timeline-stage")?.scrollLeft > 0);
  const click = await page.locator(".timeline-stage").evaluate((stage) => {
    const rect = stage.getBoundingClientRect();
    return { x: rect.left + 160, y: rect.top + 28 };
  });
  await page.mouse.click(click.x, click.y);
  await page.waitForFunction((x) => {
    const track = document.querySelector(".nested-track");
    const playhead = document.querySelector(".playhead");
    const viewportX = track.getBoundingClientRect().left + Number.parseFloat(playhead.style.left || "0");
    return Math.abs(viewportX - x) < 8;
  }, click.x);
  await page.waitForFunction(() => {
    const preview = document.querySelector(".timeline-preview");
    const seek = Number(document.querySelector(".timeline-seek")?.value || 0);
    return preview?.dataset.cutId && seek >= 0;
  });
  await page.click("#playBtn");
  const scrollLeft = await page.locator(".timeline-stage").evaluate((stage) => stage.scrollLeft);
  await page.waitForTimeout(200);
  await page.waitForFunction((left) => Math.abs(document.querySelector(".timeline-stage")?.scrollLeft - left) < 2, scrollLeft);
  await page.keyboard.press("Space");
  await page.close();
});

await experiment("media drops target only cuts and project archive excludes dropped file payloads", async () => {
  const page = await newAppPage();
  const beforeSceneImage = await cellText(page, "sc001", "image");
  await dropFiles(page, 'tbody tr[data-id="sc001"]', [{ name: "scene.png", type: "image/png" }]);
  if ((await cellText(page, "sc001", "image")) !== beforeSceneImage) throw new Error("scene file drop should be ignored");

  await dropFiles(page, 'tbody tr[data-id="ct001"]', [
    { name: "drop.png", type: "image/png" },
    { name: "drop.wav", type: "audio/wav" },
  ]);
  await expectText(page, 'tbody tr[data-id="ct001"] td[data-column="image"]', "drop.png");
  await expectText(page, 'tbody tr[data-id="ct001"] td[data-column="audio_file"]', "drop.wav");

  const [download] = await Promise.all([page.waitForEvent("download"), clickFileAction(page, "save")]);
  const entries = readZipEntries(await download.path().then((path) => import("node:fs/promises").then(({ readFile }) => readFile(path))));
  if ([...entries.keys()].some((name) => /drop\.(png|wav)$/i.test(name))) throw new Error("dropped file payload should not be embedded in lctproj");
  await page.close();
});

await experiment("Tauri recent project missing path is removed", async () => {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
  page.on("dialog", (dialog) => dialog.accept());
  await page.addInitScript(() => {
    localStorage.setItem("preproEnhancer.recentProjects.v1", JSON.stringify([
      { fileName: "Missing.lctproj", path: "C:\\Missing\\Missing.lctproj", timestamp: "2026-05-24T00:00:00.000Z" },
    ]));
    window.__TAURI__ = {
      core: {
        invoke: async (command) => {
          if (command === "read_project_file") throw new Error("file not found");
          if (command === "open_project") return null;
          return null;
        },
      },
    };
  });
  await page.goto(pathToFileURL(resolve("index.html")).href);
  await page.locator(".recent-project-row").click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("preproEnhancer.recentProjects.v1") || "[]").length === 0);
  await page.close();
});

await browser.close();

const failed = results.filter((result) => result.status === "failed");
for (const result of results) {
  console.log(`${result.status === "passed" ? "PASS" : "FAIL"} ${result.name}${result.error ? `: ${result.error}` : ""}`);
}
if (failed.length) {
  throw new Error(`${failed.length} chaos experiment(s) failed`);
}

async function experiment(name, fn) {
  try {
    await fn();
    results.push({ name, status: "passed" });
  } catch (error) {
    results.push({ name, status: "failed", error: error.message || String(error) });
  }
}

async function newAppPage() {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
  await page.goto(pathToFileURL(resolve("index.html")).href);
  await expectText(page, "#projectName", "Sample Project");
  return page;
}

async function loadProjectExpectDialog(page, name, buffer) {
  const dialogPromise = page.waitForEvent("dialog");
  await loadProjectFile(page, name, buffer);
  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog.accept();
  return message;
}

async function loadProjectFile(page, name, buffer) {
  await page.locator("#projectInput").setInputFiles({ name, mimeType: "application/zip", buffer });
}

async function loadPlainTsv(page, name, content) {
  await page.locator("#projectInput").setInputFiles({ name, mimeType: "text/tab-separated-values", buffer: Buffer.from(content, "utf8") });
}

async function clickFileAction(page, action) {
  await page.click("#fileMenuBtn");
  if (action.startsWith("export")) await page.hover(".submenu");
  await page.click(`[data-file-action="${action}"]`);
}

async function dropFiles(page, selector, files) {
  await page.locator(selector).evaluate((target, files) => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(new File(["drop-test"], file.name, { type: file.type })));
    target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
  }, files);
}

async function expectText(page, selector, text) {
  await page.waitForFunction(
    ({ selector, text }) => document.querySelector(selector)?.textContent?.includes(text),
    { selector, text },
  );
}

async function cellText(page, rowId, column) {
  return page.locator(`tbody tr[data-id="${rowId}"] td[data-column="${column}"]`).textContent();
}

function expectedHeaders() {
  return ["row_type", "id", "parent_id", "order", "title", "duration", "scene", "subject", "composition", "action", "camera", "dialogue", "image", "audio_file", "image_prompt", "video_prompt", "note"];
}

function emptyTsv() {
  return expectedHeaders().join("\t");
}

function makeStoredZip(files) {
  return makeZip(files, 0);
}

function makeZip(files, method) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of files.entries()) {
    const nameBuffer = Buffer.from(name, "utf8");
    const source = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    const data = source;
    const crc = crc32(source);
    const local = Buffer.alloc(30 + nameBuffer.length + data.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(source.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    nameBuffer.copy(local, 30);
    data.copy(local, 30 + nameBuffer.length);
    chunks.push(local);
    const entry = Buffer.alloc(46 + nameBuffer.length);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(source.length, 24);
    entry.writeUInt16LE(nameBuffer.length, 28);
    entry.writeUInt32LE(offset, 42);
    nameBuffer.copy(entry, 46);
    central.push(entry);
    offset += local.length;
  }
  const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
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
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (bytes.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

function crc32(data) {
  let crc = -1;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}
