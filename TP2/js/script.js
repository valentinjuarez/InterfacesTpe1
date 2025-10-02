// Mostrar/ocultar contraseña de forma accesible
(function(){
  const btn = document.querySelector('.toggle-visibility');
  const input = document.getElementById('password');
  if(!btn || !input) return;
  btn.addEventListener('click', () => {
    const visible = btn.getAttribute('aria-pressed') === 'true';
    const nextVisible = !visible;
    btn.setAttribute('aria-pressed', String(nextVisible));
    btn.dataset.visible = String(nextVisible);
    input.type = nextVisible ? 'text' : 'password';
    btn.setAttribute('aria-label', nextVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');

  });
  // Asegura estado inicial: contraseña oculta y ojo tachado visible
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Mostrar contraseña');
})();
