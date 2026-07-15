async function loadNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;

  try {
    const html = await window.electronAPI.loadPartial('nav.html');
    placeholder.innerHTML = html;

    const currentPage = window.location.pathname.split('/').pop();
    const links = placeholder.querySelectorAll('a[data-nav]');
    links.forEach(link => {
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
      }
    });
  } catch (err) {
    console.error('Error cargando el nav:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadNav);