async function initNotas() {
    const nuevaNota = document.getElementById('fab-new-note');

    function addNota() {
        navigateTo('views/editor/editor.html');
    }

    nuevaNota.addEventListener('click', addNota);

    return function cleanupNotasView() {
        // aquí solo lo que realmente exista en esta vista
        // (elementos internos mueren solos con el innerHTML)
    };
}