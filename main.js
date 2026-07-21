// cargar libreriras
const { app, BrowserWindow } = require('electron');
const { ipcMain, dialog } = require("electron");
const path = require("path")

//comprobacion de la existencia de config
const fs = require("fs");


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

  win.loadFile(path.join(__dirname, 'src/views/landing/landing.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

//no poner en caso de tener procesos en segundo plano
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

// En caso de que ya exista una boveda

// Verificar si ya existe una bóveda en la ruta y usarla, o indicar que hay que crearla
ipcMain.handle("crear-o-abrir-boveda", async (event, rutaBase) => {
  try {
    const vault = path.join(rutaBase, "MiVault");
    const configPath = path.join(vault, "config.json");

    // Caso 1: ya existe una bóveda válida -> la usamos
    if (fs.existsSync(vault) && fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      const appConfigPath = path.join(app.getPath("userData"), "config.json");
      fs.writeFileSync(
        appConfigPath,
        JSON.stringify({ ultimaBoveda: vault }, null, 2),
        "utf-8"
      );

      return { ok: true, ruta: vault, existente: true, config };
    }

    // Caso 2: no existe -> la creamos
    fs.mkdirSync(vault, { recursive: true });
    //Aqui se guardan las notas motivacionales (frases cortas)
    fs.mkdirSync(path.join(vault, "Notas"));
    //Aqui se guardan las notas individuales 
    fs.mkdirSync(path.join(vault, "Notas/Archivos"));
    fs.mkdirSync(path.join(vault, "Imagenes"));
    fs.mkdirSync(path.join(vault, "PDF"));
    fs.mkdirSync(path.join(vault, "Adjuntos"));
    fs.mkdirSync(path.join(vault, "Plantillas"));
    fs.mkdirSync(path.join(vault, "Backups"));

    const config = {
      nombre: "MiVault",
      ruta: vault,
      fechaCreacion: new Date().toISOString(),
      version: "1.0.0",
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    const appConfigPath = path.join(app.getPath("userData"), "config.json");
    fs.writeFileSync(
      appConfigPath,
      JSON.stringify({ ultimaBoveda: vault }, null, 2),
      "utf-8"
    );

    return { ok: true, ruta: vault, existente: false, config };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});


const NOTAS_FILENAME = "notas_motivacionales.txt";

// Guarda (agrega) una nota al archivo grande dentro de la bóveda
ipcMain.handle("guardar-frase", async (event, { rutaVault, texto }) => {
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

// Leer todas las notas (para mostrarlas en tu app) convertir a arreglo de json con fecha y contenido [obj, obj]
ipcMain.handle("leer-frases", async (event, rutaVault) => {
  try {
    const notasPath = path.join(rutaVault, "Notas", NOTAS_FILENAME);

    if (!fs.existsSync(notasPath)) {
      return { success: true, notas: [] };
    }

    const contenido = fs.readFileSync(notasPath, "utf8");

    const regex = /---\s*\n\[(.*?)\]\s*\n([\s\S]*?)(?=\n---|\s*$)/g;

    const notas = [];
    let match;

    while ((match = regex.exec(contenido)) !== null) {
      notas.push({
        fecha: match[1],
        contenido: match[2].trim()
      });
    }

    return {
      success: true,
      notas
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Guarda (agrega) una nota al archivo grande dentro de la bóveda
ipcMain.handle("guardar-Nota", async (event, { rutaVault, texto, titulo }) => {
  try {
    const notasPath = path.join(rutaVault, "Notas/Archivos", `${titulo}.txt`);

    if (fs.existsSync(notasPath)) {
      return { success: false, error: "Ya existe una nota con ese título." };
    }

    const fecha = new Date().toLocaleString();
    const contenido = `[${fecha}]\n${texto}\n`;
    fs.writeFileSync(notasPath, contenido, "utf-8"); // writeFile, no append, para una nota nueva

    console.log("nota guardada exitosamente");
    return { success: true, path: notasPath };
  } catch (error) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
});

// Leer todas las notas (para mostrarlas en tu app) convertir a arreglo de json con fecha y contenido [obj, obj]
ipcMain.handle("leer-notas", async (event, rutaVault) => {

});


const SAFE_ROOT = path.join(__dirname, 'src');

ipcMain.handle('load-partial', async (event, fileName) => {
  const resolvedPath = path.resolve(path.join(SAFE_ROOT, fileName));

  if (!resolvedPath.startsWith(SAFE_ROOT + path.sep)) {
    throw new Error('Ruta no permitida');
  }
  if (path.extname(resolvedPath) !== '.html') {
    throw new Error('Tipo de archivo no permitido');
  }

  try {
    return await fs.promises.readFile(resolvedPath, 'utf-8');
  } catch (err) {
    throw new Error(`No se pudo cargar la vista: ${fileName}`);
  }
});