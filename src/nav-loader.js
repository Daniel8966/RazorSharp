async function loadNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) {
    console.error('No existe #nav-placeholder en el DOM');
    return;
  }

  if (!window.api || !window.api.loadPartial) {
    console.error('window.api no está disponible. Revisa preload.js');
    return;
  }

  try {
    const html = await window.api.loadPartial('src/components/nav/nav.html');
    placeholder.outerHTML = html; // inyectar el codigo html directo
  } catch (err) {
    console.error('Error cargando el nav:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadNav);