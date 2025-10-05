import { setupEmailValidation } from '../features/email-validation.js';
import { setupSimpleProgress } from '../features/simple-progress.js';
import { setupAgeValidation } from '../features/age-validation.js';
import { setupPasswordValidation } from '../features/password-validation.js';
import { setupPasswordVisibility } from '../features/password-visibility.js';

// Inicializa la validación de email (paso 1)
setupEmailValidation();

// Progreso simple; maneja también el botón Atrás por dentro y dispara overlay al completar
setupSimpleProgress({
	onComplete: () => {
		const overlay = document.querySelector('.register-success');
		if (!overlay) return;
		overlay.classList.add('is-visible');
		overlay.setAttribute('aria-hidden', 'false');
		// Opcional: deshabilitar el botón para evitar más clics
		const nextBtn = document.querySelector('.left-slot .btn-submit');
		if (nextBtn) nextBtn.setAttribute('disabled', 'true');
	}
});

// Validación de edad (> 5 años) en Paso 2
setupAgeValidation();

// Reutilizar validación de contraseña (al menos 1 mayúscula) en Paso 3
setupPasswordValidation({
	formSelector: '.auth-form',
	inputSelector: '#reg-password',
	errorSelector: '#reg-password-error',
	message: 'La contraseña debe incluir al menos 1 mayúscula.'
});
setupPasswordValidation({
	formSelector: '.auth-form',
	inputSelector: '#reg-password2',
	errorSelector: '#reg-password2-error',
	message: 'La contraseña debe incluir al menos 1 mayúscula.',
	matchWith: '#reg-password',
	mismatchMessage: 'Las contraseñas no coinciden.'
});

// Mostrar/ocultar contraseña en Paso 3 (dos campos)
setupPasswordVisibility({ buttonSelector: '#reg-password-field .toggle-visibility', inputSelector: '#reg-password' });
setupPasswordVisibility({ buttonSelector: '#reg-password2-field .toggle-visibility', inputSelector: '#reg-password2' });
