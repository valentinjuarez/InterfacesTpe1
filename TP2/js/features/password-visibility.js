// Módulo: Mostrar/ocultar contraseña de forma accesible
export function setupPasswordVisibility({ buttonSelector = '.toggle-visibility', inputSelector = '#password' } = {}) {
  const btn = document.querySelector(buttonSelector);
  const input = document.querySelector(inputSelector);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const visible = btn.getAttribute('aria-pressed') === 'true';
    const nextVisible = !visible;
    btn.setAttribute('aria-pressed', String(nextVisible));
    btn.dataset.visible = String(nextVisible);
    input.type = nextVisible ? 'text' : 'password';
    btn.setAttribute('aria-label', nextVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  // Estado inicial
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Mostrar contraseña');
}
