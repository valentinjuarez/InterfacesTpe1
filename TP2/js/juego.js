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
});
