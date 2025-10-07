// Validación de edad (> 5 años)
export function setupAgeValidation({
  formSelector = '.auth-form',
  inputSelector = '#age',
  errorSelector = '#age-error',
  minAge = 6,
  message = 'La edad necesita ser mayor de 5 años.'
} = {}) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const errorEl = document.querySelector(errorSelector);
  if (!form || !input || !errorEl) return { validate: () => true };

  // Paso contenedor del campo (si existe)
  const stepEl = input.closest('.step');

  function validate(showMessage = true) {
    // Si el campo pertenece a un paso oculto, no valida
    if (stepEl && stepEl.hasAttribute('hidden')) return true;
    const value = (input.value || '').trim();
    const n = Number(value);
    const ok = Number.isFinite(n) && n >= minAge;
    input.setAttribute('aria-invalid', String(!ok));
    if (showMessage) errorEl.textContent = ok ? '' : message;
    return ok;
  }

  input.addEventListener('input', () => {
    if (validate(false)) {
      errorEl.textContent = '';
      input.setAttribute('aria-invalid', 'false');
    }
  });

  form.addEventListener('submit', (e) => {
    if (!validate(true)) e.preventDefault();
  });

  return { validate };
}
