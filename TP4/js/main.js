// js/main.js
import AppView from './view/appView.js';
import PreGameMenu from './view/preGameMenu.js';
import TableroView from './view/tableroView.js';
import InputController from './controller/inputController.js';
import Tablero from './model/tablero.js';
import JuegoController from './controller/juegoController.js';

// Obtener canvas y contexto 2D antes de crear vistas/controladores
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Flag para cargar un tablero "casi resuelto" (activar con ?victoria en la URL)
const MODO_VICTORIA = typeof window !== 'undefined' && window.location?.search?.includes('victoria');

// Crear modelo y view del tablero con ctx disponible
const tablero = new Tablero(MODO_VICTORIA ? Tablero.layoutCasiResuelto7x7() : undefined); // modelo
const boardView = new TableroView(ctx, tablero);      // view con modelo

// Declarar juego para poder referenciarlo desde el callback del menú
let juego;
// Callback de menú que arranca el juego usando el orquestador
const iniciarJuego = () => {
  juego.startJuego(tablero, boardView);
};

// Creamos las vistas
const menuView = new PreGameMenu(ctx, iniciarJuego);

// InputController se encarga de los eventos del canvas y delega a JuegoController
const inputController = new InputController(canvas, null);

// Orquestador principal
juego = new JuegoController({ inputController, menuView, boardView, tablero });

// Conectar callbacks UI desde la vista hacia la orquestación (reiniciar / volver al menú)
boardView.onReset = () => {
  // Reiniciar modelo al layout elegido y limpiar estado
  tablero.reiniciar(MODO_VICTORIA ? Tablero.layoutCasiResuelto7x7() : Tablero.layoutClasico7x7());
  if (juego.tableroController?.clearSelection) {
    juego.tableroController.clearSelection();
  }
  if (boardView?.clearGameOver) {
    boardView.clearGameOver();
  }
  // Forzar redraw
  boardView.draw();
};

boardView.onHome = () => {
  // Volver al menú principal
  if (juego.tableroController?.clearSelection) juego.tableroController.clearSelection();
  if (boardView?.clearGameOver) boardView.clearGameOver();
  juego.irAlMenu();
};

// Composición de la App (AppView orquesta sub-views)
const appView = new AppView(ctx, menuView, boardView, '#5b2def'); // color de fondo gestionado por AppView

// Bucle principal
function loop(ts) {
  appView.render(juego.getEstado(), ts || 0);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Orquestador: crea model, views y controllers y conecta InputController.
// Recomendación: evitar manipular tamaño/estilos del canvas aquí; hacerlo vía CSS o en AppView si es necesario.
