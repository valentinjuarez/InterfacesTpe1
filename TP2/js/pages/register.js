import { setupEmailValidation } from '../features/email-validation.js';
import { setupSimpleProgress } from '../features/simple-progress.js';
import { setupAgeValidation } from '../features/age-validation.js';

// Inicializa la validación de email (paso 1)
setupEmailValidation();

// Progreso simple; maneja también el botón Atrás por dentro
setupSimpleProgress();

// Validación de edad (> 5 años) en Paso 2
setupAgeValidation();
