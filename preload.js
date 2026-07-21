const { contextBridge, ipcRenderer  } = require('electron');

// Aqui iremos exponiendo, mas adelante, funciones seguras para
// leer/escribir archivos del vault (notas, imagenes, etc).
contextBridge.exposeInMainWorld('vault', {
  version: '0.1.0',
  //guardarDocumento: (texto) => ipcRenderer.invoke("guardar-documento", texto)
});
contextBridge.exposeInMainWorld("api", {
    seleccionarCarpeta: () => ipcRenderer.invoke("seleccionar-carpeta"),
    obtenerUltimaBoveda: () => ipcRenderer.invoke("obtener-ultima-boveda"),
    guardarFrase: (rutaVault, texto) => ipcRenderer.invoke("guardar-frase", { rutaVault, texto }),
    leerFrases: (rutaVault) => ipcRenderer.invoke("leer-frases", rutaVault),
    crearOAbrirBoveda: (ruta) => ipcRenderer.invoke("crear-o-abrir-boveda", ruta),
    loadPartial: (fileName) => ipcRenderer.invoke('load-partial', fileName),
    guardarNota: (rutaVault, texto, titulo) => ipcRenderer.invoke("guardar-Nota", {rutaVault, texto, titulo}),
    leerNotas: (rutaVault) => ipcRenderer.invoke("leer-notas", rutaVault)
});

