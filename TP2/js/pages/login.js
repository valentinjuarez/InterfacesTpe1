import { setupPasswordVisibility } from '../features/password-visibility.js';
import { setupPasswordValidation } from '../features/password-validation.js';
import { setupEmailValidation } from '../features/email-validation.js';

// Inicializar comportamientos de la página de login
setupPasswordVisibility();
setupPasswordValidation();
setupEmailValidation();
