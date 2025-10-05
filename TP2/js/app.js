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
    // Asegura que el overlay esté visible antes de iniciar el intervalo
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
            // Inicia la app después del loading
            startApp();
          }, 400);
        }
      }, 100); // 100ms * 50 = 5s
    }, 50); // Pequeño delay para asegurar el render
  }

  function startApp() {
    // --- Sidebar y menú hamburguesa ---
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

    // --- Hero rotativo ---
    // Controla el slider principal de juegos destacados
    let heroData = [];
    let heroIndex = 0;
    let heroReady = false;

    // Inicializa heroData si hay datos en el DOM (ejemplo: window.heroData)
    if (window.heroData && Array.isArray(window.heroData) && window.heroData.length >= 3) {
      heroData = window.heroData;
      heroReady = true;
      renderHeroRotativo();
    } else {
      // Si no hay datos, busca las cards existentes en el DOM y las usa como fallback
      const slide = document.getElementById('hero-slide');
      if (slide) {
        heroData = Array.from(slide.children).map(card => ({
          nombre: card.querySelector('.hero-title')?.textContent || card.getAttribute('data-nombre') || '',
          imagen: card.querySelector('img')?.src || card.getAttribute('data-imagen') || '',
        }));
        if (heroData.length >= 3) {
          heroReady = true;
          renderHeroRotativo();
        }
      }
    }

    // Flecha derecha del hero
    document.getElementById('hero-arrow-right')?.addEventListener('click', () => {
      if (!heroReady) return;
      heroIndex = (heroIndex + 1) % heroData.length;
      animateHero('right');
    });

    // Flecha izquierda del hero
    document.getElementById('hero-arrow-left')?.addEventListener('click', () => {
      if (!heroReady) return;
      heroIndex = (heroIndex - 1 + heroData.length) % heroData.length;
      animateHero('left');
    });

    // --- Menú usuario expandible ---
    // Muestra/oculta el menú contextual al hacer click en el avatar de usuario
    const avatarBtn = document.querySelector('.avatar');
    const userMenu = document.getElementById('user-menu');
    if (avatarBtn && userMenu) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
      });

      // Cierra el menú usuario si se hace click fuera
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && e.target !== avatarBtn) {
          userMenu.classList.remove('open');
        }
      });

      // Cierra el menú usuario al cambiar tamaño de pantalla
      window.addEventListener('resize', () => {
        if (userMenu.classList.contains('open')) {
          userMenu.classList.remove('open');
        }
      });

      // Cierra con Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          userMenu.classList.remove('open');
        }
      });
    }

    // --- Funciones auxiliares ---

    // Animación de rotación del hero
    function animateHero(direction) {
      const slide = document.getElementById('hero-slide');
      if (!slide) return;
      slide.classList.remove('is-rotating-left', 'is-rotating-right');
      void slide.offsetWidth;
      slide.classList.add(direction === 'right' ? 'is-rotating-right' : 'is-rotating-left');
      setTimeout(() => {
        renderHeroRotativo();
        slide.classList.remove('is-rotating-left', 'is-rotating-right');
      }, 700);
    }

    // Renderiza las cards del hero rotativo
    function renderHeroRotativo() {
      const slide = document.getElementById('hero-slide');
      if (!slide || heroData.length < 3) return;
      const order = [
        heroData[heroIndex % heroData.length],
        heroData[(heroIndex + 1) % heroData.length],
        heroData[(heroIndex + 2) % heroData.length]
      ];
      slide.innerHTML = '';
      order.forEach(card => {
        const cardElem = document.createElement('article');
        // Detecta si es la card de premium para no poner hover ni título
        const isPremium = card.nombre && card.nombre.toLowerCase().includes('premium');
        cardElem.className = 'hero-card' + (isPremium ? ' hero-promo' : ' hero-primary');
        const img = new Image();
        img.src = card.imagen;
        img.alt = card.nombre;
        img.loading = 'lazy';
        cardElem.appendChild(img);
        if (!isPremium) {
          // Icono hover
          const icon = new Image();
          icon.src = 'img/IconosCard/IconoPlay.png';
          icon.alt = 'Jugar';
          icon.className = 'hero-hover-icon';
          cardElem.appendChild(icon);
          // Título
          const title = document.createElement('div');
          title.className = 'hero-title';
          title.textContent = card.nombre;
          cardElem.appendChild(title);
        }
        slide.appendChild(cardElem);
      });
    }
  }

  startLoading();
});