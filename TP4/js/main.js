// js/main.js
import AppView from './view/appView.js';
import PreGameMenu from './view/preGameMenu.js';
import TableroView from './view/tableroView.js';
import InputController from './controller/inputController.js';
import Tablero from './model/tablero.js';
import TableroController from './controller/tableroController.js';

// Estado inicial
let estado = 'menu'; // 'menu' | 'jugando'

// Obtenemos el canvas que ya está en tu HTML
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Función llamada cuando se hace clic en "JUGAR"
function iniciarJuego() {
  estado = 'jugando';
}

// Creamos las vistas
const menuView = new PreGameMenu(ctx, iniciarJuego);

// Crear modelo y view del tablero
const tablero = new Tablero();                        // modelo
const boardView = new TableroView(ctx, tablero);      // view con modelo

// Crear controller que maneja la lógica del tablero (sin canvas)
const tableroController = new TableroController(tablero, boardView);

// Conectar callbacks UI desde la vista hacia la orquestación (reiniciar / volver al menú)
boardView.onReset = () => {
  // Reiniciar modelo al layout clásico y limpiar estado
  tablero.reiniciar(Tablero.layoutClasico7x7());
  if (tableroController && typeof tableroController.clearSelection === 'function') {
    tableroController.clearSelection();
  }
  if (boardView && typeof boardView.clearGameOver === 'function') {
    boardView.clearGameOver();
  }
  // Forzar redraw
  boardView.draw();
};

boardView.onHome = () => {
  // Volver al menú principal
  estado = 'menu';
  // limpiar overlays/selección
  if (tableroController && typeof tableroController.clearSelection === 'function') tableroController.clearSelection();
  if (boardView && typeof boardView.clearGameOver === 'function') boardView.clearGameOver();
};

// Composición de la App (AppView orquesta sub-views)
const appView = new AppView(ctx, menuView, boardView, '#5b2def'); // color de fondo gestionado por AppView

// InputController se encarga de los eventos del canvas y delega a las views/controllers
const inputController = new InputController(canvas, menuView, boardView, () => estado);

// Bucle principal
function loop(ts) {
  appView.render(estado, ts || 0);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Orquestador: crea model, views y controllers y conecta InputController.
// Recomendación: evitar manipular tamaño/estilos del canvas aquí; hacerlo vía CSS o en AppView si es necesario.
