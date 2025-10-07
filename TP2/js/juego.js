/**
 * juego.js (unificado)
 * - Maneja: botón enviar (estado activo), likes/dislikes, ventana compartir y botón "volver arriba".
 * - Archivo unificado para reducir listeners duplicados y centralizar la lógica del UI.
 *
 * Rutas de imágenes usadas (relativas a este script):
 * - likeFilled: imagen para like activado
 * - likeEmpty: imagen para like desactivado
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos de comentarios / enviar
  const inputComentario = document.querySelector('.interaccion input');
  const btnEnviar = document.querySelector('.interaccion button');

  // Imágenes para like/dislike
  const likeFilled = '../assets/likerelleno.png';
  const likeEmpty = 'assets/icons8-me-gusta-100.png';

  // Compartir
  const btnCompartir = document.getElementById('btnCompartir');
  const ventanaCompartir = document.getElementById('ventanaCompartir');

  // Scroll-top
  const btnScrollTop = document.getElementById('btnScrollTop');

  /**
   * toggleBtnEnviar
   * - Activa la clase `activo` en el botón enviar cuando hay texto válido en el input.
   * - Esto permite cambiar visualmente (CSS) el estado del botón.
   */
  function toggleBtnEnviar() {
    if (!inputComentario || !btnEnviar) return;
    if (inputComentario.value.trim().length > 0) {
      btnEnviar.classList.add('activo');
    } else {
      btnEnviar.classList.remove('activo');
    }
  }

  if (inputComentario && btnEnviar) {
    inputComentario.addEventListener('input', toggleBtnEnviar);
    // Estado inicial
    toggleBtnEnviar();
    // Vaciar el input al presionar el botón enviar
    btnEnviar.addEventListener('click', (e) => {
      // Evitar comportamiento por defecto si el botón está dentro de un form
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (!inputComentario) return;
      // Sólo vaciamos si hay contenido (comportamiento opcional)
      if (inputComentario.value.trim().length > 0) {
        inputComentario.value = '';
        toggleBtnEnviar();
        // devolver foco al input para facilitar seguir escribiendo
        inputComentario.focus();
      }
    });
  }

  /**
   * setupLikes
   * - Añade el listener a todos los botones con clase `.btn-like`.
   * - Alterna la clase `active` y cambia la fuente de la imagen.
   */
  function setupLikes() {
    document.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', () => {
        const img = btn.querySelector('img');
        btn.classList.toggle('active');
        if (img) img.src = btn.classList.contains('active') ? likeFilled : likeEmpty;
      });
    });
  }

  /**
   * setupDislikes
   * - Igual que likes, pero para `.btn-dislike`. Mantiene la misma imagen toggle.
   */
  function setupDislikes() {
    document.querySelectorAll('.btn-dislike').forEach(btn => {
      btn.addEventListener('click', () => {
        const img = btn.querySelector('img');
        btn.classList.toggle('active');
        if (img) img.src = btn.classList.contains('active') ? likeFilled : likeEmpty;
      });
    });
  }

  setupLikes();
  setupDislikes();

  // Toggle de la ventana compartir
  if (btnCompartir && ventanaCompartir) {
    btnCompartir.addEventListener('click', () => {
      ventanaCompartir.classList.toggle('activa');
    });
  }

  /**
   * setupScrollTop
   * - Muestra/oculta el botón de volver arriba según el scroll.
   * - Añade comportamiento smooth scroll al hacer click.
   */
  function setupScrollTop() {
    if (!btnScrollTop) return;

    function handleScroll() {
      btnScrollTop.style.display = window.scrollY > 200 ? 'flex' : 'none';
    }

    window.addEventListener('scroll', handleScroll);
    btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Estado inicial
    handleScroll();
  }

  setupScrollTop();

  // Toggle barra izquierda: expandir a la derecha y mostrar textos
  const leftNav = document.querySelector('.left-nav');
  const hamButtons = document.querySelectorAll('#btnHamburguesa');
  const iconoMenu = document.getElementById('iconoMenu'); // si existiera un único img

  // Rutas principales y de fallback (por si falta el ícono)
  const ICON_MENU_PRIMARY  = 'assets/icons8-menu-papas-fritas-48.png';
  const ICON_CLOSE_PRIMARY = 'assets/icons8-close-48.png';
  const ICON_MENU_FALLBACK = 'img/IconosHeader/IconoMenuHamburguesa.png';
  const ICON_CLOSE_FALLBACK= 'img/IconosHeader/IconoCancelar.png';

  function setImgWithFallback(imgEl, srcPrimary, altText, srcFallback) {
    if (!imgEl) return;
    imgEl.onerror = function () {
      // Evita bucle si también falla el fallback
      imgEl.onerror = null;
      imgEl.src = srcFallback;
    };
    imgEl.src = srcPrimary;
    imgEl.alt = altText;
  }

  function setLeftNav(open) {
    if (!leftNav) return;
    leftNav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    hamButtons.forEach(btn => btn.setAttribute('aria-expanded', open ? 'true' : 'false'));

    // Actualiza todos los <img> dentro de los botones hamburguesa
    hamButtons.forEach(btn => {
      const img = btn.querySelector('img');
      if (open) {
        setImgWithFallback(img, ICON_CLOSE_PRIMARY, 'Cerrar menú', ICON_CLOSE_FALLBACK);
      } else {
        setImgWithFallback(img, ICON_MENU_PRIMARY, 'Abrir menú', ICON_MENU_FALLBACK);
      }
    });

    // Si existe un ícono único con id, también lo actualizamos
    if (iconoMenu) {
      if (open) {
        setImgWithFallback(iconoMenu, ICON_CLOSE_PRIMARY, 'Cerrar menú', ICON_CLOSE_FALLBACK);
      } else {
        setImgWithFallback(iconoMenu, ICON_MENU_PRIMARY, 'Abrir menú', ICON_MENU_FALLBACK);
      }
    }
  }

  if (leftNav && hamButtons.length) {
    const toggle = () => setLeftNav(!leftNav.classList.contains('open'));
    hamButtons.forEach(btn => {
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); toggle(); }, { passive: false });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setLeftNav(false); });
  }

  
  // Menú de usuario (popup)
  const avatarBtns = document.querySelectorAll('.avatar-trigger');
  const userMenu = document.getElementById('user-menu');

  function setUserMenu(open) {
    if (!userMenu) return;
    userMenu.classList.toggle('open', open);
    userMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    avatarBtns.forEach(btn => btn.setAttribute('aria-expanded', open ? 'true' : 'false'));
  }

  if (userMenu && avatarBtns.length) {
    const toggle = () => setUserMenu(!userMenu.classList.contains('open'));
    avatarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(); }
      });
    });
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) setUserMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setUserMenu(false);
    });
    window.addEventListener('resize', () => setUserMenu(false));
  }
});





