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
    guardarNota: (rutaVault, texto) => ipcRenderer.invoke("guardar-nota", { rutaVault, texto }),
    leerNotas: (rutaVault) => ipcRenderer.invoke("leer-notas", rutaVault),
    crearOAbrirBoveda: (ruta) => ipcRenderer.invoke("crear-o-abrir-boveda", ruta),

});

