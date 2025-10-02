document.addEventListener('DOMContentLoaded', () => {
  const sidebar   = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (sidebar && hamburger) {
    const toggle = () => {
      const willOpen = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', willOpen);
      hamburger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };
    hamburger.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        sidebar.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Flechas de los carruseles
  document.querySelectorAll('.rail-arrow').forEach(btn => {
    btn.addEventListener('click', function() {
      const railId = this.getAttribute('data-rail');
      const track = document.getElementById(railId);
      if (!track) return;
      const card = track.querySelector('.game-card');
      const cardWidth = card ? card.offsetWidth + 12 : 220; // 12px gap
      const dir = this.classList.contains('left') ? -1 : 1;

      // Agrega clase para animación
      track.classList.add('is-scrolling');
      track.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });

      // Quita la clase después de la animación (~400ms)
      setTimeout(() => {
        track.classList.remove('is-scrolling');
      }, 400);
    });
  });

  // HERO ROTATIVO
  let heroData = [];
  let heroIndex = 0;
  let heroReady = false;

  // Carga de JSON y pintado
  fetch('data/juegos.json')
    .then(r => r.json())
    .then(data => {
      // heroData es un array de objetos simples (id, nombre, imagen)
      heroData = Array.isArray(data.hero) ? data.hero : [];
      heroReady = heroData.length >= 3;
      renderHeroRotativo();
      renderRail('#rail-pop',   data.sections.pop);
      renderRail('#rail-cars',  data.sections.cars);
      renderRail('#rail-orig',  data.sections.orig);
      renderRail('#rail-premium', data.sections.premium);
    })
    .catch(err => {
      console.error('Error cargando JSON:', err);
    });

  // Rotar hero a la derecha
  document.getElementById('hero-arrow-right')?.addEventListener('click', () => {
    if (!heroReady) return;
    heroIndex = (heroIndex + 1) % heroData.length;
    animateHero('right');
  });

  // Rotar hero a la izquierda
  document.getElementById('hero-arrow-left')?.addEventListener('click', () => {
    if (!heroReady) return;
    heroIndex = (heroIndex - 1 + heroData.length) % heroData.length;
    animateHero('left');
  });

  function animateHero(direction) {
    const slide = document.getElementById('hero-slide');
    if (!slide) return;
    slide.classList.remove('is-rotating-left', 'is-rotating-right');
    void slide.offsetWidth; // reflow para reiniciar animación
    slide.classList.add(direction === 'right' ? 'is-rotating-right' : 'is-rotating-left');
    setTimeout(() => {
      renderHeroRotativo();
      slide.classList.remove('is-rotating-left', 'is-rotating-right');
    }, 700);
  }

  function renderHeroRotativo() {
    const slide = document.getElementById('hero-slide');
    if (!slide || heroData.length < 3) return;
    // Rotar el array para mostrar el orden correcto
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

  // Menú usuario expandible
  const avatarBtn = document.querySelector('.avatar');
  if (avatarBtn) {
    let userMenu = document.getElementById('user-menu');
    if (!userMenu) {
      userMenu = document.createElement('div');
      userMenu.id = 'user-menu';
      userMenu.className = 'user-menu';
      userMenu.innerHTML = `
        <div class="user-menu-avatar">
          <img src="img/IconosHeader/IconoUsuario2.png" alt="Usuario" />
        </div>
        <ul class="user-menu-list">
          <li><a href="#">Perfil</a></li>
          <li><a href="#">Configuración</a></li>
          <li><a href="#">Unirse al premium</a></li>
          <li><a href="#" class="cerrar-sesion">Cerrar sesión</a></li>
        </ul>
      `;
      document.body.appendChild(userMenu);
    }

    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('open');
      // Posicionar debajo del avatar
      const rect = avatarBtn.getBoundingClientRect();
      let left = rect.left + window.scrollX - 60;
      // Evita que el menú se salga por la derecha
      const menuWidth = 220;
      const maxLeft = window.innerWidth - menuWidth - 12;
      if (left > maxLeft) left = maxLeft;
      if (left < 8) left = 8;
      userMenu.style.top = `${rect.bottom + window.scrollY + 8}px`;
      userMenu.style.left = `${left}px`;
    });

    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target) && e.target !== avatarBtn) {
        userMenu.classList.remove('open');
      }
    });
  }

  // Small
  const smallImg = document.querySelector('#hero-small img');
  if (smallImg && hero.small) {
    smallImg.src = hero.small.imagen;
    smallImg.alt = hero.small.nombre;
    smallImg.loading = 'lazy';
  }
});

/* ---------- Render: HERO ---------- */
function renderHero(hero) {
  // Grande
  const bigImg = document.querySelector('#hero-big img');
  if (bigImg && hero.big) {
    bigImg.src = hero.big.imagen;
    bigImg.alt = hero.big.nombre;
    bigImg.loading = 'lazy';
  }

  // Mosaico 2×2
  const mosaic = document.querySelector('#hero-mosaic .mosaic');
  if (mosaic && Array.isArray(hero.mosaico)) {
    mosaic.innerHTML = '';
    hero.mosaico.slice(0,4).forEach(item => {
      const img = new Image();
      img.src = item.imagen;
      img.alt = item.nombre;
      img.loading = 'lazy';
      mosaic.appendChild(img);
    });
  }

  // Small
  const smallImg = document.querySelector('#hero-small img');
  if (smallImg && hero.small) {
    smallImg.src = hero.small.imagen;
    smallImg.alt = hero.small.nombre;
    smallImg.loading = 'lazy';
  }
}

/* ---------- Render: RAIL genérico ---------- */
function renderRail(selector, items = []) {
  const track = document.querySelector(selector);
  if (!track) return;
  track.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.dataset.id = item.id;

    // Imagen principal
    const img = new Image();
    img.src = item.imagen;
    img.alt = item.nombre;
    img.loading = 'lazy';
    img.className = 'card-img';

    // Icono centrado (ajusta el nombre si tu icono es diferente)
    const icon = new Image();
    icon.src = 'img/IconosCard/IconoPlay.png';
    icon.alt = 'Jugar';
    icon.className = 'card-hover-icon';

    // Título abajo a la derecha
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.nombre;

    card.appendChild(img);
    card.appendChild(icon);
    card.appendChild(title);
    track.appendChild(card);
  });
}

  // Small
  const smallImg = document.querySelector('#hero-small img');
  if (smallImg && hero.small) {
    smallImg.src = hero.small.imagen;
    smallImg.alt = hero.small.nombre;
    smallImg.loading = 'lazy';
  }

/* ---------- Render: RAIL genérico ---------- */
function renderRail(selector, items = []) {
  const track = document.querySelector(selector);
  if (!track) return;
  track.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.dataset.id = item.id;

    // Imagen principal
    const img = new Image();
    img.src = item.imagen;
    img.alt = item.nombre;
    img.loading = 'lazy';
    img.className = 'card-img';

    // Icono centrado (ajusta el nombre si tu icono es diferente)
    const icon = new Image();
    icon.src = 'img/IconosCard/IconoPlay.png';
    icon.alt = 'Jugar';
    icon.className = 'card-hover-icon';

    // Título abajo a la derecha
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.nombre;

    card.appendChild(img);
    card.appendChild(icon);
    card.appendChild(title);
    track.appendChild(card);
  });
}
