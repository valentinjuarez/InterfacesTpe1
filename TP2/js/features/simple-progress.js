// Feature: Progreso simple (3 pasos) sin cosas raras
// - Actualiza texto/porcentaje
// - Muestra/oculta pasos por data-step
// - "Siguiente" dispara un submit sintético cancelable; si no lo cancelan, avanza
// - "Atrás": si paso>1 vuelve un paso; si es 1 navega a exitUrl
export function setupSimpleProgress({
  formSelector = '.left-slot .auth-form',
  nextBtnSelector = '.left-slot .btn-submit',
  backBtnSelector = '.btn-inicio',
  statusSelector = '.left-slot .progress-status',
  barSelector = '.left-slot .progress-bar',
  fillSelector = '.left-slot .progress-fill',
  totalSteps = 3,
  initialStep = 1,
  exitUrl = 'login.html',
  onComplete,
} = {}) {
  const form = document.querySelector(formSelector);
  const nextBtn = document.querySelector(nextBtnSelector);
  const backBtn = document.querySelector(backBtnSelector);
  const statusEl = document.querySelector(statusSelector);
  const barEl = document.querySelector(barSelector);
  const fillEl = document.querySelector(fillSelector);
  const stepEls = Array.from(document.querySelectorAll('.auth-form .step'));

  let currentStep = Math.max(1, Math.min(totalSteps, initialStep));

  function render() {
    const percent = Math.round((currentStep / totalSteps) * 100);
    if (statusEl) statusEl.innerHTML = `<strong>${currentStep} de ${totalSteps}</strong>`;
    if (barEl) barEl.setAttribute('aria-valuenow', String(percent));
    if (fillEl) fillEl.style.width = percent + '%';

    // Mostrar solo el paso activo (sin deshabilitar campos)
    if (stepEls.length) {
      stepEls.forEach((el) => {
        const stepNum = Number(el.getAttribute('data-step')) || 0;
        const active = stepNum === currentStep;
        el.classList.toggle('is-active', active);
        if (active) {
          el.removeAttribute('hidden');
        } else {
          el.setAttribute('hidden', '');
        }
      });
    }
  }

  function next() {
    if (currentStep < totalSteps) {
      currentStep += 1;
      render();
    }
  }

  function prev() {
    if (currentStep > 1) {
      currentStep -= 1;
      render();
    }
  }

  function setStep(step) {
    const s = Number(step);
    if (!Number.isFinite(s)) return;
    currentStep = Math.max(1, Math.min(totalSteps, s));
    render();
  }

  function getStep() {
    return currentStep;
  }

  // Botón Siguiente: submit sintético básico, sin bubbles ni extras
  if (nextBtn && form) {
    nextBtn.addEventListener('click', () => {
      const evt = new Event('submit', { cancelable: true });
      const cancelled = !form.dispatchEvent(evt);
      if (cancelled) return; // alguna validación bloqueó
      if (currentStep < totalSteps) {
        next();
      } else {
        // Último paso: completar
        if (typeof onComplete === 'function') {
          try { onComplete({ form, currentStep, totalSteps }); } catch {}
        }
      }
    });
  }

  // Botón Atrás: vuelve un paso si >1; si es 1, navega a exitUrl
  if (backBtn) {
    if (exitUrl) backBtn.setAttribute('href', exitUrl);
    backBtn.addEventListener('click', (e) => {
      if (currentStep > 1) {
        e.preventDefault();
        prev();
      }
    });
  }

  // inicializar
  render();

  return { render, next, prev, setStep, getStep };
}
