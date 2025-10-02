// Cambia el color del botón enviar según el input
document.addEventListener('DOMContentLoaded', function() {
  const inputComentario = document.querySelector('.interaccion input');
  const btnEnviar = document.querySelector('.interaccion button');
  if (inputComentario && btnEnviar) {
    function toggleBtnEnviar() {
      if (inputComentario.value.trim().length > 0) {
        btnEnviar.classList.add('activo');
      } else {
        btnEnviar.classList.remove('activo');
      }
    }
    inputComentario.addEventListener('input', toggleBtnEnviar);
    toggleBtnEnviar();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const likeFilled = '../assets/likerelleno.png';
  const likeEmpty = 'assets/icons8-me-gusta-100.png';

  document.querySelectorAll('.btn-like').forEach(btn => {
    btn.addEventListener('click', function() {
      const img = btn.querySelector('img');
      btn.classList.toggle('active');
      img.src = btn.classList.contains('active') ? likeFilled : likeEmpty;
    });
  });

  document.querySelectorAll('.btn-dislike').forEach(btn => {
    btn.addEventListener('click', function() {
      const img = btn.querySelector('img');
      btn.classList.toggle('active');
      img.src = btn.classList.contains('active') ? likeFilled : likeEmpty;
    });
  });

  const btnCompartir = document.getElementById("btnCompartir");
  const ventanaCompartir = document.getElementById("ventanaCompartir");
  if (btnCompartir && ventanaCompartir) {
    btnCompartir.addEventListener("click", () => {
      ventanaCompartir.classList.toggle("activa");
    });
  }
});
