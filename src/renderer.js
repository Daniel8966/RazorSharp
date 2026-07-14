
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
const prevBtn = document.getElementById('prev-phrase');
const nextBtn = document.getElementById('next-phrase');

let phrases = [];
let current = 0;

// Fallback por si aun no conectas window.vault.getPhrases() via IPC.
const fallbackPhrases = [
  'Guarda frases para mostrar Frases'
];

//funcion para revolver arreglo y que no se muestren las mismas frases siempre 

const mezclarArreglo = (arreglo) => {
  // Crea una copia para no modificar el original si se desea inmutabilidad
  const arr = [...arreglo];
  
  for (let i = arr.length - 1; i > 0; i--) {
    // Genera un índice aleatorio entre 0 e i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Intercambia los elementos en las posiciones i y j
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
};

async function loadPhrases() {
  // Aseguramos tener el vault antes de usarlo
  if (!vaultActual) {
    vaultActual = await window.api.obtenerUltimaBoveda();
  }

  let listaFrases;
  try {
    const resultado = await window.api.leerNotas(vaultActual);

    if (resultado.success && Array.isArray(resultado.notas) && resultado.notas.length > 0) {
      // Ajusta 
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
