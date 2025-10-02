// Módulo: Validación de email (requerido + formato)
export function isValidEmail(value) {
  // Valida estructura básica: algo@algo.dominio (sin espacios)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

export function setupEmailValidation({
  formSelector = '.auth-form',
  inputSelector = '#email',
  errorSelector = '#email-error',
  requiredMessage = 'El email es obligatorio.',
  invalidMessage = 'Ingresa un email válido.'
} = {}) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const errorEl = document.querySelector(errorSelector);
  if (!form || !input || !errorEl) return;

  function validate(showMessage = true) {
    const value = (input.value || '').trim();
    let valid = true;
    let message = '';

    if (value.length === 0) {
      valid = false;
      message = requiredMessage;
    } else if (!isValidEmail(value)) {
      valid = false;
      message = invalidMessage;
    }

    input.setAttribute('aria-invalid', String(!valid));
    if (showMessage) errorEl.textContent = message;
    return valid;
  }

  input.addEventListener('input', () => {
    const value = input.value || '';
    if (value.length === 0) {
      input.setAttribute('aria-invalid', 'false');
      errorEl.textContent = '';
    } else {
      validate(true);
    }
  });

  form.addEventListener('submit', (e) => {
    if (!validate(true)) {
      e.preventDefault();
      input.focus();
    }
  });

  return { validate };
}
