async function initNotas() {
    const notesList = document.getElementById('notes-list');
    const searchInput = document.getElementById('notes-search');
    const nuevaNota = document.getElementById('fab-new-note') || document.getElementById('btn-new-note');

    const controller = new AbortController();
    const { signal } = controller;

    let todasLasNotas = [];

    async function cargarNotas() {
        try {
            const resultado = await window.api.leerNotas(vaultActual);

            if (!resultado.success) {
                console.error("Error al leer notas:", resultado.error);
                notesList.innerHTML = `<p class="empty-state">No se pudieron cargar las notas.</p>`;
                return;
            }

            todasLasNotas = resultado.notas;
            renderNotas(todasLasNotas);
        } catch (error) {
            console.error(error);
        }
    }

    function renderNotas(notas) {
        notesList.innerHTML = "";

        if (notas.length === 0) {
            notesList.innerHTML = `<p class="empty-state">No hay notas todavía.</p>`;
            return;
        }

        notas.forEach((nota) => {
            const article = document.createElement("article");
            article.className = "note-card";
            article.dataset.titulo = nota.titulo;

            const preview = nota.contenido.trim().slice(0, 100).replace(/\n/g, " ");
            const fechaFormateada = formatearFecha(nota.fecha);

            article.innerHTML = `
              <div class="note-card-main">
                <h3 class="note-card-title">${escapeHtml(nota.titulo)}</h3>
                <p class="note-card-preview">${escapeHtml(preview)}...</p>
              </div>
              <div class="note-card-meta">
                <span class="note-card-date">${fechaFormateada}</span>
                <button class="note-card-delete" aria-label="Eliminar nota" data-titulo="${escapeHtml(nota.titulo)}">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
                </button>
              </div>
            `;

            // Estos listeners viven dentro de notesList; morirán solos
            // al hacer innerHTML = "" en el próximo render o en cleanup.
            // No hace falta signal aquí, pero no estorba tampoco.
            article.querySelector(".note-card-main").addEventListener("click", () => {
                abrirNota(nota.titulo);
            }, { signal });

            article.querySelector(".note-card-delete").addEventListener("click", (e) => {
                e.stopPropagation();
                eliminarNota(nota.titulo);
            }, { signal });

            notesList.appendChild(article);
        });
    }

    function formatearFecha(isoString) {
        const fecha = new Date(isoString);
        const hoy = new Date();
        const esHoy = fecha.toDateString() === hoy.toDateString();
        const hora = fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        if (esHoy) return `Hoy, ${hora}`;
        return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + `, ${hora}`;
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function abrirNota(titulo) {
        localStorage.setItem("notaActual", titulo);
        navigateTo('views/editor/editor.html');
    }

    async function eliminarNota(titulo) {
        if (!confirm(`¿Eliminar la nota "${titulo}"?`)) return;
        const resultado = await window.api.eliminarNota(vaultActual, titulo);
        if (resultado.success) {
            cargarNotas();
        } else {
            console.error("no se pudo eliminar:", resultado.error);
        }
    }

    function addNota() {
        navigateTo('views/editor/editor.html');
    }

    // --- listeners de la vista ---
    if (nuevaNota) nuevaNota.addEventListener('click', addNota, { signal });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtradas = todasLasNotas.filter((nota) =>
                nota.titulo.toLowerCase().includes(query) ||
                nota.contenido.toLowerCase().includes(query)
            );
            renderNotas(filtradas);
        }, { signal });
    }

    // carga inicial
    await cargarNotas();

    return function cleanupNotasView() {
        // desconecta TODOS los listeners registrados con {signal} de un solo golpe
        controller.abort();
    };
}