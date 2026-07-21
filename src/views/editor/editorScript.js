async function initEditor() {
    console.log("entrando a initEditor");

    const inputTitulo = document.getElementById('titulo-nota');
    const inputContenido = document.getElementById('contenido-nota');
    const btnGuardar = document.getElementById('btn-guardar');

    // AbortController para listeners globales (document/window) de esta vista
    const controller = new AbortController();
    const { signal } = controller;

    function guardarNota() {
        const nota = {
            titulo: inputTitulo.value.trim() || 'Sin título',
            contenido: inputContenido.value,
            fecha: new Date().toISOString()
        };
        console.log("guardando nota:", nota);
        // Aquí llamas a tu IPC/API para persistir, ej:
        // window.api.guardarNota(nota);
    }

    // Autoguardado opcional con Ctrl+S — listener a nivel document, usa signal
    function onKeydown(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            guardarNota();
        }
    }

    btnGuardar.addEventListener('click', guardarNota);
    document.addEventListener('keydown', onKeydown, { signal });

    // Cleanup: se ejecuta cuando se navega fuera de esta vista
    return function cleanupEditorView() {
        controller.abort(); // limpia el keydown de document automáticamente
        // btnGuardar/inputTitulo/inputContenido mueren con el innerHTML,
        // no necesitan removeEventListener manual.
    };
}