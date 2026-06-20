#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const repo = process.env.GITHUB_REPOSITORY || "";
const token = process.env.GITHUB_TOKEN || "";
const tag = process.env.GITHUB_REF_NAME || process.argv[2] || "";
const outFile = process.argv[3] || "dist/latest.json";

if (!repo) fail("GITHUB_REPOSITORY is required.");
if (!tag) fail("Release tag is required as GITHUB_REF_NAME or the first argument.");
if (!token) fail("GITHUB_TOKEN is required.");

const release = await githubReleaseByTag(tag);
const version = normalizeVersion(release.tag_name || tag);
const installer = findWindowsInstaller(release.assets || []);
if (!installer) fail(`Windows installer asset was not found on the GitHub Release. Assets: ${assetNames(release.assets)}`);
const signatureAsset = findSignatureAsset(release.assets || [], installer.name);
if (!signatureAsset) fail(`Signature asset for ${installer.name} was not found. Assets: ${assetNames(release.assets)}`);

const signature = (await fetchAssetText(signatureAsset)).trim();
const latest = {
  version,
  notes: release.body || "",
  pub_date: release.published_at || release.created_at || new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature,
      url: installer.browser_download_url,
    },
  },
};

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(latest, null, 2)}\n`);
console.log(`Wrote ${outFile} for ${version}`);

function normalizeVersion(value) {
  return String(value || "").replace(/^v/i, "");
}

function findWindowsInstaller(assets) {
  const candidates = assets.filter((asset) => /\.(msi|exe|nsis\.zip)$/i.test(asset.name || ""));
  return candidates.find((asset) => /x64|x86_64|amd64/i.test(asset.name || "")) || candidates[0] || null;
}

function findSignatureAsset(assets, installerName) {
  const exact = assets.find((asset) => asset.name === `${installerName}.sig`);
  if (exact) return exact;
  const baseName = String(installerName || "").replace(/\.(msi|exe|zip)$/i, "");
  return assets.find((asset) => String(asset.name || "").startsWith(baseName) && String(asset.name || "").endsWith(".sig"))
    || assets.find((asset) => String(asset.name || "").endsWith(".sig"));
}

async function githubReleaseByTag(tagName) {
  const tagUrl = `https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tagName)}`;
  const direct = await githubJsonOrNull(tagUrl);
  if (direct) return direct;
  const releases = await githubJson(`https://api.github.com/repos/${repo}/releases?per_page=100`);
  const release = Array.isArray(releases) ? releases.find((item) => item.tag_name === tagName) : null;
  if (!release) fail(`GitHub Release for ${tagName} was not found. Draft releases may need contents:write permission.`);
  return release;
}

async function githubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "prepro-enhancer-release-script",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) fail(`GitHub API request failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function githubJsonOrNull(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "prepro-enhancer-release-script",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) fail(`GitHub API request failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function fetchAssetText(asset) {
  if (asset.url) {
    const response = await fetch(asset.url, {
      headers: {
        Accept: "application/octet-stream",
        Authorization: `Bearer ${token}`,
        "User-Agent": "prepro-enhancer-release-script",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) fail(`Signature asset download failed: ${response.status} ${await response.text()}`);
    return response.text();
  }
  if (asset.browser_download_url?.startsWith("file:")) return readFile(new URL(asset.browser_download_url), "utf8");
  const response = await fetch(asset.browser_download_url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "prepro-enhancer-release-script",
    },
  });
  if (!response.ok) fail(`Signature asset download failed: ${response.status} ${await response.text()}`);
  return response.text();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assetNames(assets = []) {
  return assets.map((asset) => asset.name).filter(Boolean).join(", ") || "(none)";
}
