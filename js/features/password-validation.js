// Validación de contraseña (al menos 1 mayúscula)
export function hasUppercase(value) {
  return /[A-ZÁÉÍÓÚÑ]/.test(value || '');
}

export function setupPasswordValidation({
  formSelector = '.auth-form',
  inputSelector = '#password',
  errorSelector = '#password-error',
  message = 'La contraseña debe incluir al menos 1 mayúscula.',
  matchWith,
  mismatchMessage = 'Las contraseñas no coinciden.'
} = {}) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const errorEl = document.querySelector(errorSelector);
  if (!form || !input || !errorEl) return;

  // Si el input está dentro de un paso (register), detectarlo para omitir validación cuando esté oculto
  const stepEl = input.closest('.step');
  const otherInput = matchWith ? document.querySelector(matchWith) : null;

  function validate(showMessage = true) {
    // Si el campo pertenece a un paso oculto, no valida
    if (stepEl && stepEl.hasAttribute('hidden')) return true;
    const value = input.value || '';

    // Validación base: al menos una mayúscula
    let ok = hasUppercase(value);
    let msg = ok ? '' : message;

    // Si se requiere coincidencia con otro input, validar también
    if (ok && otherInput) {
      const otherVal = otherInput.value || '';
      // Solo marcar mismatch si ambos tienen algo
      if (value.length > 0 && otherVal.length > 0 && value !== otherVal) {
        ok = false;
        msg = mismatchMessage;
      }
    }

    input.setAttribute('aria-invalid', String(!ok));
    if (showMessage) errorEl.textContent = ok ? '' : msg;
    return ok;
  }

  input.addEventListener('input', () => {
    if (input.value.length === 0) {
      input.setAttribute('aria-invalid', 'false');
      errorEl.textContent = '';
    } else {
      validate(true);
    }
  });

  // Si hay campo de referencia, revalidar éste cuando el otro cambie
  if (otherInput) {
    otherInput.addEventListener('input', () => {
      if ((input.value || '').length === 0) {
        input.setAttribute('aria-invalid', 'false');
        errorEl.textContent = '';
        return;
      }
      validate(true);
    });
  }

  form.addEventListener('submit', (e) => {
    if (!validate(true)) {
      e.preventDefault();
      input.focus();
    }
  });

  return { validate };
}
