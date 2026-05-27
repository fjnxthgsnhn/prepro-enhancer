use serde::Serialize;
use std::{fs, path::{Path, PathBuf}};

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

#[tauri::command]
fn open_project() -> Result<Option<OpenedFile>, String> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Previz project or TSV", &["lctproj", "tsv", "txt"])
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
    fs::write(&path, bytes).map_err(|error| error.to_string())?;
    Ok(Some(saved_file(path)))
}

#[tauri::command]
fn save_project_as(default_name: String, bytes: Vec<u8>) -> Result<Option<SavedFile>, String> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Previz project", &["lctproj"])
        .set_file_name(&default_name)
        .save_file()
    else {
        return Ok(None);
    };
    let path = ensure_extension(path, "lctproj");
    fs::write(&path, bytes).map_err(|error| error.to_string())?;
    Ok(Some(saved_file(path)))
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
fn pick_asset_file(project_path: String) -> Result<Option<OpenedFile>, String> {
    let Some(path) = rfd::FileDialog::new().pick_file() else {
        return Ok(None);
    };
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    let project_path = PathBuf::from(project_path);
    let parent = project_path.parent();
    let display_path = parent
        .and_then(|base| path.strip_prefix(base).ok())
        .map(|relative| relative.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|| path.to_string_lossy().to_string());
    Ok(Some(OpenedFile {
        file_name: file_name(&path),
        path: display_path,
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_project,
            save_project,
            save_project_as,
            read_project_file,
            read_media_file,
            pick_asset_file,
            save_project_backup,
            list_project_backups,
            read_project_backup,
            delete_project_backup,
            export_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
