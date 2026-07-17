/* ============================================================
   renderer.js — completo y reorganizado
   ============================================================ */

/* ---------- 1. Loader base de vistas ---------- */
async function loadView(viewName) {
  const container = document.getElementById('view-container');
  try {
    const html = await window.api.loadPartial(viewName);
    container.innerHTML = html;
    return true;
  } catch (err) {
    container.innerHTML = `<p class="error">Error al cargar la vista: ${err.message}</p>`;
    console.error(err);
    return false;
  }
}

/* ---------- 2. Estado global compartido entre vistas ---------- */
let vaultActual = null;
let phrases = [];
let current = 0;

const fallbackPhrases = [
  'Guarda frases para mostrar Frases'
];

const mezclarArreglo = (arreglo) => {
  const arr = [...arreglo];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/* ---------- 3. Inicializador de la vista Home (appIndex.html) ---------- */
function initHomeView() {
  const phraseEl = document.getElementById('phrase-text');
  const prevBtn = document.getElementById('prev-phrase');
  const nextBtn = document.getElementById('next-phrase');
  const noteInput = document.getElementById('note-input');
  const noteStatus = document.getElementById('note-status');
  const saveBtn = document.getElementById('btn-save-note');
  const fechaEl = document.getElementById('phrase-fecha');

  if (!phraseEl || !prevBtn || !nextBtn || !noteInput || !saveBtn) {
    console.warn('initHomeView: faltan elementos esperados en el fragmento.');
    return;
  }

  function renderPhrase(index) {
    if (!phrases.length) return;
    current = (index + phrases.length) % phrases.length;
    const { fecha, contenido } = phrases[current];
    phraseEl.classList.add('is-fading');
    setTimeout(() => {
      phraseEl.textContent = contenido;
      if (fechaEl) fechaEl.textContent = fecha;
      phraseEl.classList.remove('is-fading');
    }, 140);
  }

  async function loadPhrases() {
    if (!vaultActual) {
      vaultActual = await window.api.obtenerUltimaBoveda();
    }
    let listaFrases;
    try {
      const resultado = await window.api.leerNotas(vaultActual);
      if (resultado.success && Array.isArray(resultado.notas) && resultado.notas.length > 0) {
        listaFrases = resultado.notas;
      } else {
        listaFrases = fallbackPhrases.map(texto => ({ fecha: '', contenido: texto }));
      }
    } catch (error) {
      console.error('Error cargando frases:', error);
      listaFrases = fallbackPhrases.map(texto => ({ fecha: '', contenido: texto }));
    }
    phrases = mezclarArreglo(listaFrases);
    renderPhrase(0);
  }

  prevBtn.addEventListener('click', () => renderPhrase(current - 1));
  nextBtn.addEventListener('click', () => renderPhrase(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') renderPhrase(current - 1);
    if (e.key === 'ArrowRight') renderPhrase(current + 1);
  });

  saveBtn.addEventListener('click', async () => {
    const content = noteInput.value.trim();
    if (!content) return;
    saveBtn.disabled = true;
    noteStatus.textContent = 'Guardando...';
    noteStatus.classList.remove('is-saved');
    try {
      const resultado = await window.api.guardarNota(vaultActual, content);
      if (resultado.success) {
        noteInput.value = '';
        noteStatus.textContent = 'Nota guardada :D';
        noteStatus.classList.add('is-saved');
      } else {
        noteStatus.textContent = 'No se pudo guardar.';
      }
    } catch (error) {
      console.error(error);
      noteStatus.textContent = 'Error al guardar.';
    } finally {
      saveBtn.disabled = false;
    }
  });

  noteInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveBtn.click();
  });

  loadPhrases();
}

/* ---------- 4. Registro de inicializadores por vista ---------- */
const viewInitializers = {
  'views/app/appIndex.html': initHomeView,
  // 'views/app/otraVista.html': initOtraVista,
};

/* ---------- 5. Navegación centralizada ---------- */
async function navigateTo(viewName) {
  const container = document.getElementById('view-container');
  const ok = await loadView(viewName);
  if (!ok) return;

  if (container.querySelector('html, head, app-nav')) {
    console.error(`Fragmento inválido cargado en ${viewName}: contiene shell completo.`);
    container.innerHTML = `<p class="error">Vista mal formada.</p>`;
    return;
  }

  const init = viewInitializers[viewName];
  if (init) init();
}

/* ---------- 6. Delegación de eventos del nav (vive fuera de #view-container) ---------- */
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-view]');
  if (!btn) return;
  navigateTo(btn.dataset.view);
});

/* ---------- 7. Arranque ---------- */
window.addEventListener('DOMContentLoaded', async () => {
  vaultActual = await window.api.obtenerUltimaBoveda();
  await navigateTo('views/app/appIndex.html');
});