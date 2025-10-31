document.addEventListener('DOMContentLoaded', () => {
  // --- Loading simulado de 5 segundos ---
  const overlay = document.getElementById('loading-overlay');
  const percent = document.getElementById('loading-percent');
  let progress = 0;
  let interval = null;

  function startLoading() {
    overlay.style.display = 'flex';
    progress = 0;
    percent.textContent = '0%';
    setTimeout(() => {
      interval = setInterval(() => {
        progress += 2;
        if (progress > 100) progress = 100;
        percent.textContent = progress + '%';
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            overlay.classList.add('hide');
            setTimeout(() => { overlay.style.display = 'none'; }, 400);
            startApp();
          }, 400);
        }
      }, 100);
    }, 50);
  }

  function startApp() {
    // Sidebar y menú hamburguesa 
    // Maneja la apertura/cierre del menú lateral y el cambio de icono del botón hamburguesa
    const sidebar   = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const hamburgerImg = hamburger?.querySelector('img');
    const iconCancel = 'img/IconosHeader/IconoCancelar.png';
    const iconHamburguesa = 'img/IconosHeader/IconoMenuHamburguesa.png';

    if (sidebar && hamburger && hamburgerImg) {
      // Alterna el estado del sidebar y actualiza el icono
      const toggleSidebar = () => {
        const willOpen = !sidebar.classList.contains('open');
        sidebar.classList.toggle('open', willOpen);
        hamburger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        hamburgerImg.src = willOpen ? iconCancel : iconHamburguesa;
        hamburgerImg.alt = willOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral';
        // En mobile, bloquea el scroll del body cuando el menú está abierto
        if (window.innerWidth <= 700) {
          document.body.style.overflow = willOpen ? 'hidden' : '';
        }
      };
      // Click y teclado para abrir/cerrar menú
      hamburger.addEventListener('click', (e) => { e.preventDefault(); toggleSidebar(); });
      hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebar(); }
      });
      // Cierra el menú si se hace click fuera
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
          sidebar.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
          hamburgerImg.src = iconHamburguesa;
          hamburgerImg.alt = 'Abrir menú lateral';
        }
      });
      // Cierra el menú con Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          sidebar.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
          hamburgerImg.src = iconHamburguesa;
          hamburgerImg.alt = 'Abrir menú lateral';
        }
      });
      // Cierra el menú si cambia a desktop
      window.addEventListener('resize', () => {
        if (window.innerWidth > 700) {
          sidebar.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
          hamburgerImg.src = iconHamburguesa;
          hamburgerImg.alt = 'Abrir menú lateral';
        }
      });
    }

    // --- Carruseles (flechas) ---
    // Permite desplazar los carruseles de juegos con las flechas
    document.querySelectorAll('.rail-arrow').forEach(btn => {
      btn.addEventListener('click', function() {
        const railId = this.getAttribute('data-rail');
        const track = document.getElementById(railId);
        if (!track) return;
        const card = track.querySelector('.game-card');
        const cardWidth = card ? card.offsetWidth + 12 : 220; // 12px de gap
        const dir = this.classList.contains('left') ? -1 : 1;
        // Agrega clase para animación
        track.classList.add('is-scrolling');
        track.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
        // Quita la clase después de la animación
        setTimeout(() => {
          track.classList.remove('is-scrolling');
        }, 400);
      });
    });

    // --- Hero rotativo (eliminado) ---
    // Se eliminó la animación y lógica de rotación del hero para dejarlo estático.

    // --- Menú usuario expandible ---
    // Muestra/oculta el menú contextual al hacer click en el avatar de usuario
    const avatarBtn = document.querySelector('.avatar');
    const userMenu = document.getElementById('user-menu');
    if (avatarBtn && userMenu) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !userMenu.classList.contains('open');
        userMenu.classList.toggle('open', willOpen);
        // simula el hover al tocar
        avatarBtn.classList.toggle('is-hover', willOpen);
      });

      // Cierra el menú usuario si se hace click fuera (incluye hijos del avatar)
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !avatarBtn.contains(e.target)) {
          userMenu.classList.remove('open');
          avatarBtn.classList.remove('is-hover');
        }
      });

      // Cierra el menú usuario al cambiar tamaño de pantalla
      window.addEventListener('resize', () => {
        if (userMenu.classList.contains('open')) {
          userMenu.classList.remove('open');
        }
        avatarBtn.classList.remove('is-hover');
      });

      // Cierra con Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          userMenu.classList.remove('open');
          avatarBtn.classList.remove('is-hover');
        }
      });
    }

    // --- Funciones auxiliares ---

    // Nota: no quedan listeners ni funciones para rotar el hero.
  }

  startLoading();
});


 