class AppNav extends HTMLElement {
  async connectedCallback() {
    // Evita recargar si ya se montó (ej. si el nodo se mueve en el DOM)
    if (this.dataset.loaded === 'true') return;

    if (!window.api || !window.api.loadPartial) {
      console.error('window.api no está disponible. Revisa preload.js');
      this.innerHTML = '<p style="color:red">Error: preload no disponible</p>';
      return;
    }

    try {
      const html = await window.api.loadPartial('src/components/nav/nav.html');
      this.outerHTML = html;
      this.dataset.loaded = 'true';

    
    } catch (err) {
      console.error('Error cargando el nav:', err);
      this.innerHTML = '<p style="color:red">Error al cargar el nav</p>';
    }
  }


}

customElements.define('app-nav', AppNav);

