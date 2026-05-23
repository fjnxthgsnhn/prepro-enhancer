use serde::Serialize;
use std::{fs, path::PathBuf};

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_project,
            save_project,
            save_project_as,
            read_project_file,
            export_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
