const { contextBridge, ipcRenderer  } = require('electron');

// Aqui iremos exponiendo, mas adelante, funciones seguras para
// leer/escribir archivos del vault (notas, imagenes, etc).
contextBridge.exposeInMainWorld('vault', {
  version: '0.1.0',
  //guardarDocumento: (texto) => ipcRenderer.invoke("guardar-documento", texto)
});
contextBridge.exposeInMainWorld("api", {
    guardarDocumento: (texto) => ipcRenderer.invoke("guardar-documento", texto),
    seleccionarCarpeta: () => ipcRenderer.invoke("seleccionar-carpeta"),
    crearBoveda: (rutaBase) => ipcRenderer.invoke("crear-boveda", rutaBase),
    obtenerUltimaBoveda: () => ipcRenderer.invoke("obtener-ultima-boveda"),
    guardarNota: (rutaVault, texto) => ipcRenderer.invoke("guardar-nota", { rutaVault, texto }),

});

