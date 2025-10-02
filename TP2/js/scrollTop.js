// Mostrar/ocultar botón scroll-top y animar scroll arriba
const btnScrollTop = document.getElementById('btnScrollTop');
window.addEventListener('scroll', function() {
  if (window.scrollY > 200) {
    btnScrollTop.style.display = 'flex';
  } else {
    btnScrollTop.style.display = 'none';
  }
});
btnScrollTop.addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
btnScrollTop.style.display = 'none';