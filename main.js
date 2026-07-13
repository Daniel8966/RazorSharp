// cargar libreriras
const { app, BrowserWindow } = require('electron');
const { ipcMain, dialog } = require("electron");
const path = require("path")

//comprobacion de la existencia de config
const fs = require("fs");


if (fs.existsSync("config.json")) {
    //cargarEditor();
    console.log("en efecto existe el config");

} else {
    console.log("no existe ni mierda");
    //cargarLanding();
}


function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 560,
    backgroundColor: '#151417',
    titleBarStyle: 'hiddenInset', // en Windows/Linux cae a la barra por defecto
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'src/landing.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});




ipcMain.handle("obtener-ultima-boveda", async () => {
  const appConfigPath = path.join(app.getPath("userData"), "config.json");
  if (fs.existsSync(appConfigPath)) {
    const data = JSON.parse(fs.readFileSync(appConfigPath, "utf-8"));
    return data.ultimaBoveda || null;
  }
  return null;
});
//Principal seleccionar boveda 

// Seleccionar carpeta
ipcMain.handle("seleccionar-carpeta", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// Crear bóveda + guardar config.json
ipcMain.handle("crear-boveda", async (event, rutaBase) => {
  try {
    const vault = path.join(rutaBase, "MiVault");

    if (fs.existsSync(vault)) {
      return { ok: false, error: "Ya existe una bóveda en esa ubicación." };
    }

    fs.mkdirSync(vault);
    fs.mkdirSync(path.join(vault, "Notas"));
    fs.mkdirSync(path.join(vault, "Imagenes"));
    fs.mkdirSync(path.join(vault, "PDF"));
    fs.mkdirSync(path.join(vault, "Adjuntos"));
    fs.mkdirSync(path.join(vault, "Plantillas"));
    fs.mkdirSync(path.join(vault, "Backups"));

    // Guardar config.json dentro de la bóveda
    const config = {
      nombre: "MiVault",
      ruta: vault,
      fechaCreacion: new Date().toISOString(),
      version: "1.0.0",
    };

    fs.writeFileSync(
      path.join(vault, "config.json"),
      JSON.stringify(config, null, 2),
      "utf-8"
    );

    // También guardar config.json global de la app (para saber qué bóveda abrir al iniciar)
    const appConfigPath = path.join(app.getPath("userData"), "config.json");
    fs.writeFileSync(
      appConfigPath,
      JSON.stringify({ ultimaBoveda: vault }, null, 2),
      "utf-8"
    );

    return { ok: true, ruta: vault };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});


//Funcionalidad para guardar el documento (nota)

ipcMain.handle("guardar-documento", async (event, texto) => {

    const { canceled, filePath } = await dialog.showSaveDialog({
        title: "Guardar documento",
        defaultPath: "VECINOSSALGAN_Documeanto.txt",
        filters: [
            { name: "Texto", extensions: ["txt"] }
        ]
    });

    if (canceled || !filePath) {
        return { success: false };
    }

    fs.writeFileSync(filePath, texto);

    return {
        success: true,
        path: filePath,
        fileName: filePath

    };
});


const NOTAS_FILENAME = "notas_motivacionales.txt";

// Guarda (agrega) una nota al archivo grande dentro de la bóveda
ipcMain.handle("guardar-nota", async (event, { rutaVault, texto }) => {
  try {
    const notasPath = path.join(rutaVault, "Notas", NOTAS_FILENAME);

    const fecha = new Date().toLocaleString();
    const contenido = `\n\n---\n[${fecha}]\n${texto}\n`;

    // Si el archivo no existe, lo crea; si existe, agrega al final
    fs.appendFileSync(notasPath, contenido, "utf-8");

    return { success: true, path: notasPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Leer todas las notas (para mostrarlas en tu app)
ipcMain.handle("leer-notas", async (event, rutaVault) => {
  try {
    const notasPath = path.join(rutaVault, "Notas", NOTAS_FILENAME);

    if (!fs.existsSync(notasPath)) {
      return { success: true, contenido: "" };
    }

    const contenido = fs.readFileSync(notasPath, "utf-8");
    return { success: true, contenido };
  } catch (error) {
    return { success: false, error: error.message };
  }
});