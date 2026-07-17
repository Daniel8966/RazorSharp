class AppNav extends HTMLElement {
  async connectedCallback() {
    if (this.dataset.loaded === 'true') return;

    if (!window.api || !window.api.loadPartial) {
      console.error('window.api no está disponible. Revisa preload.js');
      this.innerHTML = '<p style="color:red">Error: preload no disponible</p>';
      return;
    }

    try {
      const html = await window.api.loadPartial('components/nav/nav.html');
      this.innerHTML = html;
      this.dataset.loaded = 'true';
      this._bindNavEvents();
    } catch (err) {
      console.error('Error cargando el nav:', err);
      this.innerHTML = '<p style="color:red">Error al cargar el nav</p>';
    }
  }

  _bindNavEvents() {
    const railButtons = this.querySelectorAll('.rail-btn');

    railButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        railButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const view = btn.dataset.view;
        if (view) this._navigateTo(view);
      });
    });
  }

  async _navigateTo(viewPath) {
    const container = document.querySelector('#view-container');
    if (!container) {
      console.error('#view-container no encontrado');
      return;
    }
    try {
      const html = await window.api.loadPartial(viewPath);
      container.innerHTML = html;
    } catch (err) {
      console.error('Error cargando vista:', err);
      container.innerHTML = `<p style="color:red">No se pudo cargar la vista</p>`;
    }
  }
}

customElements.define('app-nav', AppNav);