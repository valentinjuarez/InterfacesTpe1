// Módulo: Validación de contraseña (al menos 1 mayúscula)
export function hasUppercase(value) {
  return /[A-ZÁÉÍÓÚÑ]/.test(value || '');
}

export function setupPasswordValidation({
  formSelector = '.auth-form',
  inputSelector = '#password',
  errorSelector = '#password-error',
  message = 'La contraseña debe incluir al menos 1 mayúscula.'
} = {}) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const errorEl = document.querySelector(errorSelector);
  if (!form || !input || !errorEl) return;

  function validate(showMessage = true) {
    const value = input.value || '';
    const valid = hasUppercase(value);
    input.setAttribute('aria-invalid', String(!valid));
    if (showMessage) {
      errorEl.textContent = valid ? '' : message;
    }
    return valid;
  }

  input.addEventListener('input', () => {
    if (input.value.length === 0) {
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
