#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::{collections::{HashMap, HashSet}, fs, io::Write, path::{Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}};
use tauri::{DragDropEvent, Emitter, Manager, RunEvent, WindowEvent};

#[derive(Serialize)]
struct OpenedFile {
    path: String,
    file_name: String,
    bytes: Vec<u8>,
}

#[derive(Serialize)]
struct SavedFile {
    path: String,
    file_name: String,
}

#[derive(Serialize)]
struct BackupFile {
    name: String,
    path: String,
    timestamp: u64,
}

#[derive(Serialize)]
struct FileSearchResult {
    name: String,
    paths: Vec<String>,
}

#[derive(Clone, Serialize)]
struct AssetDropPayload {
    #[serde(rename = "type")]
    event_type: String,
    paths: Vec<String>,
    position: Option<AssetDropPosition>,
    scale_factor: f64,
}

#[derive(Clone, Serialize)]
struct AssetDropPosition {
    x: f64,
    y: f64,
}

#[tauri::command]
fn open_project() -> Result<Option<OpenedFile>, String> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Prepro project or TSV", &["lctproj", "tsv", "txt"])
        .pick_file()
    else {
        return Ok(None);
    };
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    Ok(Some(OpenedFile {
        file_name: file_name(&path),
        path: path.to_string_lossy().to_string(),
        bytes,
    }))
}

#[tauri::command]
fn save_project(path: String, bytes: Vec<u8>) -> Result<Option<SavedFile>, String> {
    let path = PathBuf::from(path);
    atomic_write(&path, &bytes)?;
    Ok(Some(saved_file(path)))
}

#[tauri::command]
fn save_project_as(default_name: String, bytes: Vec<u8>) -> Result<Option<SavedFile>, String> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Prepro project", &["lctproj"])
        .set_file_name(&default_name)
        .save_file()
    else {
        return Ok(None);
    };
    let path = ensure_extension(path, "lctproj");
    atomic_write(&path, &bytes)?;
    Ok(Some(saved_file(path)))
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path.parent().ok_or_else(|| "Save path has no parent directory.".to_string())?;
    let stem = path.file_name().and_then(|name| name.to_str()).unwrap_or("project.lctproj");
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error| error.to_string())?.as_nanos();
    let temp_path = parent.join(format!(".{stem}.{}.{}.tmp", std::process::id(), nonce));
    let result = (|| -> Result<(), String> {
        let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&temp_path).map_err(|error| error.to_string())?;
        file.write_all(bytes).map_err(|error| error.to_string())?;
        file.sync_all().map_err(|error| error.to_string())?;
        drop(file);
        replace_file(&temp_path, path)
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temp_path);
    }
    result
}

#[cfg(not(windows))]
fn replace_file(source: &Path, target: &Path) -> Result<(), String> {
    fs::rename(source, target).map_err(|error| error.to_string())
}

#[cfg(windows)]
fn replace_file(source: &Path, target: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    const MOVEFILE_REPLACE_EXISTING: u32 = 0x1;
    const MOVEFILE_WRITE_THROUGH: u32 = 0x8;
    #[link(name = "Kernel32")]
    extern "system" {
        fn MoveFileExW(existing_file_name: *const u16, new_file_name: *const u16, flags: u32) -> i32;
    }
    let source_wide: Vec<u16> = source.as_os_str().encode_wide().chain(Some(0)).collect();
    let target_wide: Vec<u16> = target.as_os_str().encode_wide().chain(Some(0)).collect();
    let moved = unsafe { MoveFileExW(source_wide.as_ptr(), target_wide.as_ptr(), MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH) };
    if moved == 0 { Err(std::io::Error::last_os_error().to_string()) } else { Ok(()) }
}

#[tauri::command]
fn read_project_file(path: String) -> Result<OpenedFile, String> {
    let path = PathBuf::from(path);
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    Ok(OpenedFile {
        file_name: file_name(&path),
        path: path.to_string_lossy().to_string(),
        bytes,
    })
}

#[tauri::command]
fn read_media_file(project_path: String, media_path: String) -> Result<OpenedFile, String> {
    let media_path = PathBuf::from(&media_path);
    let path = if media_path.is_absolute() {
        media_path.clone()
    } else {
        let project_path = PathBuf::from(project_path);
        let parent = project_path.parent().ok_or_else(|| "Project path has no parent directory.".to_string())?;
        resolve_relative_media_path(parent, &media_path)
    };
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    Ok(OpenedFile {
        file_name: file_name(&path),
        path: path.to_string_lossy().to_string(),
        bytes,
    })
}

#[tauri::command]
fn pick_asset_file(_project_path: String) -> Result<Option<OpenedFile>, String> {
    let Some(path) = rfd::FileDialog::new().pick_file() else {
        return Ok(None);
    };
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    Ok(Some(OpenedFile {
        file_name: file_name(&path),
        path: path.to_string_lossy().to_string(),
        bytes,
    }))
}

fn resolve_relative_media_path(project_dir: &Path, media_path: &Path) -> PathBuf {
    let direct = project_dir.join(media_path);
    if direct.exists() {
        return direct;
    }
    let mut current = Some(project_dir);
    while let Some(dir) = current {
        let candidate = dir.join(media_path);
        if candidate.exists() {
            return candidate;
        }
        current = dir.parent();
    }
    direct
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    PathBuf::from(path).exists()
}

#[tauri::command]
fn pick_repair_root() -> Result<Option<SavedFile>, String> {
    let Some(path) = rfd::FileDialog::new().pick_folder() else {
        return Ok(None);
    };
    Ok(Some(saved_file(path)))
}

#[tauri::command]
fn find_files_by_names(root: String, names: Vec<String>) -> Result<Vec<FileSearchResult>, String> {
    const MAX_RESULTS_PER_NAME: usize = 8;
    const MAX_VISITED_ENTRIES: usize = 50_000;
    let wanted: HashSet<String> = names
        .into_iter()
        .map(|name| name.to_lowercase())
        .filter(|name| !name.is_empty())
        .collect();
    if wanted.is_empty() {
        return Ok(Vec::new());
    }
    let mut results: HashMap<String, Vec<String>> = wanted.iter().map(|name| (name.clone(), Vec::new())).collect();
    let mut stack = vec![PathBuf::from(root)];
    let mut visited = 0usize;
    while let Some(dir) = stack.pop() {
        if visited >= MAX_VISITED_ENTRIES {
            break;
        }
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            if visited >= MAX_VISITED_ENTRIES {
                break;
            }
            visited += 1;
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();
            if file_name.starts_with('.') {
                continue;
            }
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            if file_type.is_dir() {
                stack.push(path);
                continue;
            }
            if !file_type.is_file() {
                continue;
            }
            let key = file_name.to_lowercase();
            if let Some(paths) = results.get_mut(&key) {
                if paths.len() < MAX_RESULTS_PER_NAME {
                    paths.push(path.to_string_lossy().to_string());
                }
            }
        }
    }
    let mut list: Vec<FileSearchResult> = results
        .into_iter()
        .map(|(name, paths)| FileSearchResult { name, paths })
        .collect();
    list.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(list)
}

#[tauri::command]
fn save_project_backup(project_path: String, backup_name: String, bytes: Vec<u8>, max_backups: usize) -> Result<SavedFile, String> {
    let project_path = PathBuf::from(project_path);
    let backup_dir = backup_dir_for_project(&project_path)?;
    fs::create_dir_all(&backup_dir).map_err(|error| error.to_string())?;
    let backup_path = backup_dir.join(safe_backup_name(&backup_name));
    fs::write(&backup_path, bytes).map_err(|error| error.to_string())?;
    prune_project_backups(&backup_dir, max_backups)?;
    Ok(saved_file(backup_path))
}

#[tauri::command]
fn list_project_backups(project_path: String) -> Result<Vec<BackupFile>, String> {
    let project_path = PathBuf::from(project_path);
    let backup_dir = backup_dir_for_project(&project_path)?;
    if !backup_dir.exists() {
        return Ok(Vec::new());
    }
    let mut backups = backup_files(&backup_dir)?;
    backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp).then_with(|| b.name.cmp(&a.name)));
    Ok(backups)
}

#[tauri::command]
fn read_project_backup(project_path: String, backup_name: String) -> Result<OpenedFile, String> {
    let project_path = PathBuf::from(project_path);
    let backup_path = backup_dir_for_project(&project_path)?.join(safe_backup_name(&backup_name));
    let bytes = fs::read(&backup_path).map_err(|error| error.to_string())?;
    Ok(OpenedFile {
        file_name: file_name(&backup_path),
        path: backup_path.to_string_lossy().to_string(),
        bytes,
    })
}

#[tauri::command]
fn delete_project_backup(project_path: String, backup_name: String) -> Result<(), String> {
    let project_path = PathBuf::from(project_path);
    let backup_path = backup_dir_for_project(&project_path)?.join(safe_backup_name(&backup_name));
    if backup_path.exists() {
        fs::remove_file(backup_path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn export_file(default_name: String, content: String, kind: String) -> Result<Option<SavedFile>, String> {
    let extensions: &[&str] = match kind.as_str() {
        "xml" => &["xml"],
        _ => &["tsv", "txt"],
    };
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Export", extensions)
        .set_file_name(&default_name)
        .save_file()
    else {
        return Ok(None);
    };
    fs::write(&path, content).map_err(|error| error.to_string())?;
    Ok(Some(saved_file(path)))
}

fn saved_file(path: PathBuf) -> SavedFile {
    SavedFile {
        file_name: file_name(&path),
        path: path.to_string_lossy().to_string(),
    }
}

fn file_name(path: &PathBuf) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_default()
}

fn ensure_extension(mut path: PathBuf, extension: &str) -> PathBuf {
    if path
        .extension()
        .map(|value| value.to_string_lossy().eq_ignore_ascii_case(extension))
        .unwrap_or(false)
    {
        return path;
    }
    path.set_extension(extension);
    path
}

fn backup_dir_for_project(project_path: &Path) -> Result<PathBuf, String> {
    let parent = project_path.parent().ok_or_else(|| "Project path has no parent directory.".to_string())?;
    let stem = project_path
        .file_stem()
        .map(|value| value.to_string_lossy().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "Untitled Project".to_string());
    Ok(parent.join(".prepro-backups").join(safe_path_segment(&stem)))
}

fn safe_backup_name(name: &str) -> String {
    let file_name = Path::new(name)
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "backup.lctproj".to_string());
    if file_name.to_lowercase().ends_with(".lctproj") {
        safe_path_segment(&file_name)
    } else {
        format!("{}.lctproj", safe_path_segment(&file_name))
    }
}

fn safe_path_segment(value: &str) -> String {
    let sanitized: String = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
                ch
            } else {
                '_'
            }
        })
        .collect();
    let trimmed = sanitized.trim_matches('.');
    if trimmed.is_empty() {
        "backup".to_string()
    } else {
        trimmed.to_string()
    }
}

fn backup_files(dir: &Path) -> Result<Vec<BackupFile>, String> {
    let mut backups = Vec::new();
    for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if !path.is_file() || !path.extension().map(|value| value.to_string_lossy().eq_ignore_ascii_case("lctproj")).unwrap_or(false) {
            continue;
        }
        let metadata = entry.metadata().map_err(|error| error.to_string())?;
        let timestamp = metadata
            .modified()
            .ok()
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs())
            .unwrap_or(0);
        backups.push(BackupFile {
            name: file_name(&path),
            path: path.to_string_lossy().to_string(),
            timestamp,
        });
    }
    Ok(backups)
}

fn prune_project_backups(dir: &Path, max_backups: usize) -> Result<(), String> {
    if max_backups == 0 {
        return Ok(());
    }
    let mut backups = backup_files(dir)?;
    backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp).then_with(|| b.name.cmp(&a.name)));
    for backup in backups.into_iter().skip(max_backups) {
        let _ = fs::remove_file(backup.path);
    }
    Ok(())
}

fn emit_asset_file_drop(app: &tauri::AppHandle, label: &str, event_type: &str, paths: &[PathBuf], position: Option<&tauri::PhysicalPosition<f64>>) {
    let scale_factor = app
        .get_webview_window(label)
        .and_then(|window| window.scale_factor().ok())
        .unwrap_or(1.0);
    let payload = AssetDropPayload {
        event_type: event_type.to_string(),
        paths: paths.iter().map(|path| path.to_string_lossy().to_string()).collect(),
        position: position.map(|point| AssetDropPosition { x: point.x, y: point.y }),
        scale_factor,
    };
    if let Some(window) = app.get_webview_window(label) {
        match serde_json::to_string(&payload) {
            Ok(json) => {
                if let Err(error) = window.eval(format!("window.__PREPRO_NATIVE_DROP__?.({json});")) {
                    eprintln!("[assets-dnd] direct WebView delivery failed: {error}");
                }
            }
            Err(error) => eprintln!("[assets-dnd] payload serialization failed: {error}"),
        }
    }
    if let Err(error) = app.emit_to(label, "asset-file-drop", payload) {
        eprintln!("[assets-dnd] event delivery failed: {error}");
    }
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            open_project,
            save_project,
            save_project_as,
            read_project_file,
            read_media_file,
            pick_asset_file,
            path_exists,
            pick_repair_root,
            find_files_by_names,
            save_project_backup,
            list_project_backups,
            read_project_backup,
            delete_project_backup,
            export_file
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::WindowEvent { label, event, .. } = event {
            if let WindowEvent::DragDrop(drop_event) = event {
                match drop_event {
                    DragDropEvent::Enter { paths, position } => emit_asset_file_drop(app_handle, &label, "enter", &paths, Some(&position)),
                    DragDropEvent::Over { position } => emit_asset_file_drop(app_handle, &label, "over", &[], Some(&position)),
                    DragDropEvent::Drop { paths, position } => emit_asset_file_drop(app_handle, &label, "drop", &paths, Some(&position)),
                    DragDropEvent::Leave => emit_asset_file_drop(app_handle, &label, "leave", &[], None),
                    _ => {}
                }
            }
        }
    });
}
