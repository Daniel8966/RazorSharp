
// preubas 
/* ---------- Rail lateral ---------- */
const railButtons = document.querySelectorAll('.rail-btn');
railButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    railButtons.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    console.log('Cambiar a vista:', btn.dataset.view);
  });
});

/* ---------- Carrusel de frases ---------- */
const phraseEl = document.getElementById('phrase-text');
const dotsEl = document.getElementById('phrase-dots');
const prevBtn = document.getElementById('prev-phrase');
const nextBtn = document.getElementById('next-phrase');

let phrases = [];
let current = 0;

// Fallback por si aun no conectas window.vault.getPhrases() via IPC.
const fallbackPhrases = [
  'Guarda frases para mostrar Frases'
];
async function loadPhrases() {
  // Aseguramos tener el vault antes de usarlo
  if (!vaultActual) {
    vaultActual = await window.api.obtenerUltimaBoveda();
  }

  let listaFrases;
  try {
    const resultado = await window.api.leerNotas(vaultActual);

    if (resultado.success && Array.isArray(resultado.notas) && resultado.notas.length > 0) {
      // Ajusta "resultado.notas" al nombre real de la propiedad que devuelve tu handler
      listaFrases = resultado.notas;
    } else {
      listaFrases = fallbackPhrases.map(texto => ({ fecha: '', contenido: texto }));
    }
  } catch (error) {
    console.error('Error cargando frases:', error);
    listaFrases = fallbackPhrases.map(texto => ({ fecha: '', contenido: texto }));
  }

  phrases = listaFrases;
  buildDots();
  renderPhrase(0);
}
function buildDots() {
  dotsEl.innerHTML = '';
  phrases.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Frase ${i + 1}`);
    dot.addEventListener('click', () => renderPhrase(i));
    dotsEl.appendChild(dot);
  });
}

function renderPhrase(index) {
  current = (index + phrases.length) % phrases.length;
  const { fecha, contenido } = phrases[current];

  phraseEl.classList.add('is-fading');
  setTimeout(() => {
    phraseEl.textContent = contenido;

    // Si tienes un elemento para mostrar la fecha, actualízalo aquí
    if (typeof fechaEl !== 'undefined' && fechaEl) {
      fechaEl.textContent = fecha;
    }

    phraseEl.classList.remove('is-fading');
  }, 140);

  [...dotsEl.children].forEach((dot, i) => {
    dot.classList.toggle('is-active', i === current);
  });
}

prevBtn.addEventListener('click', () => renderPhrase(current - 1));
nextBtn.addEventListener('click', () => renderPhrase(current + 1));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') renderPhrase(current - 1);
  if (e.key === 'ArrowRight') renderPhrase(current + 1);
});

/* ---------- Panel de nota rapida ---------- */
const noteInput = document.getElementById('note-input');
const noteStatus = document.getElementById('note-status');
const saveBtn = document.getElementById('btn-save-note');

let vaultActual = null;

window.addEventListener('DOMContentLoaded', async () => {
  vaultActual = await window.api.obtenerUltimaBoveda();
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
// Ctrl/Cmd + Enter para guardar rapido
noteInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveBtn.click();
});

//index script
window.addEventListener("DOMContentLoaded", async () => {
  vaultActual = await window.api.obtenerUltimaBoveda();
  await loadPhrases();
});
