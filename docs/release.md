# Prepro Enhancer Release Guide

This app uses `tauri-plugin-updater` and a GitHub Pages hosted `latest.json` file for free update checks.

## One-time setup

1. Generate a Tauri updater signing key on a trusted machine:

```powershell
npx tauri signer generate -w .\prepro-enhancer-updater.key
```

2. Copy the generated public key into `src-tauri/tauri.conf.json` at `plugins.updater.pubkey`.
3. Add the private key content to the GitHub repository secret `TAURI_SIGNING_PRIVATE_KEY`.
4. If the key has a password, add it to `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. If it is empty, create the secret with an empty value only if GitHub requires it for the workflow.
5. Do not commit the private key file or password.
6. In GitHub Pages settings, set the source to `GitHub Actions`.

## Release flow

1. Update versions in `package.json` and `src-tauri/tauri.conf.json`.
2. Run local checks:

```powershell
npm run check
npm run tauri:check
npm run tauri:build
```

3. Create and push a version tag:

```powershell
git tag v0.1.1
git push origin v0.1.1
```

4. The release workflow builds the Windows package, attaches the installer and `.sig` files to a draft GitHub Release, generates `latest.json`, and deploys it to GitHub Pages.
5. Review the draft release assets and publish the release when ready.

## Updater metadata

The app checks:

```text
https://fjnxthgsnhn.github.io/prepro-enhancer/latest.json
```

Expected shape:

```json
{
  "version": "0.1.1",
  "pub_date": "2026-06-20T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/fjnxthgsnhn/prepro-enhancer/releases/download/v0.1.1/..."
    }
  }
}
```

The public key in `tauri.conf.json` must match the private key used by the workflow. A mismatched key causes the updater to reject the package.
