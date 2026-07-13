
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
  'Hoy hago una cosa a la vez.',
  '¿Que es lo unico que, si lo logro hoy, hace que el dia valga la pena?',
  'No necesito terminarlo todo, solo empezar lo importante.',
];

async function loadPhrases() {
  try {
    phrases = await window.vault.getPhrases();
    if (!Array.isArray(phrases) || phrases.length === 0) throw new Error('vacio');
  } catch {
    phrases = fallbackPhrases;
  }
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

  phraseEl.classList.add('is-fading');
  setTimeout(() => {
    phraseEl.textContent = phrases[current];
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

loadPhrases();

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

// index.html (script)
window.addEventListener("DOMContentLoaded", async () => {
  const vault = await window.api.obtenerUltimaBoveda();
  console.log("Bóveda cargada:", vault);

  // Cargar notas existentes en un textarea, por ejemplo
  const resultado = await window.api.leerNotas(vaultActual);
  if (resultado.success) {
    console.log("notas recuperadas de manera exitosa");
    console.log(resultado.contenido);
    //document.getElementById("todasLasNotas").textContent = resultado.contenido
  }
});
