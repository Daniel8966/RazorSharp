
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
let currentViewCleanup = null;

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

  const AUTOPLAY_MS = 10000;
  let autoplayTimer = null;

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

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => renderPhrase(current + 1), AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    startAutoplay();
  }
  /*
  Esta funcion carga todas las frases del archivo marcado con la variable global y haciendo uso del ipc al igual 
  que las imagenes motivacionales (siguiente iteracion)
  se apoya con Render() para cargar en pantalla  y el autoplay() para el timer de pasar una a otra 
  let vaultActual : path para la vaul
  let phrases : arreglo sobre el cual se almacenan y se muestran
  let current : posicion actual del arreglo para render

  */
  async function loadPhrases(nuevaFrase) {
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
    //si existe una nueva frase debe de mostrarse al inicio del arreglo (ultima del original)
    if (nuevaFrase){
      const ultimo = listaFrases.slice(-1)[0];
      listaFrases.pop();
      phrases = mezclarArreglo(listaFrases)
      phrases.unshift(ultimo);

    }else{
      phrases = mezclarArreglo(listaFrases);
    }
    renderPhrase(0);
    startAutoplay();
  }

  const onPrev = () => { renderPhrase(current - 1); resetAutoplay(); };
  const onNext = () => { renderPhrase(current + 1); resetAutoplay(); };
  const onKeydown = (e) => {
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  document.addEventListener('keydown', onKeydown);

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
        loadPhrases(content);
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
  loadPhrases(false);
  noteInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveBtn.click();
  });


  // Cleanup: se ejecuta cuando se navega fuera de esta vista
  return function cleanupHomeView() {
    stopAutoplay();
    document.removeEventListener('keydown', onKeydown);
    // prevBtn/nextBtn/saveBtn/noteInput mueren junto con el innerHTML,
    // así que sus listeners no necesitan removerse a mano.
  };
}

/* ---------- 4. Registro de inicializadores por vista ---------- */
const viewInitializers = {
  'views/app/appIndex.html': initHomeView,
  'views/notas/notas.html': initNotas,
  'views/editor/editor.html': initEditor,
};


/* ---------- 5. Navegación centralizada ---------- */
async function navigateTo(viewName) {
  // Limpia la vista anterior ANTES de tocar el DOM
  if (typeof currentViewCleanup === 'function') {
    currentViewCleanup();
    currentViewCleanup = null;
  }

  const container = document.getElementById('view-container');
  const ok = await loadView(viewName);
  if (!ok) return;

  if (container.querySelector('html, head, app-nav')) {
    console.error(`Fragmento inválido cargado en ${viewName}: contiene shell completo.`);
    container.innerHTML = `<p class="error">Vista mal formada.</p>`;
    return;
  }

  const init = viewInitializers[viewName];
  if (init) {
    currentViewCleanup = init(); // guarda el cleanup que devuelva el init (si devuelve alguno)
  }
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